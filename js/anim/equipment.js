/* 星露谷装备图鉴：62 件武器 + 30 枚戒指 + 18 双靴子。
 * 图标画在 32×32 格子里；武器按剑/匕首/棍锤/弹弓分形态，戒指按宝石，
 * 靴子按鞋型与材质区分。全部程序化绘制。 */

import { R, line, ellipse, TAU } from './pixel.js';

export const EQUIP_W = 32;
export const EQUIP_H = 32;

export const EQUIP_CATS = [
  { id: 'all', name: '全部' },
  { id: 'sword', name: '剑' },
  { id: 'dagger', name: '匕首' },
  { id: 'club', name: '棍锤' },
  { id: 'slingshot', name: '弹弓' },
  { id: 'ring', name: '戒指' },
  { id: 'boots', name: '靴子' }
];

const P = {
  iron:      ['#c8d0d8', '#7a8490', '#f0f4f8'],
  rust:      ['#b07a4a', '#6a4a2a', '#e0b080'],
  steel:     ['#b8c8d8', '#6a7a8a', '#e8f0f8'],
  wood:      ['#b07a3a', '#6a4a2a', '#e0b070'],
  silver:    ['#d0d8e0', '#8a95a0', '#ffffff'],
  gold:      ['#e0c060', '#a08020', '#fff0a0'],
  forest:    ['#5a9a4a', '#3a6a2a', '#a0d080'],
  bone:      ['#e8e0c8', '#b0a888', '#fff8e0'],
  obsidian:  ['#4a3a5a', '#2a1a3a', '#8a6ac0'],
  lava:      ['#e05a2a', '#a02a0a', '#f0c060'],
  galaxy:    ['#8a6ac0', '#4a2a8a', '#d0b0ff'],
  crystal:   ['#7ad0e0', '#3a8aa0', '#d0f8ff'],
  shadow:    ['#5a4a6a', '#2a1a3a', '#a05ac0'],
  copper:    ['#c07a3a', '#8a4a1a', '#f0b070'],
  iridium:   ['#9a8ac0', '#5a4a8a', '#e0d0ff'],
  ruby:      ['#d04a5a', '#8a2a3a', '#f090a0'],
  emerald:   ['#4ac07a', '#2a7a4a', '#a0f0c0'],
  jade:      ['#6ac09a', '#3a8a6a', '#b0f0d0'],
  aquamarine:['#4ac0c0', '#2a7a7a', '#a0f0f0'],
  amethyst:  ['#9a5ac0', '#5a2a8a', '#d0a0f0'],
  topaz:     ['#e0b040', '#a07020', '#fff0a0'],
  diamond:   ['#d0e8f0', '#8ab0c0', '#ffffff'],
  slime:     ['#5aa04a', '#3a6a2a', '#a0d060'],
  warrior:   ['#d04a3a', '#8a2a1a', '#f0a060'],
  vampire:   ['#7a2a3a', '#4a0a1a', '#d04a6a'],
  savage:    ['#e08a3a', '#a05a1a', '#f0c080'],
  yoba:      ['#4a8ac0', '#2a5a8a', '#a0d0f0'],
  sturdy:    ['#8a9aa0', '#5a6a70', '#c0d0d8'],
  burglar:   ['#4a7a3a', '#2a4a1a', '#a0d060'],
  jukebox:   ['#e0c060', '#8a5ac0', '#f0f0e0'],
  lucky:     ['#e0c040', '#4a8ac0', '#fff0a0'],
  coffee:    ['#8a5a3a', '#5a3418', '#c09060'],
  protection:['#4a7ac0', '#2a4a8a', '#a0c0f0'],
  soul:      ['#8a5ac0', '#4a2a8a', '#d0b0ff'],
  phoenix:   ['#e05a2a', '#a02a0a', '#f0c060'],
  immunity:  ['#8a5ac0', '#4a2a8a', '#e0d0ff'],
  glowstone: ['#e0d060', '#4a8ac0', '#fff8c0'],
  pink:      ['#e08ab0', '#a04a70', '#ffc0d8'],
  white:     ['#f0f0e8', '#b0b0a8', '#ffffff'],
  yellow:    ['#e8d050', '#b09020', '#fff8b0'],
  dark:      ['#3a3a4a', '#1a1a2a', '#8a8aa0'],
  teal:      ['#4ac0b0', '#2a8070', '#a0f0e0'],
  green:     ['#5aa04a', '#3a6a2a', '#a0d080'],
  orange:    ['#e08a3a', '#a05a1a', '#f0c080'],
  red:       ['#d04a3a', '#8a2a1a', '#f08a70'],
  purple:    ['#8a5ac0', '#5a2a8a', '#c0a0f0'],
  brown:     ['#8a5a3a', '#5a3418', '#c09060'],
  tan:       ['#c8a878', '#8a6a40', '#f0d8a8'],
  blue:      ['#4a8ac0', '#2a5a8a', '#a0d0f0'],
  cyan:      ['#4ac0c0', '#2a7a7a', '#a0f0f0']
};

const TRIMS = ['#e0c060', '#d04a3a', '#5aa04a', '#4a8ac0', '#c0a0f0', '#f0f0e0', '#e08a3a', '#4ac0c0'];

