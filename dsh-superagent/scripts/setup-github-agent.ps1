<#
.SYNOPSIS
  把 dsh-superagent 的 GitHub Source 接到一个仓库上（Windows）。

.DESCRIPTION
  分两步：

  1. 登录一个**专用 agent 账号**到独立的 gh 配置目录（与操作者自己的 gh 登录互不影响），
     并把目标仓库的读 + 推权限给它。
  2. 通过 Management API 写入 GitHub Source 的配置（repository / cli / 观察开关）。

  第 2 步会校验 agent 账号能否推送到仓库，所以第 1 步没做完时第 2 步会被拒绝
  （agentCliSignedOut / repositoryReadOnly）。

.EXAMPLE
  pwsh -File scripts\setup-github-agent.ps1 -Repository test12031/test
#>
[CmdletBinding()]
param(
  [string]$Repository = 'test12031/test',
  [string]$GhExe = 'C:\Program Files\GitHub CLI\gh.exe',
  [string]$StateDir = 'C:\Users\Administrator\.dsh\state\superagent',
  [string]$ApiBase = 'http://127.0.0.1:12582/orchestrator/api',
  [switch]$SkipLogin
)

$ErrorActionPreference = 'Stop'
$GhConfigDir = Join-Path $StateDir 'gh-agent'
$Headers = @{ 'x-orchestrator-request' = '1'; 'content-type' = 'application/json' }

# --- 1. agent 账号登录 ---------------------------------------------------------------
if (-not $SkipLogin) {
  New-Item -ItemType Directory -Force -Path $GhConfigDir | Out-Null
  $env:GH_CONFIG_DIR = $GhConfigDir
  Write-Host "登录 agent 账号到 $GhConfigDir （浏览器里完成授权）" -ForegroundColor Cyan
  & $GhExe auth login --hostname github.com --git-protocol https --web
  if ($LASTEXITCODE -ne 0) { throw "gh auth login 失败（exit $LASTEXITCODE）" }
  & $GhExe auth status
}

# --- 2. 校验账号能读能推 -------------------------------------------------------------
$env:GH_CONFIG_DIR = $GhConfigDir
$login = (& $GhExe api user --jq .login).Trim()
Write-Host "agent 账号：$login" -ForegroundColor Cyan
& $GhExe api "repos/$Repository" --jq '{repo: .full_name, push: .permissions.push}'
if ($LASTEXITCODE -ne 0) {
  throw "agent 账号读不到 $Repository —— 请在 GitHub 上把该账号加为 collaborator（需要 push 权限）"
}

# --- 3. 写入 GitHub Source 配置 ------------------------------------------------------
$settings = (Invoke-WebRequest -Uri "$ApiBase/settings" -Headers $Headers -UseBasicParsing -TimeoutSec 30).Content | ConvertFrom-Json
$source = $settings.sources | Where-Object { $_.id -eq 'github' }
$value = $source.value
$value.config.repository = $Repository
$value.config.cli = $GhExe
$value.config.pollSeconds = 60
$value.config.failuresBeforeError = 3
$value.config.observeIssues = $true
$value.config.observePulls = $true
$value.config.observeComments = $true
$value.config.observeCi = $false

$body = @{ value = $value; revision = $source.revision } | ConvertTo-Json -Depth 8
try {
  $r = Invoke-WebRequest -Uri "$ApiBase/settings/source:github" -Method PUT -Headers $Headers -Body $body -UseBasicParsing -TimeoutSec 180
  Write-Host "已保存：$($r.Content)" -ForegroundColor Green
}
catch {
  $resp = $_.Exception.Response
  if ($resp) {
    $reader = New-Object IO.StreamReader($resp.GetResponseStream())
    throw "保存被拒绝：$($reader.ReadToEnd())"
  }
  throw
}

Write-Host "完成。面板入口：左侧栏 Superagent → 来源 → GitHub。" -ForegroundColor Green
