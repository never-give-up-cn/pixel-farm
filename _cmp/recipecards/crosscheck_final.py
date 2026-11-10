"""Cross-check the full wiki file list against the 81 project dishes + card-like art.
Self-contained (no external inputs except _cmp/out/wiki-allfiles.json).
"""
import json
import re
from pathlib import Path

DISHES = """algae_soup|Algae Soup
artichoke_dip|Artichoke Dip
autumn_bounty|Autumn's Bounty
baked_fish|Baked Fish
banana_pudding|Banana Pudding
bean_hotpot|Bean Hotpot
blackberry_cobbler|Blackberry Cobbler
blueberry_tart|Blueberry Tart
bread|Bread
bruschetta|Bruschetta
carp_surprise|Carp Surprise
cheese_cauliflower|Cheese Cauliflower
chocolate_cake|Chocolate Cake
chowder|Chowder
coleslaw|Coleslaw
complete_breakfast|Complete Breakfast
cookies|Cookies
crab_cakes|Crab Cakes
cranberry_sauce|Cranberry Sauce
cranberry_candy|Cranberry Candy
crispy_bass|Crispy Bass
dish_o_the_sea|Dish O' The Sea
eggplant_parmesan|Eggplant Parmesan
escargot|Escargot
farmers_lunch|Farmer's Lunch
fiddlehead_risotto|Fiddlehead Risotto
fish_stew|Fish Stew
fish_taco|Fish Taco
fried_calamari|Fried Calamari
fried_eel|Fried Eel
fried_egg|Fried Egg
fried_mushroom|Fried Mushroom
fruit_salad|Fruit Salad
ginger_ale|Ginger Ale
glazed_yams|Glazed Yams
hashbrowns|Hashbrowns
ice_cream|Ice Cream
lobster_bisque|Lobster Bisque
lucky_lunch|Lucky Lunch
maki_roll|Maki Roll
mango_sticky_rice|Mango Sticky Rice
maple_bar|Maple Bar
miners_treat|Miner's Treat
moss_soup|Moss Soup
omelet|Omelet
pale_broth|Pale Broth
pancakes|Pancakes
parsnip_soup|Parsnip Soup
pepper_poppers|Pepper Poppers
pink_cake|Pink Cake
pizza|Pizza
plum_pudding|Plum Pudding
poi|Poi
poppyseed_muffin|Poppyseed Muffin
pumpkin_pie|Pumpkin Pie
pumpkin_soup|Pumpkin Soup
radish_salad|Radish Salad
red_plate|Red Plate
rhubarb_pie|Rhubarb Pie
rice_pudding|Rice Pudding
roasted_hazelnuts|Roasted Hazelnuts
roots_platter|Roots Platter
salad|Salad
salmon_dinner|Salmon Dinner
sashimi|Sashimi
seafoam_pudding|Seafoam Pudding
shrimp_cocktail|Shrimp Cocktail
spaghetti|Spaghetti
spicy_eel|Spicy Eel
squid_ink_ravioli|Squid Ink Ravioli
stir_fry|Stir Fry
strange_bun|Strange Bun
stuffing|Stuffing
super_meal|Super Meal
survival_burger|Survival Burger
tom_kha_soup|Tom Kha Soup
tortilla|Tortilla
triple_shot_espresso|Triple Shot Espresso
tropical_curry|Tropical Curry
trout_soup|Trout Soup
vegetable_stew|Vegetable Stew"""

files = json.load(open('_cmp/out/wiki-allfiles.json', encoding='utf-8'))
low = {f.lower(): f for f in files}
print('total wiki File: pages in parent list:', len(files))

rows = []
missing = []
for ln in DISHES.splitlines():
    i, n = ln.split('|', 1)
    hit = low.get((n + '.png').lower())
    rows.append((i, n, hit or '无'))
    if not hit:
        missing.append((i, n))

print('\n=== 81 dishes: exact "<Name>.png" lookup ===')
for i, n, h in rows:
    print(f'{i:24} | {n:24} | {h}')

print('\n=== dishes with NO exact-name file ===')
for m in missing:
    print('   ', m[0], '->', m[1])

# fuzzy: any file whose name matches the dish name loosely
print('\n=== fuzzy candidates for the mismatches ===')
for key in ['cookie', 'vegetable', 'stew', 'medley']:
    hits = sorted(f for f in files if key in f.lower())
    print(f'\n-- {key} ({len(hits)}):')
    for h in hits[:40]:
        print('    ', h)

print('\n=== keyword scan for card / recipe / buff / ingredient art ===')
for pat in ['recipe', 'cook', 'card', 'buff', 'queen', 'flour', 'ingredient',
            'overlay', 'unlock', 'tv', 'television']:
    hits = sorted(f for f in files if pat in f.lower())
    print(f'\n== {pat} ({len(hits)}):')
    for h in hits[:60]:
        print('    ', h)