/* [id, 中文名, 英文名, 类型, 等级, 伤害, 暴击, 词条, 造型, 配色] */
const WEAPON_RAW = [
  ['rusty_sword','生锈的剑','Rusty Sword','sword',1,'2-5','.02','—','straight','rust'],
  ['steel_smallsword','钢制短剑','Steel Smallsword','sword',1,'4-8','.02','速度 +2','straight','steel'],
  ['wooden_blade','木剑','Wooden Blade','sword',1,'3-7','.02','—','straight','wood'],
  ['pirates_sword','海盗剑','Pirate\'s Sword','sword',2,'8-14','.02','速度 +2','curved','steel'],
  ['silver_saber','银军刀','Silver Saber','sword',2,'8-15','.02','防御 +1','curved','silver'],
  ['cutlass','弯刀','Cutlass','sword',3,'9-17','.02','速度 +2','curved','gold'],
  ['forest_sword','森林剑','Forest Sword','sword',3,'8-18','.02','速度 +2 / 防御 +1','straight','forest'],
  ['iron_edge','铁刃','Iron Edge','sword',3,'12-25','.02','速度 -2 / 防御 +1 / 重量 +3','broad','iron'],
  ['insect_head','昆虫头部','Insect Head','sword',6,'20-30','.04','速度 +2 / 暴击 +2','insect','forest'],
  ['bone_sword','骨剑','Bone Sword','sword',5,'20-30','.02','速度 +4 / 重量 +2','bone','bone'],
  ['claymore','双手剑','Claymore','sword',5,'20-32','.02','速度 -4 / 防御 +2 / 重量 +3','broad','steel'],
  ['neptunes_glaive','海神之刃','Neptune\'s Glaive','sword',5,'18-35','.02','速度 -1 / 防御 +2 / 重量 +4','glaive','aquamarine'],
  ['templars_blade','圣殿骑士之刃','Templar\'s Blade','sword',5,'22-29','0','防御 +1','holy','gold'],
  ['obsidian_edge','黑曜石之刃','Obsidian Edge','sword',6,'30-45','.02','速度 -1 / 暴击力量 +10','straight','obsidian'],
  ['ossified_blade','骨化之刃','Ossified Blade','sword',6,'26-42','.02','速度 -2 / 防御 +1 / 重量 +2','broad','bone'],
  ['holy_blade','神圣之刃','Holy Blade','sword',7,'20-27','.02','速度 +4 / 防御 +2','holy','white'],
  ['tempered_broadsword','精炼阔剑','Tempered Broadsword','sword',7,'29-44','.02','速度 -3 / 防御 +3 / 重量 +3','broad','iron'],
  ['yeti_tooth','雪怪之牙','Yeti Tooth','sword',7,'26-42','.02','防御 +4 / 暴击力量 +10','bone','crystal'],
  ['steel_falchion','钢制弯刀','Steel Falchion','sword',8,'28-46','.02','速度 +4 / 暴击力量 +20','curved','steel'],
  ['dark_sword','黑暗之剑','Dark Sword','sword',9,'30-45','.04','速度 -5 / 暴击 +2 / 重量 +5','straight','shadow'],
  ['lava_katana','熔岩武士刀','Lava Katana','sword',10,'55-64','.015','防御 +3 / 暴击力量 +25 / 重量 +3','katana','lava'],
  ['dragontooth_cutlass','龙牙弯刀','Dragontooth Cutlass','sword',13,'75-90','.02','暴击力量 +50','curved','emerald'],
  ['dwarf_sword','矮人之剑','Dwarf Sword','sword',13,'65-75','.02','速度 +2 / 防御 +4','straight','copper'],
  ['galaxy_sword','银河剑','Galaxy Sword','sword',13,'60-80','.02','速度 +4','galaxy','galaxy'],
  ['infinity_blade','无限之刃','Infinity Blade','sword',17,'80-100','.02','速度 +4 / 防御 +2','infinity','iridium'],
  ['haleys_iron','海莉的熨斗','Haley\'s Iron','sword',6,'30-45','.02','速度 -1 / 暴击力量 +10','flatiron','steel'],
  ['leahs_whittler','莉亚的雕刻刀','Leah\'s Whittler','sword',6,'30-45','.02','速度 -1 / 暴击力量 +10','whittler','wood'],
  ['meowmere','喵喵剑','Meowmere','sword',4,'20-20','.02','速度 +4 / 重量 +2','cat','pink'],

  ['carving_knife','雕刻刀','Carving Knife','dagger',1,'1-3','.04','暴击 +2','dagger','iron'],
  ['iron_dirk','铁匕首','Iron Dirk','dagger',1,'2-4','.03','暴击 +2','dagger','steel'],
  ['wind_spire','风之尖刺','Wind Spire','dagger',1,'1-5','.02','暴击 +1 / 暴击力量 +10 / 重量 +5','kris','silver'],
  ['elf_blade','精灵之刃','Elf Blade','dagger',2,'3-5','.04','暴击 +2','dagger','forest'],
  ['burglars_shank','盗贼短刀','Burglar\'s Shank','dagger',4,'7-12','.04','暴击 +2 / 暴击力量 +25','dagger','shadow'],
  ['crystal_dagger','水晶匕首','Crystal Dagger','dagger',4,'4-10','.03','暴击 +2 / 暴击力量 +50 / 重量 +5','dagger','crystal'],
  ['shadow_dagger','暗影匕首','Shadow Dagger','dagger',4,'10-20','.04','暴击 +2','kris','shadow'],
  ['broken_trident','断裂的三叉戟','Broken Trident','dagger',5,'15-26','.02','暴击 +1','trident','aquamarine'],
  ['wicked_kris','邪恶波纹刃','Wicked Kris','dagger',8,'24-30','.06','暴击 +4','kris','iridium'],
  ['galaxy_dagger','银河匕首','Galaxy Dagger','dagger',8,'30-40','.02','速度 +1 / 暴击 +1 / 重量 +5','dagger','galaxy'],
  ['dwarf_dagger','矮人匕首','Dwarf Dagger','dagger',11,'32-38','.03','速度 +1 / 防御 +6 / 暴击 +2 / 重量 +5','dagger','copper'],
  ['dragontooth_shiv','龙牙短刃','Dragontooth Shiv','dagger',12,'40-50','.05','暴击 +3 / 暴击力量 +100 / 重量 +5','kris','emerald'],
  ['iridium_needle','铱针','Iridium Needle','dagger',12,'20-35','.1','暴击 +6 / 暴击力量 +200','needle','iridium'],
  ['infinity_dagger','无限匕首','Infinity Dagger','dagger',16,'50-70','.06','速度 +1 / 防御 +3 / 暴击 +4 / 重量 +5','dagger','iridium'],
  ['elliott_pencil','艾利欧特的铅笔','Elliott\'s Pencil','dagger',8,'24-30','.06','暴击 +4','pencil','yellow'],
  ['abbys_planchette','阿比盖尔的笔仙板','Abby\'s Planchette','dagger',8,'24-30','.06','暴击 +4','planchette','purple'],

  ['femur','股骨','Femur','club',2,'6-11','.02','速度 +2','boneclub','bone'],
  ['wood_club','木棒','Wood Club','club',2,'9-16','.02','—','club','wood'],
  ['wood_mallet','木槌','Wood Mallet','club',3,'15-24','.02','速度 +2 / 重量 +2','hammer','wood'],
  ['lead_rod','铅棒','Lead Rod','club',4,'18-27','.02','速度 -4','rod','iron'],
  ['kudgel','粗棒','Kudgel','club',5,'27-40','.02','速度 -1 / 暴击力量 +50 / 重量 +2','club','copper'],
  ['the_slammer','猛击者','The Slammer','club',7,'40-55','.02','速度 -2','gavel','steel'],
  ['galaxy_hammer','银河锤','Galaxy Hammer','club',12,'70-90','.02','速度 +2 / 重量 +5','hammer','galaxy'],
  ['dwarf_hammer','矮人锤','Dwarf Hammer','club',13,'75-85','.02','防御 +2 / 重量 +5','hammer','copper'],
  ['dragontooth_club','龙牙棒','Dragontooth Club','club',14,'80-100','.02','暴击力量 +50 / 重量 +3','toothclub','emerald'],
  ['infinity_gavel','无限锤','Infinity Gavel','club',17,'100-120','.02','速度 +2 / 防御 +1 / 重量 +5','gavel','iridium'],
  ['alex_bat','亚历克斯的球棒','Alex\'s Bat','club',7,'40-55','.02','速度 -2','bat','wood'],
  ['harvey_mallet','哈维的锤子','Harvey\'s Mallet','club',7,'40-55','.02','速度 -2','hammer','bone'],
  ['maru_wrench','玛鲁的扳手','Maru\'s Wrench','club',7,'40-55','.02','速度 -2','wrench','steel'],
  ['penny_fryer','潘妮的煎锅','Penny\'s Fryer','club',7,'40-55','.02','速度 -2','pan','dark'],
  ['sam_guitar','山姆的旧吉他','Sam\'s Old Guitar','club',7,'40-55','.02','速度 -2','guitar','wood'],
  ['seb_mace','塞巴斯蒂安的钉锤','Seb\'s Lost Mace','club',7,'40-55','.02','速度 -2','mace','shadow'],

  ['slingshot','弹弓','Slingshot','slingshot',1,'随弹药','.02','需要石头','sling','wood'],
  ['master_slingshot','大师弹弓','Master Slingshot','slingshot',1,'随弹药','.02','需要石头','mastersling','gold']
];

