/* js/systems/skills.js —— 五项技能：经验 / 等级 / 职业。
 * 收获作物、采集野物、砍树、钓鱼、采矿、击杀怪物都会给对应技能加经验。
 * 等级本身提供小幅加成，5 级 / 10 级各选一个职业强化。 */

'use strict';

const SKILL_DEFS = [
  { id:'farming',  name:'耕种', icon:'🌾', color:'#8ac04a', desc:'收获作物获得经验' },
  { id:'foraging', name:'采集', icon:'🍃', color:'#4ac0a0', desc:'采集野物 / 砍树获得经验' },
  { id:'fishing',  name:'钓鱼', icon:'🎣', color:'#4a9ae0', desc:'钓到鱼获得经验' },
  { id:'mining',   name:'采矿', icon:'⛏️', color:'#c0a060', desc:'敲碎矿石 / 岩石获得经验' },
  { id:'combat',   name:'战斗', icon:'⚔️', color:'#e05a4a', desc:'击败怪物获得经验' }
];
const SKILL_BY_ID = {};
for (const s of SKILL_DEFS) SKILL_BY_ID[s.id] = s;

/* 升到下一级所需的累计经验（0 → 1 需要 100，1 → 2 再累计 380……） */
const XP_TABLE = [0, 100, 380, 770, 1300, 2150, 3300, 4800, 6900, 10000, 15000];

/* 5 级 / 10 级职业二选一 */
const PROF_DEFS = {
  farming: {
    5: [
      { id:'tiller',      name:'农耕人', desc:'作物售价 +10%' },
      { id:'rancher',     name:'牧场主', desc:'动物产品售价 +20%' }
    ],
    10: [
      { id:'artisan',     name:'工匠',   desc:'加工品售价 +40%' },
      { id:'agriculturist', name:'农业学家', desc:'作物售价额外 +10%' }
    ]
  },
  foraging: {
    5: [
      { id:'forester',    name:'护林人', desc:'砍树多掉 25% 木材' },
      { id:'gatherer',    name:'采集者', desc:'采集物 20% 概率翻倍' }
    ],
    10: [
      { id:'lumberjack',  name:'伐木工', desc:'砍树再多掉 50% 木材' },
      { id:'botanist',    name:'植物学家', desc:'采集物售价 +30%' }
    ]
  },
  fishing: {
    5: [
      { id:'fisher',      name:'渔夫',   desc:'鱼售价 +25%' },
      { id:'trapper',     name:'捕手',   desc:'钓鱼绿区 +25%' }
    ],
    10: [
      { id:'angler',      name:'垂钓者', desc:'鱼售价再 +50%' },
      { id:'aquarist',    name:'水族师', desc:'鱼咬钩等待 -20%' }
    ]
  },
  mining: {
    5: [
      { id:'miner',       name:'矿工',   desc:'矿石 25% 概率额外 +1' },
      { id:'geologist',   name:'地质学家', desc:'宝石 15% 概率翻倍' }
    ],
    10: [
      { id:'blacksmith',  name:'铁匠',   desc:'矿石 25% 概率额外 +2' },
      { id:'excavator',   name:'挖掘者', desc:'敲岩石额外 +1 石材' }
    ]
  },
  combat: {
    5: [
      { id:'fighter',     name:'战士',   desc:'武器伤害 +10%' },
      { id:'defender',    name:'防御者', desc:'受到伤害 -15%' }
    ],
    10: [
      { id:'brute',       name:'猛士',   desc:'武器伤害再 +20%' },
      { id:'acrobat',     name:'杂技演员', desc:'矿井生命上限 +20' }
    ]
  }
};

const skillState = {
  xp:   { farming:0, foraging:0, fishing:0, mining:0, combat:0 },
  prof: { farming:{}, foraging:{}, fishing:{}, mining:{}, combat:{} }
};
window.skillState = skillState;
window.skillsOpen = false;

