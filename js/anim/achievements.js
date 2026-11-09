/* 星露谷成就图鉴：49 个成就徽章。
 * 32×32 徽章，按财富 / 社交 / 料理 / 建造 / 钓鱼 / 收集 / 任务 / 农业 / 冒险 / 岛屿分组。 */

import { R, line, ellipse, TAU } from './pixel.js';

export const ACH_W = 32;
export const ACH_H = 32;

export const ACH_GROUPS = [
  { id: 'all', name: '全部' },
  { id: 'wealth', name: '财富' },
  { id: 'social', name: '社交' },
  { id: 'cooking', name: '料理' },
  { id: 'building', name: '建造' },
  { id: 'fishing', name: '钓鱼' },
  { id: 'museum', name: '收集' },
  { id: 'quest', name: '任务' },
  { id: 'farming', name: '农业' },
  { id: 'adventure', name: '冒险' },
  { id: 'island', name: '岛屿' }
];

const C = {
  gold:    ['#e8c85a', '#a07a20', '#fff2a0'],
  silver:  ['#d0d8e0', '#7a8490', '#ffffff'],
  bronze:  ['#c08a50', '#7a4a20', '#e8b880'],
  red:     ['#d04a3a', '#8a2a1a', '#f08a70'],
  pink:    ['#e08ab0', '#a04a70', '#ffc0d8'],
  blue:    ['#4a8ac0', '#2a5a8a', '#a0d0f0'],
  green:   ['#5aa04a', '#3a6a2a', '#a0d080'],
  orange:  ['#e08a3a', '#a05a1a', '#f0c080'],
  purple:  ['#8a5ac0', '#5a2a8a', '#c0a0f0'],
  teal:    ['#4ac0b0', '#2a8070', '#a0f0e0'],
  brown:   ['#8a5a3a', '#5a3418', '#c09060'],
  dark:    ['#3a3a4a', '#1a1a2a', '#8a8aa0'],
  cyan:    ['#4ac0c0', '#2a7a7a', '#a0f0f0'],
  iridium: ['#9a8ac0', '#5a4a8a', '#e0d0ff']
};

const TRIMS = ['#e0c060', '#d04a3a', '#5aa04a', '#4a8ac0', '#c0a0f0', '#f0f0e0', '#e08a3a', '#4ac0c0'];