/* [id, 中文名, 英文名, 效果, 造型, 配色] */
const RING_RAW = [
  ['small_glow_ring','小发光戒指','Small Glow Ring','发出小范围光亮','glow','yellow'],
  ['glow_ring','发光戒指','Glow Ring','发出较大范围光亮','glow','gold'],
  ['small_magnet_ring','小磁铁戒指','Small Magnet Ring','磁力 +1 格','magnet','red'],
  ['magnet_ring','磁铁戒指','Magnet Ring','磁力 +2 格','magnet','blue'],
  ['slime_charmer_ring','史莱姆克星戒指','Slime Charmer Ring','免疫史莱姆伤害','slime','slime'],
  ['warrior_ring','战士戒指','Warrior Ring','击杀怪物获得战士能量','warrior','warrior'],
  ['vampire_ring','吸血鬼戒指','Vampire Ring','击杀怪物恢复 2 生命','vampire','vampire'],
  ['savage_ring','野蛮戒指','Savage Ring','击杀怪物获得短暂加速','savage','savage'],
  ['ring_of_yoba','约巴戒指','Ring of Yoba','受伤时有几率获得约巴祝福','yoba','yoba'],
  ['sturdy_ring','坚固戒指','Sturdy Ring','负面状态持续时间减半','sturdy','sturdy'],
  ['burglars_ring','盗贼戒指','Burglar\'s Ring','怪物掉落更多战利品','burglar','burglar'],
  ['iridium_band','铱环','Iridium Band','发光 + 磁力 + 攻击 +10%','iridium','iridium'],
  ['jukebox_ring','点唱机戒指','Jukebox Ring','播放已听过的音乐','jukebox','jukebox'],
  ['amethyst_ring','紫水晶戒指','Amethyst Ring','击退 +10%','gem','amethyst'],
  ['topaz_ring','黄玉戒指','Topaz Ring','防御 +1','gem','topaz'],
  ['aquamarine_ring','海蓝宝石戒指','Aquamarine Ring','暴击几率 +10%','gem','aquamarine'],
  ['jade_ring','翡翠戒指','Jade Ring','暴击力量 +10%','gem','jade'],
  ['emerald_ring','绿宝石戒指','Emerald Ring','武器速度 +10%','gem','emerald'],
  ['ruby_ring','红宝石戒指','Ruby Ring','攻击 +10%','gem','ruby'],
  ['wedding_ring','结婚戒指','Wedding Ring','多人游戏中用于求婚','wedding','diamond'],
  ['crabshell_ring','蟹壳戒指','Crabshell Ring','防御 +5','crabshell','orange'],
  ['napalm_ring','凝固汽油戒指','Napalm Ring','击杀怪物时爆炸','napalm','red'],
  ['thorns_ring','荆棘戒指','Thorns Ring','反弹受到的伤害','thorns','green'],
  ['lucky_ring','幸运戒指','Lucky Ring','幸运 +1','lucky','lucky'],
  ['hot_java_ring','热咖啡戒指','Hot Java Ring','提高怪物掉落咖啡的几率','coffee','coffee'],
  ['protection_ring','保护戒指','Protection Ring','受伤后无敌时间延长','protection','protection'],
  ['soul_sapper_ring','灵魂汲取戒指','Soul Sapper Ring','击杀怪物恢复 4 能量','soul','soul'],
  ['phoenix_ring','凤凰戒指','Phoenix Ring','每天一次倒地后恢复 50% 生命','phoenix','phoenix'],
  ['immunity_band','免疫环','Immunity Band','免疫 +4','immunity','immunity'],
  ['glowstone_ring','辉光石戒指','Glowstone Ring','发光 + 磁力 +2 格','glowstone','glowstone']
];

/* [id, 中文名, 英文名, 防御, 免疫, 造型, 配色] */
const BOOT_RAW = [
  ['sneakers','运动鞋','Sneakers',1,0,'sneaker','white'],
  ['rubber_boots','橡胶靴','Rubber Boots',0,1,'rubber','yellow'],
  ['leather_boots','皮靴','Leather Boots',1,1,'boot','brown'],
  ['work_boots','工作靴','Work Boots',2,0,'work','brown'],
  ['combat_boots','战斗靴','Combat Boots',3,0,'combat','dark'],
  ['tundra_boots','冻原靴','Tundra Boots',2,1,'tundra','blue'],
  ['leprechaun_shoes','矮妖精鞋','Leprechaun Shoes',2,1,'leprechaun','green'],
  ['thermal_boots','保暖靴','Thermal Boots',1,2,'tundra','orange'],
  ['cowboy_boots','牛仔靴','Cowboy Boots',2,2,'cowboy','brown'],
  ['dark_boots','黑暗靴','Dark Boots',4,2,'dark','dark'],
  ['firewalker_boots','踏火靴','Firewalker Boots',3,3,'firewalker','red'],
  ['genie_shoes','精灵鞋','Genie Shoes',1,6,'genie','purple'],
  ['space_boots','太空靴','Space Boots',4,4,'space','iridium'],
  ['crystal_shoes','水晶鞋','Crystal Shoes',3,5,'crystal','crystal'],
  ['emily_magic_boots','艾米丽的魔法靴','Emily\'s Magic Boots',4,4,'magic','pink'],
  ['cinderclown_shoes','煤灰小丑鞋','Cinderclown Shoes',6,5,'clown','red'],
  ['mermaid_boots','美人鱼靴','Mermaid Boots',5,8,'mermaid','teal'],
  ['dragonscale_boots','龙鳞靴','Dragonscale Boots',7,0,'dragon','emerald']
];