function skillLevel(id){
  const xp = skillState.xp[id] || 0;
  let lv = 0;
  for (let i = 1; i < XP_TABLE.length; i++) if (xp >= XP_TABLE[i]) lv = i;
  return lv;
}
function skillXp(id){ return skillState.xp[id] || 0; }
function skillMaxLevel(){ return XP_TABLE.length - 1; }
function skillXpForLevel(lv){ return XP_TABLE[Math.max(0, Math.min(XP_TABLE.length - 1, lv | 0))]; }
function skillProgress(id){
  const lv = skillLevel(id);
  if (lv >= skillMaxLevel()) return 1;
  const a = XP_TABLE[lv], b = XP_TABLE[lv + 1];
  return Math.max(0, Math.min(1, (skillXp(id) - a) / Math.max(1, b - a)));
}
function skillTotalLevel(){
  let n = 0;
  for (const s of SKILL_DEFS) n += skillLevel(s.id);
  return n;
}
function skillProf(id, tier){ return skillState.prof[id] && skillState.prof[id][tier] || ''; }
function skillProfName(id, tier){
  const choice = skillProf(id, tier);
  if (!choice) return '';
  const list = (PROF_DEFS[id] && PROF_DEFS[id][tier]) || [];
  const p = list.find(x => x.id === choice);
  return p ? p.name : '';
}
function skillPending(id){
  const lv = skillLevel(id);
  const out = [];
  for (const tier of [5, 10]) if (lv >= tier && !skillProf(id, tier)) out.push(tier);
  return out;
}
function skillAnyPending(){
  return SKILL_DEFS.some(s => skillPending(s.id).length > 0);
}

function skillNotifyLevel(id, lv){
  const def = SKILL_BY_ID[id];
  if (typeof toast === 'function') toast('✨ ' + def.name + '升到 ' + lv + ' 级！' + (lv === 5 || lv === 10 ? '按 K 选择职业' : ''));
  if (typeof playSfx === 'function') playSfx(1046, 'triangle', 0.18, 0.6);
  if (typeof skillsRefresh === 'function') skillsRefresh();
}

function skillAdd(id, xp){
  if (!SKILL_BY_ID[id] || !(xp > 0)) return;
  const before = skillLevel(id);
  skillState.xp[id] = Math.max(0, (skillState.xp[id] || 0) + xp);
  const after = skillLevel(id);
  if (after > before) for (let lv = before + 1; lv <= after; lv++) skillNotifyLevel(id, lv);
}

function skillChoose(id, tier, profId){
  if (!SKILL_BY_ID[id]) return false;
  if (skillLevel(id) < tier) return false;
  const list = (PROF_DEFS[id] && PROF_DEFS[id][tier]) || [];
  if (!list.some(p => p.id === profId)) return false;
  if (skillProf(id, tier)) { toast('这个等级的职业已经选过了'); return false; }
  skillState.prof[id][tier] = profId;
  const p = list.find(x => x.id === profId);
  toast('职业确定：' + p.name + '（' + p.desc + '）');
  if (typeof playSfx === 'function') playSfx(880, 'triangle', 0.14, 0.6);
  skillsRefresh();
  return true;
}

/* ---------- 数值加成 ---------- */

function skillProfHas(id, tier, profId){ return skillProf(id, tier) === profId; }

/* 加工品 id 集合（加工台产物） */
let ARTISAN_IDS = null;
function artisanIds(){
  if (ARTISAN_IDS) return ARTISAN_IDS;
  ARTISAN_IDS = new Set();
  const list = (CONFIG.RECIPE && CONFIG.RECIPE.LIST) || [];
  for (const r of list) if (r && r.out && r.out.id) ARTISAN_IDS.add(r.out.id);
  return ARTISAN_IDS;
}
function isArtisanItem(id){ return artisanIds().has(id); }

/* 出售价倍率：技能等级 + 职业 */
function skillSellMult(d){
  if (!d) return 1;
  const farmLv = skillLevel('farming');
  if (d.kind === 'crop') {
    let m = 1 + farmLv * 0.01;
    if (skillProfHas('farming', 5, 'tiller')) m += 0.10;
    if (skillProfHas('farming', 10, 'agriculturist')) m += 0.10;
    return m;
  }
  if (d.kind === 'animal') {
    let m = 1 + farmLv * 0.005;
    if (skillProfHas('farming', 5, 'rancher')) m += 0.20;
    return m;
  }
  if (isArtisanItem(d.id)) {
    let m = 1 + farmLv * 0.005;
    if (skillProfHas('farming', 10, 'artisan')) m += 0.40;
    return m;
  }
  if (d.kind === 'fish') {
    let m = 1 + skillLevel('fishing') * 0.01;
    if (skillProfHas('fishing', 5, 'fisher')) m += 0.25;
    if (skillProfHas('fishing', 10, 'angler')) m += 0.50;
    return m;
  }
  if (d.kind === 'gather') {
    let m = 1 + skillLevel('foraging') * 0.01;
    if (skillProfHas('foraging', 10, 'botanist')) m += 0.30;
    return m;
  }
  if (d.kind === 'mineral') return 1 + skillLevel('mining') * 0.005;
  return 1;
}

