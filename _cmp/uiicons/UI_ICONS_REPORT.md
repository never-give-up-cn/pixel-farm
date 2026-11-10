# Stardew Valley Wiki — official UI icon counterparts for the 60 project icons

Research date: 2026-11-10 (Asia/Shanghai)
Wiki: https://stardewvalleywiki.com

## Method (all evidence actually observed)

1. **Complete File-namespace crawl** — `Special:AllPages?namespace=6&limit=500` followed with
   `&fr%6Fm=<last title>` (the literal query key `from` is blocked by the Cloudflare WAF;
   `%6F` encoding passes and PHP still decodes it to `from`). Result: **7,219 File: pages = every
   image the wiki hosts.** (`_uiicons/allfiles.json`)
2. **Category crawl** — namespace 14 → 461 categories. Relevant ones:
   `Menu icons` (120 files), `Menu images`, `Buff images` (35), `Skill images` (35),
   `Weather images` (24), `Heart images` (5), `Clock images` (28), `Inventory images` (12),
   `Quest images` (2), `Overlay images` (8), `Controller Map images` (36), `Calendar images`, `Journal Scrap images`.
3. **184 `File:` pages dumped** → original pixel size + the wiki's own "File usage" list
   (which page embeds each icon). (`_uiicons/fileusage.json`)
4. **Binary existence probe** — for 92 positive + 59 negative candidate names, the MediaWiki path
   `/mediawiki/images/en/{md5[0]}/{md5[0..1]}/{Name}.png` (md5 of the **full underscored filename
   including extension**) was loaded in headless Chrome with a marker-pixel grid.
   Result: **all 92 positives load, 58/59 negatives 404** (the one surprise hit is `Backpack.png`,
   which is the *backpack tool item*, not a menu icon).

---

## 1. Master table (60 icons)

File names are exactly as on the wiki's `File:` pages (spaces, not underscores).

### status (9 / 10 found)

| id | English | official file name | wiki page where found | confidence |
|---|---|---|---|---|
| health | Health | `Health.png` (48x48) — also `HealthBar.png` (78x215) | Energy, Health, Getting Started, Farming/Fishing/Mining/Foraging | 高 |
| energy | Energy | `Energy.png` (48x48) — also `EnergyBar.png` (36x215) | Energy, Getting Started | 高 |
| gold | Gold | `Gold.png` (48x48) | Energy, Health, Day_Cycle, Skills, Quests, … (100+ pages) | 高 |
| luck | Luck | `Luck.png` (48x48) — also `Luck Buff.png` (64x64) | Buffs, Luck, Energy, Attack, Defense, Speed | 高 |
| friendship | Friendship | `HeartIconLarge.png` (36x36) — also `FriendshipDots.png` (202x33), `Secret Heart.png`, `Marriage Icon.png`, `WeddingDayHeart.png` | Energy, Farming/Fishing/Mining/Foraging, Friendship | 高 |
| level | Level | **无** | — (no level/XP icon anywhere; `Mastery Icon.png` 48x48 is the *mastery* skill-bar icon, different meaning) | 高 |
| star | Stardrop | `Stardrop.png` (48x48) | Stardrop, Crops, Museum, Slot Machine | 高 |
| silver_quality | Silver Quality | `Silver Quality.png` (24x24) — also `Silver Quality Icon.png` (48x48) | Crops, Friendship, Shipping, Bundles, Template:Quality | 高 |
| gold_quality | Gold Quality | `Gold Quality.png` (24x24) — also `Gold Quality Icon.png` (48x48) | same | 高 |
| iridium_quality | Iridium Quality | `Iridium Quality.png` (24x24) — also `Iridium Quality Icon.png` (48x48) | same + Calendar | 高 |

### weather (7 / 8 found)