function pal(key) {
  const c = P[key] || P.iron;
  return { c1: c[0], c2: c[1], c3: c[2] };
}

export const WEAPONS = WEAPON_RAW.map(([id, name, en, cat, level, dmg, crit, stat, style, p]) => ({
  id, name, en, cat, level, dmg, crit, stat, style, ...pal(p)
}));

export const RINGS = RING_RAW.map(([id, name, en, effect, style, p]) => ({
  id, name, en, cat: 'ring', effect, style, ...pal(p)
}));

export const BOOTS = BOOT_RAW.map(([id, name, en, def, imm, style, p]) => ({
  id, name, en, cat: 'boots', def, imm, style, ...pal(p)
}));

export const EQUIPMENT = [...WEAPONS, ...RINGS, ...BOOTS];
export const EQUIP_MAP = Object.fromEntries(EQUIPMENT.map(e => [e.id, e]));

export function equipCatName(cat) {
  const c = EQUIP_CATS.find(x => x.id === cat);
  return c ? c.name : cat;
}

function hashOf(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function trimOf(it) {
  return TRIMS[hashOf(it.id) % TRIMS.length];
}

function sparkle(g, x, y, color, phase) {
  const a = Math.sin(phase * TAU) * 0.5 + 0.5;
  if (a < 0.35) return;
  R(g, x, y, 1, 1, color);
  if (a > 0.7) {
    R(g, x - 1, y, 1, 1, color);
    R(g, x + 1, y, 1, 1, color);
    R(g, x, y - 1, 1, 1, color);
  }
}

/* ---------------- 武器 ---------------- */

function drawSword(g, it, phase) {
  const trim = trimOf(it);
  const sway = Math.round(Math.sin(phase * TAU) * 0.6);
  const bx = 11, by = 24;
  let tx = 23, ty = 5 + sway;

  if (it.style === 'flatiron') {
    R(g, 8, 17, 15, 7, it.c2);
    R(g, 9, 18, 13, 5, it.c1);
    R(g, 10, 18, 11, 1, it.c3);
    R(g, 7, 24, 17, 2, '#4a4a52');
    line(g, 12, 16, 12, 10, it.c2, 2);
    line(g, 12, 10, 21, 10, it.c2, 2);
    line(g, 21, 10, 21, 16, it.c2, 2);
    R(g, 11, 8, 3, 3, trim);
    R(g, 8, 26, 15, 1, '#2a2a30');
    return;
  }

  if (it.style === 'cat') {
    /* 喵喵剑：粉色剑身，尖端一对猫耳 */
    line(g, bx, by, tx - 1, ty + 1, '#5a2a4a', 5);
    line(g, bx, by, tx - 1, ty + 1, it.c1, 3);
    line(g, bx - 1, by - 1, tx - 2, ty + 2, it.c3, 1);
    R(g, 20, 4, 3, 3, it.c1);
    R(g, 24, 5, 3, 3, it.c1);
    R(g, 21, 5, 1, 1, '#2a1a2a');
    R(g, 25, 6, 1, 1, '#2a1a2a');
    R(g, 22, 8, 2, 1, '#d06a9a');
    line(g, 7, 21, 15, 28, trim, 2);
    line(g, 10, 25, 5, 29, '#6a3a2a', 2);
    R(g, 4, 28, 3, 3, trim);
    sparkle(g, 19, 12, '#fff0f8', phase);
    return;
  }

  const w = it.style === 'broad' ? 4 : (it.style === 'katana' ? 2 : 3);
  const curved = it.style === 'curved' || it.style === 'katana' || it.style === 'glaive' || it.style === 'infinity';

  if (curved) {
    line(g, bx, by, 18, 15, it.c2, w + 2);
    line(g, 18, 15, tx, ty, it.c2, w + 2);
    line(g, bx, by, 18, 15, it.c1, w);
    line(g, 18, 15, tx, ty, it.c1, w);
    line(g, bx - 1, by - 1, 17, 15, it.c3, 1);
    line(g, 18, 14, tx - 1, ty + 1, it.c3, 1);
  } else {
    line(g, bx, by, tx, ty, it.c2, w + 2);
    line(g, bx, by, tx, ty, it.c1, w);
    line(g, bx - 1, by - 1, tx - 2, ty + 1, it.c3, 1);
  }

  if (it.style === 'glaive') {
    R(g, 20, 4, 4, 5, it.c2);
    R(g, 21, 4, 2, 4, it.c1);
    R(g, 18, 8, 6, 2, it.c2);
  }
  if (it.style === 'bone' || it.style === 'yeti') {
    for (let i = 0; i < 5; i++) R(g, 13 + i * 2, 22 - i * 2, 1, 1, it.c2);
    if (it.style === 'yeti') {
      R(g, 21, 6, 1, 2, '#ffffff');
      R(g, 19, 8, 1, 2, '#d0f0ff');
    }
  }
  if (it.style === 'galaxy' || it.style === 'infinity') {
    sparkle(g, 18, 13, '#ffffff', phase);
    sparkle(g, 21, 8, trim, phase + 0.3);
    R(g, 15, 18, 1, 1, '#ffffff');
  }
  if (it.style === 'insect') {
    ellipse(g, 10, 24, 3, 3, it.c1);
    R(g, 8, 22, 1, 1, '#f0e060');
    R(g, 11, 22, 1, 1, '#f0e060');
    line(g, 8, 21, 5, 18, it.c2, 1);
    line(g, 12, 21, 15, 18, it.c2, 1);
  }
  if (it.style === 'whittler') {
    R(g, 6, 20, 3, 1, '#e0b070');
    R(g, 5, 21, 2, 2, '#c09050');
  }
  if (it.style === 'holy') {
    sparkle(g, 22, 7, '#fff8c0', phase);
  }

  /* 护手 + 握柄 + 宝石 */
  line(g, bx - 4, by - 3, bx + 4, by + 4, trim, 2);
  line(g, bx, by + 1, bx - 5, by + 5, '#6a4a2a', 2);
  R(g, 4, 28, 3, 3, trim);
  R(g, 5, 28, 1, 1, '#fff8e0');
}

function drawDagger(g, it, phase) {
  const trim = trimOf(it);
  const sway = Math.round(Math.sin(phase * TAU) * 0.5);

  if (it.style === 'pencil') {
    line(g, 10, 26, 22, 9, '#e0c040', 5);
    line(g, 10, 26, 22, 9, '#f0d860', 3);
    line(g, 11, 26, 23, 9, '#fff0a0', 1);
    R(g, 8, 26, 4, 4, '#e08aa0');
    R(g, 7, 27, 2, 2, '#a05a70');
    R(g, 22, 5, 3, 5, '#e8d0a0');
    R(g, 23, 5, 1, 2, '#5a4a3a');
    return;
  }

  if (it.style === 'planchette') {
    ellipse(g, 16, 17, 7, 6, it.c2);
    ellipse(g, 16, 16, 6, 5, it.c1);
    R(g, 13, 13, 2, 2, '#2a1a3a');
    R(g, 18, 13, 2, 2, '#2a1a3a');
    R(g, 14, 18, 5, 1, it.c3);
    R(g, 15, 15, 3, 2, trim);
    line(g, 22, 12, 27, 7, '#8a5a3a', 2);
    R(g, 26, 5, 2, 2, '#f0f0e0');
    return;
  }

  if (it.style === 'trident') {
    line(g, 15, 27, 15, 12, it.c2, 2);
    line(g, 15, 26, 15, 12, it.c1, 1);
    line(g, 10, 12, 10, 5, it.c1, 2);
    line(g, 15, 10, 15, 4, it.c1, 2);
    line(g, 20, 12, 20, 5, it.c1, 2);
    line(g, 9, 12, 16, 9, it.c2, 1);
    line(g, 16, 9, 21, 12, it.c2, 1);
    R(g, 12, 26, 7, 2, trim);
    return;
  }

  if (it.style === 'needle') {
    line(g, 12, 25, 24, 7, it.c2, 2);
    line(g, 13, 24, 24, 7, it.c1, 1);
    R(g, 23, 6, 2, 2, it.c3);
    R(g, 10, 26, 4, 3, trim);
    R(g, 12, 23, 1, 1, '#ffffff');
    return;
  }

  const bx = 13, by = 24;
  const tx = 24, ty = 10 + sway;
  if (it.style === 'kris') {
    line(g, bx, by, 17, 19, it.c2, 4);
    line(g, 17, 19, 20, 15, it.c2, 4);
    line(g, 20, 15, tx, ty, it.c2, 4);
    line(g, bx, by, 17, 19, it.c1, 2);
    line(g, 17, 19, 20, 15, it.c1, 2);
    line(g, 20, 15, tx, ty, it.c1, 2);
  } else {
    line(g, bx, by, tx, ty, it.c2, 4);
    line(g, bx, by, tx, ty, it.c1, 2);
    line(g, bx - 1, by - 1, tx - 2, ty + 1, it.c3, 1);
  }

  line(g, bx - 3, by - 2, bx + 3, by + 3, trim, 2);
  line(g, bx, by + 1, bx - 4, by + 4, '#5a3a1a', 2);
  R(g, 7, 28, 2, 2, trim);
  if (it.cat === 'dagger' && (it.style === 'crystal' || it.id.includes('galaxy') || it.id.includes('infinity'))) {
    sparkle(g, 20, 12, '#ffffff', phase);
  }
}

function drawClub(g, it, phase) {
  const trim = trimOf(it);
  const sway = Math.round(Math.sin(phase * TAU) * 0.7);

  if (it.style === 'bat') {
    line(g, 12, 27, 21, 7 + sway, it.c2, 5);
    line(g, 12, 27, 21, 7 + sway, it.c1, 3);
    line(g, 11, 27, 20, 7 + sway, it.c3, 1);
    R(g, 10, 26, 5, 4, '#5a3a1a');
    R(g, 9, 27, 2, 2, trim);
    return;
  }
  if (it.style === 'rod') {
    line(g, 10, 27, 22, 6 + sway, it.c2, 5);
    line(g, 10, 27, 22, 6 + sway, it.c1, 3);
    line(g, 9, 27, 21, 6 + sway, it.c3, 1);
    R(g, 8, 26, 4, 4, '#4a4a52');
    return;
  }
  if (it.style === 'wrench') {
    line(g, 11, 27, 19, 12, it.c2, 5);
    line(g, 11, 27, 19, 12, it.c1, 3);
    R(g, 15, 5, 9, 4, it.c2);
    R(g, 16, 6, 7, 2, it.c1);
    R(g, 15, 9, 3, 6, it.c2);
    R(g, 21, 9, 3, 6, it.c2);
    R(g, 16, 9, 1, 5, it.c3);
    R(g, 9, 26, 4, 3, trim);
    return;
  }
  if (it.style === 'pan') {
    line(g, 9, 27, 15, 18, '#4a4a52', 3);
    line(g, 10, 27, 16, 18, it.c2, 1);
    ellipse(g, 18, 12, 7, 6, it.c2);
    ellipse(g, 18, 12, 6, 5, it.c1);
    ellipse(g, 18, 12, 4, 3, it.c3);
    R(g, 15, 11, 5, 1, '#2a2a30');
    R(g, 22, 10, 2, 2, trim);
    return;
  }
  if (it.style === 'guitar') {
    ellipse(g, 12, 21, 6, 5, it.c2);
    ellipse(g, 12, 21, 5, 4, it.c1);
    ellipse(g, 13, 20, 2, 2, '#2a1a1a');
    line(g, 16, 17, 23, 6, it.c2, 4);
    line(g, 16, 17, 23, 6, it.c1, 2);
    R(g, 22, 3, 4, 4, it.c2);
    R(g, 23, 4, 2, 2, trim);
    line(g, 15, 18, 22, 7, '#f0e0c0', 1);
    return;
  }
  if (it.style === 'mace') {
    line(g, 13, 27, 18, 14, '#5a3a1a', 3);
    ellipse(g, 19, 10, 6, 6, it.c2);
    ellipse(g, 19, 10, 5, 5, it.c1);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      line(g, 19 + Math.cos(a) * 6, 10 + Math.sin(a) * 6, 19 + Math.cos(a) * 9, 10 + Math.sin(a) * 9, it.c2, 1);
    }
    R(g, 18, 9, 2, 2, trim);
    R(g, 12, 26, 4, 3, '#4a2a1a');
    return;
  }
  if (it.style === 'boneclub') {
    line(g, 10, 27, 20, 8 + sway, it.c2, 5);
    line(g, 10, 27, 20, 8 + sway, it.c1, 3);
    ellipse(g, 21, 7, 5, 4, it.c2);
    ellipse(g, 21, 7, 4, 3, it.c1);
    ellipse(g, 17, 5, 3, 3, it.c2);
    R(g, 20, 5, 2, 2, it.c3);
    R(g, 9, 26, 4, 3, it.c2);
    return;
  }
  if (it.style === 'toothclub') {
    line(g, 12, 27, 18, 12, it.c2, 5);
    line(g, 12, 27, 18, 12, it.c1, 3);
    ellipse(g, 19, 9, 6, 5, it.c2);
    ellipse(g, 19, 9, 5, 4, it.c1);
    for (let i = 0; i < 4; i++) R(g, 15 + i * 3, 5 - (i % 2), 1, 3, '#f0f0e0');
    R(g, 20, 9, 1, 2, it.c3);
    R(g, 10, 26, 4, 3, trim);
    return;
  }

  /* 锤 / 木槌 / 大锤 */
  const headY = 9 + sway;
  line(g, 16, 27, 16, headY + 3, '#5a3a1a', 3);
  line(g, 16, 26, 16, headY + 3, it.c2, 2);
  R(g, 8, headY, 16, 7, it.c2);
  R(g, 9, headY + 1, 14, 5, it.c1);
  R(g, 10, headY + 1, 12, 1, it.c3);
  R(g, 9, headY + 5, 14, 1, it.c2);
  R(g, 14, headY + 2, 2, 3, trim);
  R(g, 7, 25, 5, 3, '#4a2a1a');
}

