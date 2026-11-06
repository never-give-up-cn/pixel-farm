# 移植说明（dsh-superagent → 本机 DSH）

上游：<https://github.com/deepseek-ai/dsh-superagent-prototype>（MIT，研究原型）。
本目录是移植后的**可安装 bundle**，与上游 `src/` 保持同源，仅做下列适配。

## 移植原因

上游原始代码面向 Linux/macOS 的 DSH `0.2.1-alpha.2`，无法直接装进本机的
`desktop` profile（DSH `0.2.1-rc.5`，Windows）。

## 代码改动

| 文件 | 改动 | 原因 |
| --- | --- | --- |
| `src/deployment.ts` | `absolute()` 的正则由 `^/` 改为 `^(?:/\|[A-Za-z]:[\\/])` | 上游只接受 POSIX 绝对路径，Windows 盘符路径会被配置校验拒绝 |
| `src/app/http.ts` | `sameOrigin()` 接受 `number \| undefined`；新增 `portOf(ctx)`，优先 `webServer.port`，否则解析 `webServer.getOrigin()` | rc.5 的 `WebServer.port` 在监听前是 `undefined` |
| `src/app/http.ts` | 循环回环检查由 `host !== '127.0.0.1'` 放宽到 `127.0.0.1 / localhost / ::1` | 桌面端可能以 `localhost` 绑定 |
| `src/client/deployment.tsx` | 删除 `snapshot?.mode === 'memory'` 分支 | rc.5 的 `ConfigFormSnapshot` 不再有 `mode` 字段 |
| `src/client/text.ts`、`src/client/locales.ts` | 仍从 `@deepseek-ai/dsh-client-ui-slots` 取 `Translate` / `LocaleNamespaceMap` | rc.5 中这两个类型仍在此包，只是它不再随 DSH 安装分发 |
| `src/deployment.ts` | `workerProbe()` 在 Windows 上不再用 POSIX `env PATH=...` 前缀，改用子进程环境的 `PATH` 显式条目 | Windows 没有 `env` 程序，探测命令会以 `spawn env ENOENT` 失败，导致账号校验永远过不去 |
| `src/infra/environment.ts` | 新增 `ghConfigDir(stateDir)`；`agentVariables()` 在 Windows 上设置 `GH_CONFIG_DIR`；`workerProbe()` 同样传入 | POSIX 用包装脚本隔离 agent 账号，Windows 的 `execFile` 跑不了 `.cmd`/`.sh`，改用独立 gh 配置目录隔离账号 |
| `src/infra/environment.ts` | `writeEnvironment()` 在 Windows 上把 shim 写成 `.cmd` 批处理（`written()` 同步识别 `rem` 标记） | Windows worker 用 cmd/pwsh 执行命令，跑不了 `#!/bin/sh` 脚本 |
| `src/infra/environment.ts` | `credentialHelper()` 把 `C:\dir\gh.exe` 转成 `/c/dir/gh.exe` | git 的 `!` 凭据助手由 Git for Windows 的 sh 执行，POSIX shell 认不出反斜杠盘符路径 |
| `src/infra/environment.ts` | `applyEnvironment()` 在 Windows 上把 Git for Windows 的 `usr\bin` 追加到 worker 的 PATH | 准备命令固定用 `sh -c`，而 `sh.exe` 不在默认 PATH 里 |
| `src/policy.ts` | `executor.directory` 除 POSIX 绝对路径外也接受 Windows 盘符路径 | 与 `src/deployment.ts` 的 `absolute()` 保持一致 |
| `src/app/sessions.ts` | 主 Session 的 `tools.restrict()` 白名单不再硬编码 `bash`，改为按本 profile 实际存在的全局工具过滤（`MASTER_TOOLS`） | `restrict()` 遇到未知的全局工具名会直接抛错，Windows 上只有 `pwsh`，整个插件会启动失败 |
| `src/app/sessions.ts` | `noWait()` 同时识别 `bash` 与 `pwsh` | Windows 上主 Session 的 shell 工具名是 `pwsh` |
| `src/infra/environment.ts` | `written()` 按 `/\r?\n/` 切行 | Windows 的 `.cmd` shim 用 CRLF 换行，按 `\n` 切分会把 `\r` 留在行尾，标记匹配不上，报 `foreignFile` |
| `src/index.ts` | 启动失败时把异常栈写到 `<stateDir>/startup-error.log` | fiber 失败时面板上看不到原因 |
| `src/sources/github.ts` | `pollBranchCi()` 把 HTTP 409（空仓库没有默认分支）当作「暂无 CI」而不是读取失败 | 空仓库时 `GET /commits/<branch>` 必然 409，上游把它算作整轮轮询失败，连累 Issue/PR/评论流一起报错 |
| `package.json`（待加固） | 运行时依赖 `zod` 已被 tsdown 打进 `lib/index.js`；`proper-lockfile` 仍是顶层裸导入，靠 DSH 插件加载器把它解析到 Harness 应用自带的依赖上 | profile 的 `node_modules` 里除了这个 link 之外没有任何包，磁盘上也找不到 `proper-lockfile`；插件能启动是因为加载器兜底解析，Harness 升级后这个隐式依赖有失效风险。建议把 `proper-lockfile` 也加入 tsdown 的 `noExternal` |

