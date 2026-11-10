import json
from pathlib import Path

files = json.loads(Path('_cmp/out/wiki-allfiles.json').read_text('utf-8'))
plain = {f for f in files if not f.startswith('File:')}

CAND = {
    'health': ['HealthBar.png', 'Health.png'],
    'energy': ['EnergyBar.png', 'Energy.png'],
    'gold': ['Gold.png'],
    'luck': ['Luck.png', 'Luck Buff.png'],
    'star': ['Stardrop.png', 'Star.png'],
    'silver_quality': ['Silver Quality Icon.png', 'Silver_Quality_Icon.png', 'Silver Quality.png'],
    'gold_quality': ['Gold Quality Icon.png', 'Gold_Quality_Icon.png'],
    'iridium_quality': ['Iridium Quality Icon.png', 'Iridium_Quality_Icon.png'],
    'rain': ['Rain.png'],
    'storm': ['Thunderstorm.png'],
    'sun': ['Sunny.png', 'Sun.png'],
    'snow': ['Snow.png'],
    'wind': ['Wind.png'],
    'fog': ['Fog.png'],
    'festival': ['Festival.png'],
    'green_rain': ['GreenRain.png', 'Green Rain.png'],
    'clock': ['Clock.png'],
    'farming': ['Farming Skill Icon.png'],
    'fishing': ['Fishing Skill Icon.png'],
    'mining': ['Mining Skill Icon.png'],
    'speed': ['Speed Buff.png'],
    'luck_buff': ['Luck Buff.png'],
    'defense': ['Defense Buff.png'],
    'attack': ['Attack Buff.png'],
    'magnetism': ['Magnetism Buff.png'],
    'oil_of_garlic': ['Oil of Garlic Buff.png'],
    'life_elixir': ['Life Elixir Buff.png', 'Life Elixir.png'],
    'ginger_ale': ['Ginger Ale.png', 'Ginger Ale Buff.png'],
    'backpack': ['Backpack.png'],
    'map': ['Map Tab.png', 'Map.png'],
    'journal': ['Journal Scrap.png'],
    'quest': ['Quest.png'],
    'bundles': ['Bundle Icon.png'],
    'shop': ['Shop Icon.png'],
    'options': ['Advanced Options Button.png'],
    'settings': ['Options.png'],
    'craft': ['Crafting.png'],
    'skills': ['Skills.png'],
    'collections': ['Collections.png'],
    'exit': ['Exit.png'],
    'pause': ['Pause.png'],
    'controller': ['Controller.png'],
    'social': ['Social.png'],
    'save': ['Save.png'],
    'level': ['Level Up Icon.png', 'Level.png'],
    'friendship': ['Friendship.png', 'Friendship Icon.png'],
    'day': ['Day Icon.png'],
    'night': ['Night Icon.png'],
    'spring': ['Spring Icon.png'],
    'summer': ['Summer Icon.png'],
    'fall': ['Fall Icon.png'],
    'winter': ['Winter Icon.png'],
    'moon_phase': ['Moon Phase Icon.png'],
    'foraging': ['Foraging Skill Icon.png'],
    'combat': ['Combat Skill Icon.png'],
    'luck_skill': ['Luck Skill Icon.png'],
    'fishing_buff': ['Fishing Buff.png'],
    'mining_buff': ['Mining Buff.png'],
    'glow': ['Glow Buff.png'],
    'monster_musk': ['Monster Musk Buff.png'],
}

ok, bad = {}, []
for k, cands in CAND.items():
    hit = next((c for c in cands if c in plain), None)
    if hit:
        ok[k] = hit
    else:
        bad.append((k, cands))
out = ['{']
for k, v in ok.items():
    out.append(f"  '{k}': '{v}',")
out.append('}')
Path('_cmp/out/ui-cands.txt').write_text('\n'.join(out), encoding='utf-8')
print(f'确认存在 {len(ok)} 个')
print('不存在：', '、'.join(f'{k}({"/".join(c)})' for k, c in bad))