function drawSling(g, it, phase) {
  const stretch = Math.round(Math.sin(phase * TAU) * 1);
  const master = it.style === 'mastersling';
  const trim = trimOf(it);
  line(g, 10, 27, 10, 15, it.c2, 3);
  line(g, 10, 27, 10, 15, it.c1, 1);
  line(g, 10, 17, 5, 7, it.c2, 3);
  line(g, 10, 17, 16, 7, it.c2, 3);
  line(g, 10, 16, 5, 6, it.c1, 1);
  line(g, 10, 16, 16, 6, it.c1, 1);
  line(g, 4, 6, 17, 6 + stretch, '#d8c0a0', 1);
  R(g, 9, 16, 4, 3, '#5a3a1a');
  R(g, 10, 17, 2, 1, trim);
  if (master) {
    R(g, 3, 4, 3, 3, trim);
    R(g, 16, 3, 3, 3, trim);
    R(g, 9, 11, 2, 2, '#f0f0e0');
  }
  sparkle(g, 16, 5, '#fff8c0', phase);
}

function drawWeapon(g, it, phase) {
  if (it.cat === 'slingshot') drawSling(g, it, phase);
  else if (it.cat === 'club') drawClub(g, it, phase);
  else if (it.cat === 'dagger') drawDagger(g, it, phase);
  else drawSword(g, it, phase);
}