/* [id, 中文名, 英文名, 分组, 符号, 配色, 说明] */
const RAW = [
  ['greenhorn','新手','Greenhorn','wealth','coin','bronze','赚取 15,000g'],
  ['cowpoke','牛仔','Cowpoke','wealth','coin','silver','赚取 50,000g'],
  ['homesteader','农场主','Homesteader','wealth','coin','gold','赚取 250,000g'],
  ['millionaire','百万富翁','Millionaire','wealth','crown','gold','赚取 1,000,000g'],
  ['legend','传奇','Legend','wealth','crown','iridium','赚取 10,000,000g'],

  ['a_new_friend','新朋友','A New Friend','social','heart','pink','与某人达到 5 心'],
  ['best_friends','挚友','Best Friends','social','heart','pink','与某人达到 10 心'],
  ['beloved_farmer','受人爱戴的农夫','The Beloved Farmer','social','friends','pink','与 8 人达到 10 心'],
  ['cliques','小圈子','Cliques','social','friends','purple','与 4 人达到 5 心'],
  ['networking','社交网络','Networking','social','friends','blue','与 10 人达到 5 心'],
  ['popular','受欢迎','Popular','social','friends','gold','与 20 人达到 5 心'],
  ['full_house','满屋','Full House','social','heart','red','结婚并有两个孩子'],

  ['cook','厨师','Cook','cooking','pot','orange','烹饪 10 道菜'],
  ['sous_chef','副主厨','Sous Chef','cooking','chef','orange','烹饪 25 道菜'],
  ['gourmet_chef','美食大厨','Gourmet Chef','cooking','chef','gold','烹饪全部菜谱'],

  ['moving_up','乔迁之喜','Moving Up','building','house','blue','升级农舍'],
  ['living_large','宽敞生活','Living Large','building','mansion','blue','农舍升到最大'],

  ['diy','自己动手','D.I.Y.','building','hammer','brown','制作 15 种物品'],
  ['artisan','工匠','Artisan','building','anvil','brown','制作 30 种物品'],
  ['craft_master','制作大师','Craft Master','building','tools','gold','制作全部物品'],

  ['fisherman','渔夫','Fisherman','fishing','fish','blue','钓到 10 种鱼'],
  ['ol_mariner','老水手',"Ol' Mariner",'fishing','rod','teal','钓到 24 种鱼'],
  ['master_angler','钓鱼大师','Master Angler','fishing','trophy','gold','钓到全部鱼'],
  ['mother_catch','鱼妈妈','Mother Catch','fishing','fish','pink','钓到 100 条鱼'],

  ['complete_collection','完整收藏','A Complete Collection','museum','relic','purple','完成博物馆收藏'],
  ['treasure_trove','宝藏库','Treasure Trove','museum','gem','purple','捐赠 40 件博物馆物品'],

  ['gofer','跑腿','Gofer','quest','scroll','green','完成 10 个求助任务'],
  ['a_big_help','大帮手','A Big Help','quest','check','green','完成 40 个求助任务'],

  ['polyculture','多种经营','Polyculture','farming','crop','green','每种作物运送 15 个'],
  ['monoculture','单一经营','Monoculture','farming','basket','green','运送 300 个同种作物'],
  ['full_shipment','全发货','Full Shipment','farming','ship','gold','运送全部物品'],

  ['prairie_king','草原之王','Prairie King','adventure','arcade','red','通关草原大王'],
  ['the_bottom','矿井底部','The Bottom','adventure','mine','dark','到达矿井底部'],
  ['local_legend','本地传奇','Local Legend','adventure','trophy','gold','修复社区中心'],
  ['joja_year','Joja 年度会员','Joja Co. Member Of The Year','adventure','joja','blue','完成全部 Joja 项目'],
  ['stardrops','星之果实之谜','Mystery Of The Stardrops','adventure','star','purple','找到全部星之果实'],
  ['singular_talent','单项天才','Singular Talent','adventure','medal','silver','一项技能达到 10 级'],
  ['five_ways','五道大师','Master Of The Five Ways','adventure','medal','gold','五项技能全部 10 级'],
  ['protector','山谷守护者','Protector Of The Valley','adventure','skull','red','完成全部怪物讨伐'],
  ['fector','费克托挑战',"Fector's Challenge",'adventure','sword','purple','草原大王无死亡通关'],
  ['danger_deep','深渊危险','Danger In The Deep','adventure','danger','red','到达危险矿井底部'],
  ['infinite_power','无限力量','Infinite Power','adventure','infinity','iridium','获得最强武器'],

  ['distant_shore','遥远海岸','A Distant Shore','island','island','teal','到达姜岛'],
  ['well_read','博览群书','Well-Read','island','book','brown','读完所有书'],
  ['two_thumbs','好评如潮','Two Thumbs Up','island','film','purple','看一场电影'],
  ['blue_ribbon','蓝丝带','Blue Ribbon','island','ribbon','blue','获得星露谷集会第一名'],
  ['soup','难忘的汤','An Unforgettable Soup','island','soup','orange','让州长满意'],
  ['good_neighbors','好邻居','Good Neighbors','island','leaf','green','帮助森林邻居'],
  ['perfection','完美','Perfection','island','summit','gold','到达山顶']
];

function pal(key) {
  const c = C[key] || C.gold;
  return { c1: c[0], c2: c[1], c3: c[2] };
}

export const ACHIEVEMENTS = RAW.map(([id, name, en, group, symbol, p, desc]) => ({
  id, name, en, group, symbol, desc, ...pal(p)
}));
export const ACH_MAP = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));

export function achGroupName(g) {
  const x = ACH_GROUPS.find(v => v.id === g);
  return x ? x.name : g;
}