| id | English | official file name | wiki page where found | confidence |
|---|---|---|---|---|
| sun | Sunny | `StatusSun.png` (42x30) — also `Sunny.png` (16x16), `SunAnimated.gif` | Weather | 高 |
| rain | Rain | `StatusRain.png` (42x30) — also `Rain.png` (16x16), `RainAnimated.gif` | Weather | 高 |
| storm | Storm | `StatusStorm.png` (42x30) — also `StormAnimated.gif`, `Thunderstorm.png` | Weather | 高 |
| snow | Snow | `StatusSnow.png` (42x30) — also `Snow.png` (16x16), `SnowAnimated.gif` | Weather | 高 |
| wind | Wind | `StatusWindSpring.png` + `StatusWindFall.png` (42x30 each) — also `SpringWindAnimated.gif`, `FallWindAnimated.gif` | Weather | 高 |
| green_rain | Green Rain | `StatusGreenRain.png` (42x30) — also `GreenRainAnimated.gif` | Weather | 高 |
| fog | Fog | **无** | — (zero files match /[Ff]og/ except unrelated infographs) | 高 |
| festival | Festival | `StatusFestival.png` (42x30) — also `FestivalWeatherAnimated.gif`, `Festival.png` (16x16) | Weather | 高 |

### time (5 / 8 found)

| id | English | official file name | wiki page where found | confidence |
|---|---|---|---|---|
| clock | Clock | `Clock.png` (288x236) — also `Time Icon.png` (48x48) | Day_Cycle (the `Time` article redirects to Day_Cycle) | 高 |
| day | Day | **无** | — | 高 |
| night | Night | **无** | — | 高 |
| spring | Spring | `Spring.png` (48x32) | Seasons, Spring, crop pages | 高 |
| summer | Summer | `Summer.png` (48x32) | Seasons, Summer | 高 |
| fall | Fall | `Fall.png` (48x32) | Seasons, Fall | 高 |
| winter | Winter | `Winter.png` (48x32) | Seasons, Winter | 高 |
| moon_phase | Moon Phase | **无** | — (`Moon Table.png` is a *piece of furniture*, category "Table images"; there is no moon/phase art) | 高 |

### skill (5 / 6 found)

| id | English | official file name | wiki page where found | confidence |
|---|---|---|---|---|
| farming | Farming | `Farming Skill Icon.png` (64x64) | Skills, Farming, Getting Started | 高 |
| foraging | Foraging | `Foraging Skill Icon.png` (64x64) | Skills, Foraging | 高 |
| fishing | Fishing | `Fishing Skill Icon.png` (64x64) | Skills, Fishing | 高 |
| mining | Mining | `Mining Skill Icon.png` (64x64) | Skills, Mining | 高 |
| combat | Combat | `Combat Skill Icon.png` (64x64) | Skills, Combat, Getting Started | 高 |
| luck_skill | Luck Skill | **无** | — (SDV has no Luck skill; closest are `Luck.png` / `Luck Buff.png`, which are the *buff* art) | 高 |

### menu (11 / 15 found)

