"""生成汇总报告 _cmp/report/REPORT.md。"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REP = ROOT / '_cmp' / 'report'

summary = json.loads((REP / 'summary.json').read_text('utf-8'))
internal = json.loads((REP / 'internal.json').read_text('utf-8'))
cross = json.loads((REP / 'crosscheck.json').read_text('utf-8'))
CN = {
    'crops': '作物', 'trees': '树木', 'fish': '鱼类', 'minerals': '矿物',
    'monsters': '怪物', 'equipment': '装备（武器/戒指/靴子）', 'hats': '帽子',
    'artisan': '工匠品', 'dishes': '料理', 'buildings': '建筑',
    'npcs': '村民头像', 'animals': '动物',
}

rows = []
for cat, s in summary.items():
    it = internal.get(cat, {})
    rows.append((CN.get(cat, cat), cat, s, it))
rows.sort(key=lambda r: -r[2]['margin'])

total = sum(s['items'] for s in summary.values())
ok = sum(s['ok'] for s in summary.values())
all_items = 0
for cat in summary:
    mf = ROOT / '_cmp' / 'manifest' / f'{cat}.json'
    if mf.exists():
        d = json.loads(mf.read_text('utf-8'))
        all_items += len(d['items']) + len(d.get('missing', []))
own_all = sum(s['own_mean'] * s['ok'] for s in summary.values()) / max(1, ok)
rnd_all = sum(s['random_mean'] * s['ok'] for s in summary.values()) / max(1, ok)

L = []
L.append('# 本项目像素图 vs stardewvalleywiki.com 官方原图 —— 比对报告\n')
L.append('## 结论\n')
L.append('**不一样。** 本项目的 616 个像素素材全部是按"星露谷题材"重新程序化绘制的一套原创图，'
         '既不是官方素材的复制，也不是对官方图的描摹。')
L.append('')
L.append('两边"看起来像"，是因为共用了同一套像素画约定（小尺寸、有限配色、圆角造型），'
         '而不是因为造型相同 —— 实测把我们的图和**随便一件**同类的官方图摆在一起，'
         '分数几乎和摆在自己的官方原型旁边一样高。\n')
L.append(f'- 项目素材共 **{all_items}** 项，覆盖 {len(summary)} 个分类')
L.append(f'- 其中在 wiki 上找到对应官方像素图并完成比对：**{total}** 项（{total / all_items * 100:.1f}%）')
L.append(f'- 整体匹配均分 **{own_all:.1f}** / 100（指标已校准：同一张官方图与自己比 = 100.00）')
L.append(f'- 同分类随机错配基准 **{rnd_all:.1f}**，平均只高 **{own_all - rnd_all:+.1f}** 分\n')

L.append('## 分类明细\n')
L.append('| 分类 | 条目 | 匹配均分 | 随机错配基准 | 差距 | p10 | p50 | p90 |')
L.append('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |')
for cn, cat, s, it in rows:
    L.append(f"| {cn} | {s['items']} | {s['own_mean']:.1f} | {s['random_mean']:.1f} | "
             f"{s['margin']:+.1f} | {s['p10']:.1f} | {s['p50']:.1f} | {s['p90']:.1f} |")
L.append('')
L.append('> **差距** = 匹配均分 − 同分类随机错配基准分。')
L.append('> 如果本项目是照着官方画的，这一列应该普遍在 +20 以上；')
L.append('> 实测最高只有 +6.4（装备），最低 +0.8（料理）—— 说明"这是胡萝卜"这件事，'
         '从我们的图上基本看不出来。\n')

L.append('## 判别力：我们自己那一套内部有多雷同\n')
L.append('把"我们这一组"内部两两互比，再把"官方那一组"内部两两互比：\n')
L.append('| 分类 | 我们内部相似度 | 官方内部相似度 | 差 | 匹配分 − 我们内部 |')
L.append('| --- | ---: | ---: | ---: | ---: |')
for cn, cat, s, it in rows:
    if not it:
        continue
    L.append(f"| {cn} | {it['ours_internal']:.1f} | {it['wiki_internal']:.1f} | "
             f"{it['gap']:+.1f} | {s['own_mean'] - it['ours_internal']:+.1f} |")
L.append('')
L.append('最后一列是**关键**：如果我们的图能认出"这是胡萝卜"，那么我们的胡萝卜和官方胡萝卜的相似度，')
L.append('应该明显高于它和自己同类的其它作物（比如我们的蓝莓）。实测几乎全部为负 ——')
L.append('我们的胡萝卜和官方胡萝卜（63.5）甚至不如我们的胡萝卜和我们自己的其它作物（平均 66.2）像。\n')
L.append('其中 **村民头像 +11.4** 最说明问题：官方 34 个头像是 34 张独立画的美术头像，'
         '彼此差异明显；而我们的 34 个头像是**同一个模板换配色**'
         '（`js/anim/npcs.js` 的 `drawPortrait`：固定的脸型/眼位/嘴位，'
         '只换发色、帽子、肤色），内部相似度高达 89.3，比官方自己内部还高 11 分。\n')

L.append('## 逐项像素比对发现的差异\n')
L.append('1. **描边**：官方素材统一带 1px 深色描边（黑/深褐），本项目大部分素材没有描边，'
         '靠同色系明暗（c1/c2/c3）区分体积。')
L.append('2. **原始分辨率**：游戏原图是 16×16 级别的小图，wiki 上按 2~4 倍放大存放'
         '（如 48×48 / 54×54，实测放大倍数分布见各分类 JSON 的 `wiki_scale_hist`）。'
         '本项目普遍画得更大更细 —— 例如胡萝卜本项目 20×21 像素，官方还原回原始像素后只有 12×16。')
L.append('3. **配色体系**：本项目所有物件共用 `js/anim/pixel.js` 里的一套固定调色板，'
         '同类物件之间差异很小 —— 这正是"随机错配分也很高"的直接原因。')
L.append('4. **造型信息量**：官方蘑菇树是一顶带斑点的红蘑菇帽 + 细长菌柄，'
         '本项目是一团灰白椭圆 + 黄方块；官方橡树有分层树冠、树皮纹理、阴影，'
         '本项目是一个绿色三角 + 棕色方块树干。')
L.append('5. **语义层级不同**：本项目画的是"地里的作物植株""完整大树""能戴在农夫头上的帽子"；'
         'wiki 图标多是"收获物""单件物品"。比对时必须改用生长阶段图（Harvest 那一列，'
         '而不是可再收获作物的 After-Harvest 空植株）才谈得上公平。')
L.append('6. **官方道具名与项目英文名普遍对不上**：'
         'Flour→Wheat Flour、Cookies→Cookie、Vegetable Stew→Vegetable Medley、'
         'Cabin→Plank Cabin Stage 1、Farmhouse→House (tier 1)、Chicken→White Chicken、'
         'Blue Slime→Frost Jelly、Coffee Bean→Coffee Stage N、Mossy Oak→Wild Tree Stage N。'
         '项目里的 `en` 字段是通用英文名而非官方道具名 —— 这侧面说明本项目没有按官方素材清单逐条对照着画。\n')

L.append('## 映射可靠性：我们的图和官方道具对得上吗\n')
L.append('光是找到文件还不够 —— 文件名对得上，不代表选对了图。'
         '所以把每个分类的清单和 wiki **自己的页面**做交叉验证：'
         '我们选的官方图，是否真的被那个页面引用。\n')
L.append('| 分类 | 官方页面 | 页面确实引用了我们选的图 | 未引用 |')
L.append('| --- | --- | ---: | --- |')
PAGE = {
    'hats': 'Hats', 'equipment': 'Weapons / Rings / Footwear', 'minerals': 'Minerals',
    'fish': 'Fish', 'dishes': 'Cooking', 'artisan': 'Artisan Goods',
    'monsters': 'Monsters', 'animals': 'Animals / Coop', 'npcs': 'NPC',
    'trees': 'Trees / Fruit Trees', 'crops': 'Crops', 'buildings': "Carpenter's Shop / Buildings",
}
for cn, cat, s, it in rows:
    cc = cross.get(cat)
    if not cc:
        continue
    extra = '、'.join(cc['not_on_page'][:6]) + ('…' if len(cc['not_on_page']) > 6 else '')
    L.append(f"| {cn} | {PAGE.get(cat, '')} | {cc['ok']} / {cc['total']} | {extra or '—'} |")
tot_ok = sum(c['ok'] for c in cross.values())
tot_all = sum(c['total'] for c in cross.values())
L.append(f'\n合计 **{tot_ok} / {tot_all}** 的官方图在对应 wiki 页面里被实际引用。')
L.append('未引用的那几条都已定位原因，不是配错：')
L.append('- 8 个建筑在 /Farmhouse 与 /Wizard\'s Tower 页（不在 Carpenter\'s Shop 表里）')
L.append('- 4 个采集物（野山萝卜、香草浆、常见蘑菇、冬根）wiki 上**本来就没有植株图**，只能对物品图标')
L.append('- Qi Fruit 的阶段图在 /Qi Fruit 页；Sugar / Wheat Flour 在制糖厂页；Sea Urchin 不在 /Fish 页')
L.append('- Big Slime 与 Skeleton Mage：/Monsters 页的导航框用的是 Big Purple Slime 与 '
         'Skeleton Mage Dangerous 变体；本项目 big_slime 的 hp=60、颜色为绿，对应的正是官方 Big Green Slime\n')
L.append('这一步还真抓出过两个错：\n')
L.append('- **golden_mask** 原来配到了沙漠神器 `Golden Mask.png`（48×48），'
         '应为帽子本体 `Golden Mask (hat).png`（54×54）')
L.append('- **copper_pan** 原来配到了厨具 `Copper Pan.png`（48×48），'
         '应为帽子本体 `Copper Pan (hat).png`（54×54）')
L.append('wiki 上帽子的文件有三种命名：`X.png`、`Hat_X.png`、`X (hat).png`，第三种容易漏。\n')

L.append('## 哪些部分最接近\n')
L.append('- **装备（+6.4）、动物（+4.8）、矿物（+4.7）、帽子（+4.3）、怪物（+3.5）**：'
         '这些物件轮廓本身就很明确（剑、戒指、宝石、帽子、史莱姆），重画后天然接近原物，'
         '所以是全项目最"像"的几类 —— 但也只是"看起来是那类东西"，不是"是那一件东西"。')
L.append('- **村民头像（匹配分 78.2，绝对分最高）**：双方都是"上面头发、中间脸、下面肩膀"的构图，'
         '所以分数高；但内部雷同度 +11.4 恰恰说明这是模板而非还原。')
L.append('- **料理（+0.8）、树木（+1.5）、工件品（+1.9）、作物（+2.3）**：差距几乎为零。\n')

L.append('## 测量说明与局限\n')
L.append('- 官方树木阶段图（`Oak_Stage_5.png` 等）是把 2~3 个季节变体**并排**放在一张图里的，'
         '已按空白列拆开、与各变体分别比较后取平均（不挑最像的那个），否则会低估相似度。')
L.append('- wiki 侧图片均为无头 Chrome 实测加载（普通 HTTP 客户端会被 Cloudflare 403 拦截），'
         '按 `Special:PrefixIndex` 列出的真实文件名 + MediaWiki 的 MD5 路径规则定位。')
L.append('- 指标 = 轮廓 IoU(30%) + dHash(20%) + 调色板覆盖率(20%) + 主色接近度(15%) + '
         '长宽比(10%) + 相对面积(5%)，全部归一到 0~100。\n')

REASON = {
    'skeleton_warrior': 'wiki 上不存在这个怪物（/Skeleton_Warrior 404，File:Skeleton 前缀下也没有）',
    'shadow_guy': 'wiki 上只有 Shadowguy.png（925×537 的 Secret Notes 立绘），不是同尺寸小精灵图，已排除',
}
L.append('## wiki 上没有官方像素图、无法比对的条目\n')
for cat in summary:
    mf = ROOT / '_cmp' / 'manifest' / f'{cat}.json'
    if not mf.exists():
        continue
    d = json.loads(mf.read_text('utf-8'))
    for m in d.get('missing', []):
        r = REASON.get(m['id'], m.get('reason', ''))
        L.append(f"- **{CN.get(cat, cat)} / {m['en']}**：{r}")
L.append('- **农夫主角**：wiki 上没有官方精灵表（File:Farmer / Character / Player / Sprite / Portrait '
         '几个前缀下都只有捏人界面截图等无关文件），无法逐项比对。\n')

L.append('## 产出物\n')
L.append('- `_cmp/report/sheet-<分类>.png`：每个分类的并排对比大图'
         '（左=本项目绘制，右=官方原图，两边都按内容包围盒裁切并整数倍放大）')
L.append('- `_cmp/report/<分类>.json`：逐项指标明细')
L.append('- `_cmp/report/summary.json` / `internal.json`：汇总与内部相似度')
L.append('- `_cmp/manifest/<分类>.json`：本项目条目 ↔ 官方图文件名的映射清单')
L.append('- `_cmp/verified.json`：每个候选 wiki 文件的存在性与原始尺寸实测结果')
L.append('- `_cmp/report/crosscheck.json`：映射可靠性校验结果')
L.append('- 重跑方式：`node _cmp/run.mjs .`（需先起 `node serve.js`，并有 Chrome）')
L.append('- 映射可靠性校验需要重新抓页面：'
         '`node _cmp/dumpdom.mjs . <页面名> _cmp/out/wiki-<页面名>.html`'
         '（页面名：Hats / Weapons / Rings / Footwear / Minerals / Fish / Cooking / '
         'Artisan_Goods / Monsters / Animals / Coop / NPC / Trees / Fruit_Trees / Crops / '
         "Carpenter's Shop / Buildings），再跑 `python _cmp/crosscheck_all.py`\n")

(REP / 'REPORT.md').write_text('\n'.join(L), 'utf-8')
print('written', REP / 'REPORT.md')