function hashOf(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/* ---------------- 徽章底 ---------------- */

function badge(g, it, shape) {
  if (shape === 'shield') {
    R(g, 7, 5, 18, 14, it.c2);
    R(g, 8, 6, 16, 12, it.c1);
    R(g, 6, 17, 20, 4, it.c2);
    R(g, 10, 21, 12, 3, it.c2);
    R(g, 13, 24, 6, 2, it.c2);
    R(g, 9, 7, 5, 2, it.c3);
  } else if (shape === 'plaque') {
    R(g, 5, 6, 22, 17, it.c2);
    R(g, 6, 7, 20, 15, it.c1);
    R(g, 7, 8, 4, 13, it.c3);
    R(g, 8, 24, 16, 2, it.c2);
  } else {
    ellipse(g, 16, 14, 10, 10, it.c2);
    ellipse(g, 16, 13, 8, 8, it.c1);
    ellipse(g, 13, 10, 3, 3, it.c3);
    R(g, 9, 22, 4, 7, it.c2);
    R(g, 19, 22, 4, 7, it.c2);
    R(g, 9, 27, 4, 2, it.c1);
    R(g, 19, 27, 4, 2, it.c1);
  }
}

function symbol(g, it) {
  const x = 16, y = 14;
  const s = it.symbol;
  if (s === 'coin' || s === 'gem' || s === 'medal') {
    ellipse(g, x, y, 5, 5, it.c2);
    ellipse(g, x, y, 4, 4, it.c1);
    R(g, x - 1, y - 3, 2, 2, it.c3);
    if (s === 'gem') { R(g, x - 1, y - 1, 3, 3, it.c3); }
    if (s === 'medal') { R(g, x - 2, y - 1, 5, 2, it.c3); }
    return;
  }
  if (s === 'crown' || s === 'infinity') {
    R(g, x - 6, y + 2, 13, 3, it.c2);
    for (let i = 0; i < 3; i++) R(g, x - 5 + i * 5, y - 4 - (i % 2) * 2, 2, 7 + (i % 2) * 2, it.c1);
    R(g, x - 1, y - 2, 2, 2, it.c3);
    R(g, x - 5, y - 4, 1, 2, it.c3);
    R(g, x + 4, y - 6, 1, 2, it.c3);
    return;
  }
  if (s === 'heart') {
    R(g, x - 4, y - 3, 3, 2, it.c3);
    R(g, x + 2, y - 3, 3, 2, it.c3);
    R(g, x - 4, y - 1, 9, 3, it.c1);
    R(g, x - 3, y + 2, 7, 2, it.c1);
    R(g, x - 1, y + 4, 3, 2, it.c1);
    return;
  }
  if (s === 'friends') {
    for (let i = 0; i < 3; i++) {
      ellipse(g, x - 5 + i * 5, y - 2, 2, 2, it.c3);
      R(g, x - 7 + i * 5, y + 1, 4, 5, it.c1);
    }
    return;
  }
  if (s === 'pot' || s === 'chef' || s === 'soup') {
    R(g, x - 5, y - 2, 11, 7, it.c2);
    R(g, x - 4, y - 1, 9, 5, it.c1);
    R(g, x - 6, y - 3, 13, 2, it.c3);
    if (s === 'chef') {
      R(g, x - 4, y - 8, 8, 5, it.c3);
      R(g, x - 3, y - 9, 6, 2, it.c1);
    }
    if (s === 'soup') {
      R(g, x - 3, y - 5, 6, 2, it.c3);
      R(g, x - 5, y + 4, 11, 2, it.c2);
    }
    return;
  }
  if (s === 'house' || s === 'mansion') {
    R(g, x - 6, y, 13, 8, it.c2);
    R(g, x - 5, y + 1, 11, 7, it.c1);
    for (let i = 0; i < 6; i++) R(g, x - 7 + i * 2, y - 1 - i, 2, 2, it.c3);
    R(g, x - 1, y + 3, 3, 5, it.c2);
    if (s === 'mansion') {
      R(g, x - 9, y + 4, 4, 5, it.c1);
      R(g, x + 6, y + 4, 4, 5, it.c1);
    }
    return;
  }
  if (s === 'hammer' || s === 'anvil' || s === 'tools') {
    line(g, x - 5, y + 6, x + 4, y - 5, it.c2, 3);
    R(g, x + 1, y - 7, 8, 4, it.c1);
    R(g, x + 2, y - 6, 6, 2, it.c3);
    if (s === 'anvil') {
      R(g, x - 7, y + 2, 14, 4, it.c1);
      R(g, x - 3, y + 6, 6, 3, it.c2);
    }
    if (s === 'tools') {
      line(g, x - 7, y + 5, x - 2, y, it.c1, 2);
      R(g, x - 9, y + 4, 4, 3, it.c3);
    }
    return;
  }
  if (s === 'fish' || s === 'rod') {
    if (s === 'rod') {
      line(g, x - 7, y + 7, x + 6, y - 7, it.c2, 2);
      line(g, x + 6, y - 7, x + 8, y + 4, it.c3, 1);
      R(g, x + 7, y + 4, 2, 3, it.c1);
      return;
    }
    ellipse(g, x - 1, y + 1, 6, 3, it.c2);
    ellipse(g, x - 1, y + 1, 5, 2, it.c1);
    R(g, x + 4, y, 3, 2, it.c1);
    R(g, x + 3, y - 1, 2, 1, it.c3);
    return;
  }
  if (s === 'relic' || s === 'scroll' || s === 'book') {
    R(g, x - 5, y - 6, 11, 13, it.c2);
    R(g, x - 4, y - 5, 9, 11, it.c1);
    for (let i = 0; i < 4; i++) R(g, x - 2, y - 3 + i * 2, 6, 1, it.c2);
    if (s === 'book') {
      R(g, x - 6, y - 6, 2, 13, it.c3);
      R(g, x - 5, y - 6, 10, 2, it.c3);
    }
    if (s === 'relic') R(g, x - 1, y - 1, 2, 2, it.c3);
    return;
  }
  if (s === 'check') {
    line(g, x - 5, y, x - 1, y + 4, it.c3, 2);
    line(g, x - 1, y + 4, x + 6, y - 5, it.c3, 2);
    return;
  }
  if (s === 'crop' || s === 'basket' || s === 'leaf') {
    if (s === 'leaf') {
      R(g, x - 1, y - 5, 2, 10, it.c2);
      ellipse(g, x - 3, y - 2, 5, 3, it.c1);
      ellipse(g, x + 3, y + 1, 5, 3, it.c1);
      return;
    }
    ellipse(g, x, y + 1, 6, 5, it.c2);
    ellipse(g, x, y, 5, 4, it.c1);
    R(g, x - 1, y - 5, 2, 4, it.c2);
    if (s === 'crop') R(g, x - 4, y - 1, 2, 3, it.c3);
    if (s === 'basket') {
      R(g, x - 6, y - 3, 13, 2, it.c3);
      line(g, x - 5, y - 3, x - 2, y - 7, it.c2, 1);
      line(g, x + 5, y - 3, x + 2, y - 7, it.c2, 1);
    }
    return;
  }
  if (s === 'ship') {
    R(g, x - 7, y + 1, 15, 4, it.c2);
    R(g, x - 5, y + 5, 11, 2, it.c1);
    line(g, x, y - 6, x, y + 1, it.c2, 1);
    R(g, x + 1, y - 6, 5, 5, it.c3);
    return;
  }
  if (s === 'arcade') {
    R(g, x - 5, y - 7, 11, 14, it.c2);
    R(g, x - 4, y - 6, 9, 8, it.c1);
    R(g, x - 2, y - 4, 5, 3, '#2a2a3a');
    R(g, x - 3, y + 3, 2, 2, it.c3);
    R(g, x + 2, y + 3, 2, 2, it.c3);
    return;
  }
  if (s === 'mine' || s === 'danger') {
    for (let i = 0; i < 4; i++) line(g, x - 7, y + 6 - i * 4, x + 7, y + 3 - i * 4, it.c2, 1);
    R(g, x - 6, y + 1, 3, 6, it.c1);
    R(g, x + 3, y - 1, 3, 8, it.c1);
    if (s === 'danger') R(g, x - 1, y - 4, 2, 3, '#f0c040');
    return;
  }
  if (s === 'trophy') {
    R(g, x - 4, y - 6, 9, 7, it.c2);
    R(g, x - 3, y - 5, 7, 5, it.c1);
    R(g, x - 6, y - 4, 3, 2, it.c2);
    R(g, x + 5, y - 4, 3, 2, it.c2);
    R(g, x - 1, y + 1, 3, 4, it.c2);
    R(g, x - 4, y + 5, 9, 2, it.c3);
    return;
  }
  if (s === 'joja') {
    R(g, x - 7, y - 4, 15, 8, it.c2);
    R(g, x - 6, y - 3, 13, 6, it.c1);
    for (let i = 0; i < 3; i++) R(g, x - 4 + i * 4, y - 2, 2, 4, it.c3);
    return;
  }
  if (s === 'star' || s === 'summit') {
    if (s === 'summit') {
      R(g, x - 6, y + 5, 13, 3, it.c2);
      R(g, x - 4, y + 3, 8, 2, it.c2);
      R(g, x - 2, y + 1, 4, 2, it.c2);
      R(g, x - 1, y - 2, 3, 3, it.c3);
      R(g, x - 1, y + 2, 2, 1, it.c3);
      return;
    }
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i / 5 * TAU;
      line(g, x, y, x + Math.cos(a) * 7, y + Math.sin(a) * 7, it.c2, 2);
    }
    R(g, x - 1, y - 1, 3, 3, it.c3);
    return;
  }
  if (s === 'skull') {
    ellipse(g, x, y - 1, 5, 5, it.c1);
    R(g, x - 3, y - 2, 2, 2, '#1a1a1a');
    R(g, x + 2, y - 2, 2, 2, '#1a1a1a');
    R(g, x - 3, y + 4, 7, 2, it.c1);
    return;
  }
  if (s === 'sword') {
    line(g, x - 6, y + 6, x + 6, y - 6, it.c2, 2);
    line(g, x - 5, y + 6, x + 5, y - 6, it.c3, 1);
    line(g, x - 6, y + 2, x - 2, y + 6, it.c1, 2);
    return;
  }
  if (s === 'island') {
    ellipse(g, x, y + 5, 8, 3, it.c2);
    R(g, x - 1, y - 3, 2, 9, it.c1);
    ellipse(g, x - 3, y - 4, 4, 3, it.c1);
    ellipse(g, x + 3, y - 3, 4, 3, it.c3);
    return;
  }
  if (s === 'film') {
    R(g, x - 7, y - 5, 15, 11, it.c2);
    R(g, x - 6, y - 4, 13, 9, it.c1);
    R(g, x - 4, y - 2, 8, 5, '#2a2a3a');
    for (let i = 0; i < 3; i++) {
      R(g, x - 6 + i * 5, y - 6, 2, 2, it.c3);
      R(g, x - 6 + i * 5, y + 5, 2, 2, it.c3);
    }
    return;
  }
  if (s === 'ribbon') {
    R(g, x - 4, y - 5, 9, 7, it.c2);
    R(g, x - 3, y - 4, 7, 5, it.c1);
    R(g, x - 1, y - 1, 3, 3, it.c3);
    R(g, x - 4, y + 2, 3, 6, it.c2);
    R(g, x + 2, y + 2, 3, 6, it.c2);
    return;
  }
}

export function drawAchievementIcon(g, achievement, phase = 0.25) {
  const it = typeof achievement === 'string' ? ACH_MAP[achievement] : achievement;
  if (!it) return;
  g.save();
  g.imageSmoothingEnabled = false;
  let shape = 'medal';
  if (['museum', 'island', 'quest'].includes(it.group)) shape = 'plaque';
  if (['adventure', 'farming'].includes(it.group)) shape = 'shield';
  badge(g, it, shape);
  symbol(g, it);
  const hh = hashOf(it.id);
  R(g, 5 + hh % 22, 5 + Math.floor(hh / 22) % 22, 1, 1, TRIMS[hh % TRIMS.length]);
  g.restore();
}