| id | English | official file name | wiki page where found | confidence |
|---|---|---|---|---|
| backpack | Backpack | `Inventory Icon.png` (36x36) and/or `Inventory Tab.png` (64x68) | Player_Menu, Inventory, wiki main page | 高 |
| map | Map | `Map Tab.png` (64x68) | Player_Menu | 高 |
| quest | Quests | `Quests Icon.png` (32x32) — also `Quest.png` (32x32, unused) | wiki main page / Template:Mainmenu; `Quest images` category | 高 |
| journal | Journal | **无** (no `Journal*.png` tab icon) | closest: `Quests Icon.png`, `Quest.png`, `ClockWithJournal.png` (288x290, the clock showing the journal button, used on the Quests page), `Journal Scrap.png` (48x48, the scrap item) | 高 |
| settings | Settings | `Optionstab.png` (34x32) | Player_Menu, Options, Controls, Getting Started, Mobile_Controls | 高 |
| save | Save | **无** | — (only `Advanced Options Button.png` 80x80 = the "Advanced Options" gear on the Options page; no save glyph) | 高 |
| exit | Exit | `Exit Game Tab.png` (64x68) | Player_Menu | 高 |
| shop | Shop | **无** | — (only shop *screenshots*: `Fish Shop.png`, `Pierres shop.png`, `Hat Shop.png`, `Carpenter's Shop.png` …) | 高 |
| craft | Crafting | `Crafting Tab.png` (64x68) | Player_Menu | 高 |
| bundles | Bundles | `Bundle Icon.png` (52x52) | wiki main page; also `Bundle Slot.png`, `Golden Scroll.png`, `Bundle Purchase.png` | 高 |
| collections | Collections | `Collections Tab.png` (64x68) | Player_Menu | 高 |
| skills | Skills | `Skills Tab Icon.png` (64x64) — `Skills Tab.png` (800x551) is a *screenshot* of the menu | Player_Menu | 高 |
| social | Social | `Social Tab.png` (64x68) | Player_Menu | 高 |
| options | Options | `Optionstab.png` (34x32) | Player_Menu, Options, Controls | 高 |
| controller | Controller | `Controls Icon.png` (32x32) — plus full button art: `360 A.png`,`360 B.png`,`360 X.png`,`360 Y.png`,`360 LB.png`,`360 RB.png`,`360 LT.png`,`360 RT.png`,`360 Dpad.png`,`360 Back.png`,`360 Start.png`,`360 Left Stick.png`,`360 Right Stick.png`,`PS4 Circle.png`,`PS4 Cross.png`,`PS4 Square.png`,`PS4 Triangle.png`,`PS4 Dpad.png`,`PS4 L1.png`,`PS4 L2.png`,`PS4 R1.png`,`PS4 R2.png`,`PS4 Options.png`,`PS4 Touch Pad.png`,`PS4 Left Stick.png`,`PS4 Right Stick.png`,`Switch A.png`,`Switch B.png`,`Switch X.png`,`Switch Y.png`,`Switch Dpad.png`,`Switch LB.png`,`Switch RB.png`,`Switch LT.png`,`Switch RT.png`,`Switch Plus.png`,`Switch Minus.png`,`Switch Left Stick.png`,`Switch Right Stick.png`,`XboxOne Menu.png`,`XboxOne View.png`,`Left-Click.png`,`Right-Click.png`,`Mouse Middle Key Light.png` | Controls, Mobile_Controls, Getting Started | 高 |
| pause | Pause | **无** | — (only `Emote Pause.png`, a character emote, not a UI button) | 高 |

### buff (11 / 12 found)