## 清单改动

- `package.json`：所有 `@deepseek-ai/*` 依赖钉到 `0.2.1-rc.5`，`engines.dsh` 改为 `^0.2.1-rc.5`，
  `packageManager` 改为本机可用的 `pnpm@11.28.5`。
- `@deepseek-ai/dsh-client-ui-slots` **只**进 `devDependencies`：它是纯类型包，DSH 安装目录里没有它，
  放进 `peerDependencies` 会成为未满足的 peer 依赖而阻止安装。
- 新增 `react-dom` / `@types/react-dom`（上游 package.json 漏列）。
- 新增 `icon.svg`（原创锤子图形，与侧栏 `HammerIcon` 同源意象），并声明 `"icon": "./icon.svg"`。

## 补丁层改动

`cordis.patch.yml` 的 `dsh-superagent` 行带上 `stateDir`，默认值
`C:\Users\Administrator\.dsh\state\superagent`，可在 profile 自己的 `cordis.patch.yml` 中覆盖。

## 构建

```sh
pnpm install
pnpm typecheck   # 0 error
pnpm build       # tsdown -> lib/index.js (ESM) + lib/client.js (CJS)
```

## 已知限制（Windows）

- 执行 GitHub 工单需要一个专用 agent 账号登录 `gh`。本机装的 `gh` 在
  `C:\Program Files\GitHub CLI\gh.exe`，账号登录在独立配置目录里，与操作者自己的 gh 登录互不影响：
  ```sh
  set GH_CONFIG_DIR=C:\Users\Administrator\.dsh\state\superagent\gh-agent
  "C:\Program Files\GitHub CLI\gh.exe" auth login --hostname github.com --git-protocol https --web
  ```
  该账号还需要对目标仓库有读**和推**权限，否则 setup 报 `repositoryReadOnly`。
- agent 账号隔离在 Windows 上靠 `GH_CONFIG_DIR`（上游在 POSIX 上靠包装脚本）。
  改这个目录等于换账号，setup 会重跑。
- `applyEnvironment()` 会改写进程级 `process.env`（PATH、git 配置、GH_TOKEN、GH_CONFIG_DIR），
  且账号变更会触发 `ctx.fiber.restart()` —— 在 `desktop` profile 里这会重启当前 Harness 进程。
  因此**建议**按上游文档另起一个独立 profile 承载实际执行，侧栏入口留在本 profile 做面板入口也可以。
- worker 侧的命令 shim 在 Windows 上是 `.cmd`；准备命令仍按上游固定用 `sh -c` 执行，
  依赖 Git for Windows 的 `sh.exe`（本移植已把它所在的 `usr\bin` 追加进 worker 的 PATH）。