/* ---------------- 戒指 ---------------- */

function ringBand(g, cx, cy, rx, ry, thick, color, from = 0, to = TAU) {
  const steps = Math.max(20, Math.round((rx + ry) * 4));
  for (let i = 0; i <= steps; i++) {
    const a = from + (to - from) * i / steps;
    R(g, cx + Math.cos(a) * rx - (thick >> 1), cy + Math.sin(a) * ry - (thick >> 1), thick, thick, color);
  }
}

function gemShape(g, style, x, y, it, trim) {
  const c1 = it.c1, c2 = it.c2, c3 = it.c3;
  if (style === 'wedding') {
    for (let i = 0; i < 4; i++) R(g, x - 3 + i, y - 4 + i, 7 - i * 2, 1, i ? c1 : c3);
    R(g, x - 1, y, 3, 3, c3);
    return;
  }
  if (style === 'jukebox') {
    R(g, x - 1, y - 5, 3, 6, c1);
    R(g, x - 3, y - 4, 2, 2, c1);
    R(g, x - 1, y + 1, 4, 2, c1);
    R(g, x + 1, y - 6, 1, 2, trim);
    return;
  }
  if (style === 'lucky') {
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * TAU + Math.PI / 4;
      ellipse(g, x + Math.cos(a) * 2, y + Math.sin(a) * 2, 2, 2, c1);
    }
    R(g, x, y, 1, 1, trim);
    return;
  }
  if (style === 'magnet') {
    R(g, x - 4, y - 5, 3, 5, '#d04a3a');
    R(g, x + 2, y - 5, 3, 5, '#4a8ac0');
    R(g, x - 4, y - 6, 3, 2, '#f0f0e0');
    R(g, x + 2, y - 6, 3, 2, '#f0f0e0');
    R(g, x - 4, y, 9, 2, '#8a8a9a');
    return;
  }
  if (style === 'thorns') {
    ellipse(g, x, y, 4, 4, c2);
    ellipse(g, x, y, 3, 3, c1);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      R(g, x + Math.cos(a) * 5, y + Math.sin(a) * 5, 1, 1, trim);
    }
    return;
  }
  if (style === 'phoenix' || style === 'napalm') {
    ellipse(g, x, y + 1, 3, 3, c2);
    ellipse(g, x, y, 2, 3, c1);
    R(g, x, y - 6, 2, 3, c1);
    R(g, x - 1, y - 4, 1, 2, c3);
    R(g, x + 1, y - 7, 2, 2, trim);
    return;
  }
  if (style === 'crabshell') {
    ellipse(g, x, y, 5, 4, c2);
    ellipse(g, x, y + 1, 4, 3, c1);
    for (let i = 0; i < 3; i++) R(g, x - 3 + i * 3, y - 2, 1, 4, c2);
    R(g, x - 1, y - 3, 2, 1, trim);
    return;
  }
  if (style === 'iridium') {
    R(g, x - 5, y - 2, 4, 4, c2);
    R(g, x - 4, y - 1, 2, 2, c3);
    R(g, x + 1, y - 4, 4, 5, c1);
    R(g, x + 2, y - 3, 2, 2, c3);
    R(g, x - 1, y + 2, 3, 3, c2);
    return;
  }
  if (style === 'immunity') {
    R(g, x - 1, y - 5, 3, 10, c1);
    R(g, x - 5, y - 1, 10, 3, c1);
    R(g, x, y - 4, 1, 8, c3);
    R(g, x - 4, y, 8, 1, c3);
    return;
  }
  if (style === 'slime') {
    ellipse(g, x, y, 5, 4, c2);
    ellipse(g, x, y - 1, 4, 3, c1);
    R(g, x - 2, y - 1, 1, 1, '#1a1a1a');
    R(g, x + 2, y - 1, 1, 1, '#1a1a1a');
    R(g, x - 2, y + 2, 5, 1, c3);
    return;
  }
  /* 普通宝石：按戒指固定造型，避免随机形状破坏辨识度 */
  if (it.id === 'ruby_ring') {
    R(g, x - 3, y - 4, 2, 2, c3);
    R(g, x + 2, y - 4, 2, 2, c3);
    R(g, x - 3, y - 2, 7, 2, c1);
    R(g, x - 2, y, 5, 2, c1);
    R(g, x - 1, y + 2, 3, 2, c1);
    R(g, x, y + 4, 1, 1, c2);
    return;
  }
  if (it.id === 'emerald_ring') {
    R(g, x - 4, y - 5, 9, 10, c2);
    R(g, x - 3, y - 4, 7, 8, c1);
    R(g, x - 2, y - 3, 4, 2, c3);
    R(g, x + 2, y - 3, 1, 5, c2);
    return;
  }
  if (it.id === 'aquamarine_ring') {
    for (let i = 0; i < 5; i++) R(g, x - 4 + i, y - 5 + i, 9 - i * 2, 1, i < 2 ? c3 : c1);
    for (let i = 0; i < 4; i++) R(g, x - 3 + i, y + 4 - i, 7 - i * 2, 1, c2);
    return;
  }
  if (it.id === 'topaz_ring') {
    R(g, x - 3, y - 4, 7, 8, c2);
    R(g, x - 2, y - 3, 5, 6, c1);
    R(g, x - 1, y - 2, 2, 2, c3);
    return;
  }
  if (it.id === 'jade_ring') {
    ellipse(g, x, y, 4, 4, c2);
    ellipse(g, x, y - 1, 3, 3, c1);
    R(g, x - 1, y - 3, 2, 1, c3);
    return;
  }
  /* 紫水晶等默认椭圆宝石 */
  ellipse(g, x, y, 4, 4, c2);
  ellipse(g, x, y - 1, 3, 3, c1);
  R(g, x - 1, y - 3, 2, 1, c3);
}