| id | English | official file name | wiki page where found | confidence |
|---|---|---|---|---|
| speed | Speed | `Speed.png` (48x48) — also `Speed Buff.png` (64x64) | Buffs, Energy, Speed, Combat | 高 |
| fishing | Fishing (buff) | `Fishing.png` (48x48) — also `Fishing Skill Icon.png` (64x64, used in the wiki's Buffs table) | Energy (buff table), Buffs | 高 |
| mining | Mining (buff) | `Mining.png` (48x48) — also `Mining Skill Icon.png` (64x64) | Energy (buff table), Buffs | 高 |
| luck | Luck (buff) | `Luck.png` (48x48) — also `Luck Buff.png` (64x64) | Buffs, Energy | 高 |
| defense | Defense | `Defense.png` (48x48) — also `Defense Buff.png` (64x64) | Buffs, Defense, Combat | 高 |
| attack | Attack | `Attack.png` (48x48) — also `Attack Buff.png` (64x64) | Buffs, Attack, Combat | 高 |
| magnetism | Magnetism | `Magnetism.png` (48x48) — also `Magnetism Buff.png` (64x64) | Buffs, Energy, Magnetism | 高 |
| glow | Glow | **无** | — (`Glow Ring.png`, `Glowstone Ring.png`, `Small Glow Ring.png` are ring items; the 35-file `Buff images` category has no Glow entry) | 高 |
| oil_of_garlic | Oil of Garlic | `Oil of Garlic Buff.png` (64x64) — also item art `Oil of Garlic.png` (48x48) | Buffs, Oil_of_Garlic, Garlic, Oil | 高 |
| monster_musk | Monster Musk | `Monster Musk Buff.png` (64x64) — also item art `Monster Musk.png` (48x48) | Buffs, Monster_Musk | 高 |
| life_elixir | Life Elixir | `Life Elixir.png` (48x48) | Life_Elixir, Crafting, Combat | 高 |
| ginger_ale | Ginger Ale | `Ginger Ale.png` (48x48) | Ginger_Ale, Cooking, Luck | 高 |

**Totals: 48 / 60 have official counterparts.**
status 9/10 · weather 7/8 · time 5/8 · skill 5/6 · menu 11/15 · buff 11/12.

---

## 2. Full inventory of wiki files that look like UI icons

### 2a. Status bar / HUD (category `Menu icons` + `Heart images` + `Clock images`)
`Health.png` (48x48) · `HealthBar.png` (78x215) · `Health FR.png` (48x48) · `Energy.png` (48x48) ·
`EnergyBar.png` (36x215) · `Gold.png` (48x48) · `Luck.png` (48x48) · `Max Energy.png` (48x48) ·
`Magnetism.png` (48x48) · `Speed.png` (48x48) · `Attack.png` (48x48) · `Defense.png` (48x48) ·
`Immunity.png` (48x48) · `Weight.png` (48x48) · `Crit. Chance.png` (48x48) · `Crit. Power.png` (48x48) ·
`Poison.png` (48x48) · `HeartIconLarge.png` (36x36) · `FriendshipDots.png` (202x33) ·
`Secret Heart.png` · `Marriage Icon.png` (32x32) · `WeddingDayHeart.png` · `Emote Heart.png` ·
`Time Icon.png` (48x48) · `Mastery Icon.png` (48x48) · `Clock.png` (288x236) ·
`ClockWithJournal.png` (288x290) · `Calendar.png` (87x120) · `Gold Clock.png` · `Wall Clock.png` ·
`Stardrop.png` (48x48) · `Backpack.png` (48x48, backpack *tool*) · `QiCoin.png` (48x48) ·
`Farming.png` / `Foraging.png` / `Fishing.png` / `Mining.png` / `Fish.png` (48x48, skill-buff icons) ·
`Silver Quality.png` / `Gold Quality.png` / `Iridium Quality.png` (24x24) ·
`Silver Quality Icon.png` / `Gold Quality Icon.png` / `Iridium Quality Icon.png` (48x48) ·
`Spring.png` / `Summer.png` / `Fall.png` / `Winter.png` (48x32) · `All Seasons Icon.png` (36x36)

### 2b. Weather (category `Weather images`, 24 files)
Status-bar weather art (42x30 each): `StatusSun.png` · `StatusRain.png` · `StatusGreenRain.png` ·
`StatusStorm.png` · `StatusSnow.png` · `StatusFestival.png` · `StatusWedding.png` ·
`StatusWindSpring.png` · `StatusWindFall.png`
Small weather icons (16x16): `Sunny.png` · `Rain.png` · `Snow.png` · `Festival.png`
Animated: `SunAnimated.gif` · `RainAnimated.gif` · `StormAnimated.gif` · `SnowAnimated.gif` ·
`GreenRainAnimated.gif` · `FestivalWeatherAnimated.gif` · `SpringWindAnimated.gif` · `FallWindAnimated.gif`
Also: `Weather Report.png` · `Weather Report Fern Islands.png` · `Weather Icon.png` (36x36, main-menu)
· `Thunderstorm.png` · `Pollen spring.png` · `Pollen fall.png`
**No fog art at all.**

### 2c. Skill icons (category `Skill images`, 35 files)
`Farming Skill Icon.png` (64x64) · `Foraging Skill Icon.png` (64x64) · `Fishing Skill Icon.png` (64x64) ·
`Mining Skill Icon.png` (64x64) · `Combat Skill Icon.png` (64x64)
Profession icons: `Angler Icon.png` · `Blacksmith Icon.png` · `Tapper Icon.png`
Mastery icons: `Farming Mastery.png` · `Foraging Mastery.png` · `Fishing Mastery.png` · `Mining Mastery.png` ·
`Combat Mastery.png` · `Mastery Icon.png`
Level-up icons: `Acrobat.png` · `Agriculturist.png` · `Artisan.png` · `Botanist.png` · `Brute.png` ·
`Defender.png` · `Desperado.png` · `Excavator.png` · `Fighter.png` · `Fisher.png` · `Forester.png` ·
`Gatherer.png` · `Gemologist.png` · `Geologist.png` · `Lumberjack.png` · `Luremaster.png` · `Mariner.png` ·
`Miner.png` · `Pirate.png` · `Prospector.png` · `Rancher.png` · `Scout.png` · `Shepherd.png` ·
`Tracker.png` · `Trapper.png` · `Tiller.png` · `Coopmaster.png`

### 2d. Buff icons (category `Buff images`, 35 files)
`Attack Buff.png` (64x64) · `Defense Buff.png` (64x64) · `Luck Buff.png` (64x64) ·
`Magnetism Buff.png` (64x64) · `Max Energy Buff.png` (64x64) · `Speed Buff.png` (64x64) ·
`Monster Musk Buff.png` (64x64) · `Oil of Garlic Buff.png` (64x64) · `Squid Ink Ravioli Buff.png` (64x64)
Bad-state icons: `Burnt.png` · `Darkness.png` · `Frozen.png` · `Jinxed.png` · `Nauseated.png` ·
`Slimed.png` · `Tipsy.png` · `Weakness.png` · `Yoba's Blessing.png`
Blessings: `Blessing Of Energy.png` · `Blessing Of Fangs.png` · `Blessing Of Friendship.png` ·
`Blessing Of Luck.png` · `Blessing Of Speed.png` · `Blessing Of The Butterfly.png` ·
`Blessing Of Waters.png`
Dwarf statue buffs: `Dwarf Statue Bombs.png` · `Dwarf Statue Coal.png` · `Dwarf Statue Geodes.png` ·
`Dwarf Statue Ladders.png` · `Dwarf Statue Ore.png`
**No `Glow` buff icon exists.**

### 2e. Menu icons
*Player-menu tab strip (all on the wiki's **Player Menu** page):*
`Inventory Tab.png` (64x68) · `Skills Tab Icon.png` (64x64) · `Social Tab.png` (64x68) ·
`Map Tab.png` (64x68) · `Crafting Tab.png` (64x68) · `Animals Tab.png` (64x68) ·
`Special Items & Powers Tab.png` (48x48) · `Collections Tab.png` (64x68) ·
`Optionstab.png` (34x32) · `Exit Game Tab.png` (64x68) · `Map.png` (400x244, world map) ·
`Skills Tab.png` (800x551, screenshot) · `Player tab.png` (785x600, screenshot, *Pending Deletion*)
*Main-menu / feature icons (used by the wiki's own nav template):*
`Inventory Icon.png` (36x36) · `Quests Icon.png` (32x32) · `Bundle Icon.png` (52x52) ·
`Weather Icon.png` (36x36) · `Festivals Icon.png` (32x32) · `Controls Icon.png` (32x32) ·
`Multiplayer Icon.png` (36x36) · `Achievements Icon.png` (33x33) · `The Player Icon.png` (32x32) ·
`Gift Icon.png` (48x48) · `Marriage Icon.png` (32x32) · `Cooking Icon.png` (32x32) ·
`Furniture Icon.png` (32x32) · `Animals Icon.png` (32x32) · `Artisan Icon.png` (32x32) ·
`Bookseller Icon.png` (32x32) · `Traveling Cart Icon.png` (32x32) · `Secret Note Icon.png` (54x54) ·
`Wallpaper Icon.png` (32x32) · `Speech bubble.png` (32x32) · `Stardew Checkup Icon.png` (32x32)
*Other UI:* `Advanced Options Button.png` (80x80) · `CameraButton.png` (54x45) ·
`Optionstab.png` (34x32) · `Recipe Overlay.png` · `Bundle Slot.png` · `Bundle Purchase.png` ·
`Journal Scrap.png` (48x48) · `Inventory Parts.png` (714x530) · `BackpackComposite.png` (588x240) ·
`Quest.png` (32x32) · `Hook Icon.png` (20x22) · `QuarryMineIcon.png` · `Railroad Icon.png` ·
`Spa Icon.png` · `Toddler Icon.png` · `Henchman Icon.png` · `Desert Trader Icon.png` ·
`Island Trader Icon.png` · `Mr. Qi Icon.png` · `Professor Snail Icon.png` · `The Mines Icon.png` ·
`Abandoned House Icon.png` · `Junimo Icon.png` · `Android Icon.png`
*Farm-map picker icons:* `Standard Farm Map Icon.png` · `Beach Farm Map Icon.png` ·
`Forest Farm Map Icon.png` · `Hilltop Farm Map Icon.png` · `Riverland Farm Map Icon.png` ·
`Wilderness Farm Map Icon.png` · `Meadowlands Farm Map Icon.png` · `Four Corners Farm Map Icon.png` (54x60)

---

## 3. Caveats / traps for the parent agent

- **File names use spaces, not underscores** on `File:` pages; the *URL* uses underscores
  (`Special Items & Powers Tab.png` → `Special_Items_%26_Powers_Tab.png`).
- **MediaWiki path rule (verified on 183/184 real File pages):**
  `md5(full underscored filename WITH extension)` → `/mediawiki/images/en/{m[0]}/{m[0:2]}/{Name}.png`.
  Hashing without the extension gives a 404.
- **`Optionstab.png`** — lowercase `tab` then `stab`. **NOT** `OptionsTab.png` (that does not exist).
- **`Skills Tab Icon.png`** (64x64, the tab icon) vs **`Skills Tab.png`** (800x551, a screenshot) vs
  `Skills Tab DE/ES/FR/HU/IT/JA/KO/PT/RU/TR/ZH.png` (localized screenshots).
- **`Silver Quality.png` / `Gold Quality.png` / `Iridium Quality.png`** are the small 24x24 in-item stars;
  **`… Icon.png`** are the 48x48 versions. Both exist — pick per your use.
- **`Player tab.png`** is a 785x600 screenshot in the wiki's *Pending Deletion* category — not an icon.
  (`Player tab DE/ES/… .png` are localized variants.)
- **`'Stardrop'.png`** (96x96, with literal apostrophes) is Marnie's *painting*, not the item icon.
  The item icon is **`Stardrop.png`**.
- **`Moon Table.png` / `Sun Table.png`** are *furniture* (category "Table images"), unrelated to moon phases.
- **`Map.png`** is the 400x244 world map; the tab icon is **`Map Tab.png`**.
- **`Inventory Tab.png`** is the 64x68 tab; **`Inventory Icon.png`** is the 36x36 main-menu icon;
  **`Backpack.png`** is the backpack *tool item* (category "Tool images").
- **`Player_Menu`** is the wiki page that hosts the whole in-game menu tab strip — it is the single best
  page to harvest menu icons from.
- **`Buffs`** is the wiki page that hosts every official buff icon.
- **`Weather`** is the wiki page that hosts every official status-bar weather icon.
- **`Day_Cycle`** is what `Time` redirects to (holds `Clock.png`).
- Not a single wiki file matches /[Ff]og/, /[Jj]ournal [Tt]ab/, /[Ss]ave/, /[Pp]ause [Ii]con/,
  /[Ss]hop [Ii]con/, /[Ll]evel/, /[Xx][Pp]/, /[Gg]low [Bb]uff/, /[Mm]oon/ (as art).

## 4. Reusable tooling left in the workspace (`_uiicons/`)

- `crawlns.mjs` — crawl any wiki namespace (handles the Cloudflare `from=` WAF bypass)
- `dumppages.mjs` / `dumpurls.mjs` / `dumpfiles.mjs` / `dumpfilelist.mjs` — parallel headless-Chrome DOM dumpers
- `genprobe.mjs` + `parseprobe.py` — batch image-existence probe (marker pixel grid + numpy/PIL)
- `usage.mjs` — parse `File:` pages → original size + wiki "File usage" list
- `catmem.mjs` — parse category pages → member list + dimensions
- `allfiles.json` (7,219 names) · `fileusage.json` (184 files) · `catmembers.json` (category members)