function skillWoodCount(base){
  let n = base;
  if (skillProfHas('foraging', 5, 'forester')) n += base * 0.25;
  if (skillProfHas('foraging', 10, 'lumberjack')) n += base * 0.50;
  return Math.max(base, Math.round(n));
}
function skillForageDoubleChance(){ return skillProfHas('foraging', 5, 'gatherer') ? 0.20 : 0; }
function skillOreBonus(){
  let n = 0;
  if (Math.random() < 0.25) {
    if (skillProfHas('mining', 5, 'miner')) n += 1;
    if (skillProfHas('mining', 10, 'blacksmith')) n += 2;
  }
  return n;
}
function skillGemDoubleChance(){ return skillProfHas('mining', 5, 'geologist') ? 0.15 : 0; }
function skillExtraStone(){ return skillProfHas('mining', 10, 'excavator') ? 1 : 0; }
function skillFishZoneMult(){
  let m = 1 + skillLevel('fishing') * 0.01;
  if (skillProfHas('fishing', 5, 'trapper')) m += 0.25;
  return m;
}
function skillFishWaitMult(){ return skillProfHas('fishing', 10, 'aquarist') ? 0.8 : 1; }
function skillMineHpBonus(){ return skillProfHas('combat', 10, 'acrobat') ? 20 : 0; }
function skillCombatDamageMult(){
  let m = 1 + skillLevel('combat') * 0.02;
  if (skillProfHas('combat', 5, 'fighter')) m += 0.10;
  if (skillProfHas('combat', 10, 'brute')) m += 0.20;
  return m;
}
function skillDamageTakenMult(){
  let m = 1 - skillLevel('combat') * 0.005;
  if (skillProfHas('combat', 5, 'defender')) m -= 0.15;
  return Math.max(0.35, m);
}
function skillMiningXp(mult){ return Math.round(4 * (mult || 1)); }

/* ---------- 面板 ---------- */

let skillsEl = null, skillsMaskEl = null, skillsListEl = null, skillsHeadEl = null;

function skillsEnsure(){
  if (skillsEl) return true;
  skillsEl = document.getElementById('skills');
  skillsMaskEl = document.getElementById('skillsMask');
  skillsListEl = document.getElementById('skillsList');
  skillsHeadEl = document.getElementById('skillsTotal');
  if (skillsMaskEl) skillsMaskEl.addEventListener('mousedown', e => { e.preventDefault(); skillsClosePanel(); });
  return !!skillsEl;
}

function skillBarHtml(id){
  const pct = Math.round(skillProgress(id) * 100);
  return '<div class="skbar"><i style="width:' + pct + '%"></i></div>';
}

function skillsRefresh(){
  if (!skillsOpen) return;
  if (!skillsEnsure()) return;
  if (skillsHeadEl) skillsHeadEl.textContent = '总等级 ' + skillTotalLevel() + ' / ' + (skillMaxLevel() * SKILL_DEFS.length);
  if (!skillsListEl) return;
  let html = '';
  for (const s of SKILL_DEFS) {
    const lv = skillLevel(s.id);
    const xp = skillXp(s.id);
    const next = lv >= skillMaxLevel() ? 'MAX' : (XP_TABLE[lv + 1] - xp) + ' XP 到下一级';
    html += '<div class="skrow" style="--sk:' + s.color + '">';
    html += '<div class="skicon">' + s.icon + '</div>';
    html += '<div class="skmain">';
    html += '<div class="sktop"><b>' + s.name + '</b><span>Lv ' + lv + '</span></div>';
    html += skillBarHtml(s.id);
    html += '<div class="skmeta">' + xp + ' XP · ' + next + '</div>';
    html += '<div class="skdesc">' + s.desc + '</div>';
    const p5 = skillProfName(s.id, 5), p10 = skillProfName(s.id, 10);
    if (p5 || p10) {
      html += '<div class="skprof">';
      if (p5) html += '<span>5 级 · ' + p5 + '</span>';
      if (p10) html += '<span>10 级 · ' + p10 + '</span>';
      html += '</div>';
    }
    for (const tier of skillPending(s.id)) {
      html += '<div class="skpick"><em>' + tier + ' 级职业二选一</em>';
      for (const p of PROF_DEFS[s.id][tier]) {
        html += '<button class="mbtn" data-sk="' + s.id + '" data-tier="' + tier + '" data-prof="' + p.id + '">' +
                p.name + '<small>' + p.desc + '</small></button>';
      }
      html += '</div>';
    }
    html += '</div></div>';
  }
  skillsListEl.innerHTML = html;
  skillsListEl.querySelectorAll('button[data-sk]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      skillChoose(btn.dataset.sk, parseInt(btn.dataset.tier, 10), btn.dataset.prof);
    });
  });
}