function drawRing(g, it, phase) {
  const trim = trimOf(it);
  const glow = it.style === 'glow' || it.style === 'glowstone' || it.style === 'yoba' || it.style === 'iridium' || it.style === 'jukebox';
  const cy = 20;
  if (glow) {
    g.globalAlpha = 0.18 + Math.sin(phase * TAU) * 0.05;
    ellipse(g, 16, 17, 14, 12, it.c3);
    g.globalAlpha = 1;
  }
  ringBand(g, 16, cy, 8, 6, 3, it.c2);
  ringBand(g, 16, cy, 8, 6, 1, it.c1, Math.PI * 1.05, Math.PI * 1.95);
  ringBand(g, 16, cy, 8, 6, 1, it.c3, Math.PI * 0.05, Math.PI * 0.55);
  R(g, 14, 14, 2, 2, it.c2);
  R(g, 18, 14, 2, 2, it.c2);
  gemShape(g, it.style, 16, 10, it, trim);
  if (it.style === 'warrior') {
    R(g, 15, 4, 2, 5, trim);
    R(g, 13, 6, 6, 1, trim);
  }
  if (it.style === 'vampire') {
    R(g, 13, 12, 1, 2, '#f0f0e0');
    R(g, 19, 12, 1, 2, '#f0f0e0');
  }
  if (it.style === 'soul' || it.style === 'protection') {
    sparkle(g, 9, 14, '#d0b0ff', phase);
  }
  if (it.style === 'glowstone') sparkle(g, 23, 14, '#fff8c0', phase);
  if (hashOf(it.id) % 3 === 0) sparkle(g, 25, 24, trim, phase + 0.2);
}

/* ---------------- 靴子 ---------------- */

function bootBase(g, it, phase, o = {}) {
  const bob = Math.round(Math.sin(phase * TAU) * 0.5);
  const shaft = o.shaft ?? 11;
  const y = 9 + bob;
  const w = o.w ?? 9;
  R(g, 10, y, w, shaft, it.c2);
  R(g, 10, y, w - 1, shaft, it.c1);
  R(g, 10, y, 2, shaft, it.c3);
  R(g, 8, y + shaft - 2, 15, 5, it.c1);
  R(g, 8, y + shaft - 2, 15, 1, it.c3);
  R(g, 7, y + shaft + 3, 17, 2, '#2a2018');
  R(g, 8, y + shaft - 3, 4, 3, it.c1);
  R(g, 12, y + shaft, 2, 1, it.c2);
  R(g, 17, y + shaft, 2, 1, it.c2);
  R(g, 21, y + shaft - 1, 2, 3, it.c3);
  if (o.lace) {
    for (let i = 0; i < 4; i++) R(g, 14, y + 2 + i * 2, 4, 1, o.lace);
  }
  return { y, shaft };
}