function skillsOpenPanel(){
  if (window.farmhouseActive || window.mineActive || window.mineGateOpen) return false;
  if (!skillsEnsure()) return false;
  if (typeof togglePack === 'function') togglePack(false);
  window.skillsOpen = true;
  skillsEl.classList.add('open');
  skillsRefresh();
  if (typeof playSfx === 'function') playSfx(660, 'triangle', 0.08, 0.5);
  return true;
}
function skillsClosePanel(){
  window.skillsOpen = false;
  if (skillsEl) skillsEl.classList.remove('open');
  return true;
}
function toggleSkillsPanel(v){
  const want = (v === undefined) ? !window.skillsOpen : !!v;
  return want ? skillsOpenPanel() : skillsClosePanel();
}

/* ---------- 存档 ---------- */
function skillSerialize(){
  const x = {}, p = {};
  for (const s of SKILL_DEFS) {
    x[s.id] = Math.max(0, skillState.xp[s.id] | 0);
    const pr = skillState.prof[s.id] || {};
    const o = {};
    for (const tier of [5, 10]) {
      const id = pr[tier];
      const list = (PROF_DEFS[s.id] && PROF_DEFS[s.id][tier]) || [];
      if (id && list.some(v => v.id === id)) o[tier] = id;
    }
    p[s.id] = o;
  }
  return { x, p };
}
function skillDeserialize(v){
  skillReset();
  if (!v || typeof v !== 'object') return;
  const x = v.x || {};
  for (const s of SKILL_DEFS) {
    const n = Number(x[s.id]);
    if (isFinite(n) && n > 0) skillState.xp[s.id] = Math.min(XP_TABLE[XP_TABLE.length - 1], Math.round(n));
  }
  const p = v.p || {};
  for (const s of SKILL_DEFS) {
    const src = p[s.id];
    if (!src || typeof src !== 'object') continue;
    for (const tier of [5, 10]) {
      const list = (PROF_DEFS[s.id] && PROF_DEFS[s.id][tier]) || [];
      const id = src[tier];
      if (id && list.some(v2 => v2.id === id)) skillState.prof[s.id][tier] = id;
    }
  }
}
function skillReset(){
  for (const s of SKILL_DEFS) {
    skillState.xp[s.id] = 0;
    skillState.prof[s.id] = {};
  }
  if (typeof skillsRefresh === 'function') skillsRefresh();
}

Object.assign(window, {
  skillState, skillAdd, skillLevel, skillXp, skillProgress, skillTotalLevel,
  skillProf, skillProfName, skillPending, skillAnyPending, skillChoose,
  skillSellMult, skillWoodCount, skillForageDoubleChance, skillOreBonus,
  skillGemDoubleChance, skillExtraStone, skillFishZoneMult, skillFishWaitMult,
  skillMineHpBonus, skillCombatDamageMult, skillDamageTakenMult, skillMiningXp,
  skillsOpenPanel, skillsClosePanel, toggleSkillsPanel, skillsRefresh,
  skillSerialize, skillDeserialize, skillReset
});
export {
  skillState, skillAdd, skillLevel, skillXp, skillProgress, skillTotalLevel,
  skillProf, skillProfName, skillPending, skillAnyPending, skillChoose,
  skillSellMult, skillWoodCount, skillForageDoubleChance, skillOreBonus,
  skillGemDoubleChance, skillExtraStone, skillFishZoneMult, skillFishWaitMult,
  skillMineHpBonus, skillCombatDamageMult, skillDamageTakenMult, skillMiningXp,
  skillsOpenPanel, skillsClosePanel, toggleSkillsPanel, skillsRefresh,
  skillSerialize, skillDeserialize, skillReset
};