function drawBoots(g, it, phase) {
  const trim = trimOf(it);
  const style = it.style;
  const bob = Math.round(Math.sin(phase * TAU) * 0.5);

  if (style === 'sneaker') {
    const { y } = bootBase(g, it, phase, { shaft: 6, lace: '#e0e0e0' });
    R(g, 9, y + 8, 14, 2, '#e8e8e8');
    R(g, 22, y + 7, 3, 2, it.c3);
    R(g, 10, y, 3, 2, trim);
    return;
  }
  if (style === 'rubber') {
    const { y } = bootBase(g, it, phase, { shaft: 13 });
    R(g, 8, y + 14, 15, 2, '#e0c040');
    R(g, 10, y + 1, 9, 2, '#fff0a0');
    return;
  }
  if (style === 'work') {
    const { y } = bootBase(g, it, phase, { shaft: 10, lace: '#5a3a1a' });
    R(g, 8, y + 11, 7, 3, '#9aa0a8');
    R(g, 8, y + 11, 7, 1, '#d0d8e0');
    return;
  }
  if (style === 'combat') {
    const { y } = bootBase(g, it, phase, { shaft: 12, lace: '#a0a0b0' });
    R(g, 8, y + 4, 15, 2, '#6a6a7a');
    R(g, 8, y + 9, 15, 2, '#6a6a7a');
    R(g, 22, y + 2, 2, 8, '#9aa0a8');
    return;
  }
  if (style === 'tundra' || style === 'thermal') {
    const { y } = bootBase(g, it, phase, { shaft: 11 });
    R(g, 9, y, 11, 3, '#f0f0e8');
    for (let i = 0; i < 5; i++) R(g, 9 + i * 2, y - 1, 1, 2, '#ffffff');
    R(g, 13, y + 6, 6, 1, trim);
    return;
  }
  if (style === 'leprechaun') {
    const { y } = bootBase(g, it, phase, { shaft: 9 });
    R(g, 13, y + 3, 5, 4, trim);
    R(g, 14, y + 4, 3, 2, '#5a3a1a');
    R(g, 9, y + 8, 13, 1, '#f0e0a0');
    return;
  }
  if (style === 'cowboy') {
    const { y } = bootBase(g, it, phase, { shaft: 10 });
    R(g, 8, y + 13, 5, 2, '#3a2418');
    for (let i = 0; i < 3; i++) R(g, 12 + i * 3, y + 2, 1, 6, '#e0c080');
    R(g, 9, y + 9, 12, 2, trim);
    return;
  }
  if (style === 'dark') {
    const { y } = bootBase(g, it, phase, { shaft: 14, lace: '#6a4a6a' });
    R(g, 9, y + 1, 11, 2, '#1a1a22');
    R(g, 20, y + 8, 3, 3, trim);
    return;
  }
  if (style === 'firewalker') {
    const { y } = bootBase(g, it, phase, { shaft: 10 });
    R(g, 9, y - 3, 3, 4, '#e05a2a');
    R(g, 13, y - 5, 3, 6, '#f0a03a');
    R(g, 17, y - 3, 3, 4, '#e05a2a');
    R(g, 13, y - 5, 1, 3, '#fff0a0');
    R(g, 8, y + 11, 15, 2, '#f0c060');
    return;
  }
  if (style === 'genie') {
    const { y } = bootBase(g, it, phase, { shaft: 8 });
    R(g, 20, y + 4, 5, 4, it.c1);
    R(g, 23, y + 1, 3, 4, it.c1);
    R(g, 24, y - 1, 3, 2, it.c3);
    R(g, 8, y + 12, 15, 2, trim);
    R(g, 9, y + 2, 2, 6, '#f0e0a0');
    return;
  }
  if (style === 'space') {
    const { y } = bootBase(g, it, phase, { shaft: 13 });
    R(g, 9, y + 2, 11, 2, '#4a2a8a');
    R(g, 9, y + 7, 11, 2, '#4a2a8a');
    R(g, 8, y + 12, 15, 2, '#d0b0ff');
    sparkle(g, 23, y + 5, '#ffffff', phase);
    sparkle(g, 10, y + 10, '#d0b0ff', phase + 0.2);
    return;
  }
  if (style === 'crystal') {
    g.globalAlpha = 0.85;
    const { y } = bootBase(g, it, phase, { shaft: 11 });
    g.globalAlpha = 1;
    R(g, 9, y + 1, 3, 8, '#ffffff');
    R(g, 16, y + 3, 2, 6, '#a0f0ff');
    R(g, 8, y + 12, 15, 2, '#d0f8ff');
    sparkle(g, 24, y + 4, '#ffffff', phase);
    return;
  }
  if (style === 'magic') {
    const { y } = bootBase(g, it, phase, { shaft: 10 });
    R(g, 9, y, 11, 2, '#f0a0c0');
    R(g, 8, y + 10, 15, 2, '#a0d0f0');
    sparkle(g, 23, y + 2, '#fff0a0', phase);
    sparkle(g, 9, y + 5, '#a0f0d0', phase + 0.3);
    sparkle(g, 20, y + 9, '#f0a0f0', phase + 0.6);
    return;
  }
  if (style === 'clown') {
    const { y } = bootBase(g, it, phase, { shaft: 9 });
    R(g, 20, y + 3, 4, 3, it.c1);
    R(g, 23, y + 1, 4, 2, it.c1);
    ellipse(g, 27, y, 2, 2, trim);
    R(g, 9, y + 9, 11, 1, '#f0e0a0');
    R(g, 14, y + 4, 2, 2, '#f0e0a0');
    return;
  }
  if (style === 'mermaid') {
    const { y } = bootBase(g, it, phase, { shaft: 12 });
    for (let i = 0; i < 4; i++) {
      line(g, 8, y + 2 + i * 3, 3, y + i * 3, it.c3, 1);
      line(g, 8, y + 2 + i * 3, 4, y + 5 + i * 2, it.c2, 1);
    }
    for (let i = 0; i < 3; i++) R(g, 13 + i * 3, y + 6, 1, 1, trim);
    return;
  }
  if (style === 'dragon') {
    const { y } = bootBase(g, it, phase, { shaft: 12 });
    for (let i = 0; i < 3; i++) R(g, 9 + i * 3, y + 7, 2, 2, it.c2);
    for (let i = 0; i < 3; i++) R(g, 11 + i * 3, y + 3, 2, 2, it.c3);
    R(g, 6, y + 13, 3, 2, '#e0e0c0');
    R(g, 22, y + 12, 3, 2, '#e0e0c0');
    R(g, 20, y + 1, 3, 4, it.c2);
    return;
  }

  /* 普通皮靴 */
  const { y } = bootBase(g, it, phase, { shaft: 11 });
  R(g, 9, y + 3, 9, 2, trim);
  R(g, 9, y + 7, 9, 1, it.c2);
  R(g, 21, y + 9, 2, 2, it.c3);
}

/* ---------------- 主入口 ---------------- */

export function drawEquipment(g, item, phase = 0.25) {
  const it = typeof item === 'string' ? EQUIP_MAP[item] : item;
  if (!it) return;
  g.save();
  g.imageSmoothingEnabled = false;
  if (it.cat === 'ring') drawRing(g, it, phase);
  else if (it.cat === 'boots') drawBoots(g, it, phase);
  else drawWeapon(g, it, phase);
  g.restore();
}
