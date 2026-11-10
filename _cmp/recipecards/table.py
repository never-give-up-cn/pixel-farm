"""Generate the final dish table (verified data) as plain text."""
from pathlib import Path

# project id | project English name | OFFICIAL wiki file name | Queen-of-Sauce recipe?
ROWS = [
    ("algae_soup", "Algae Soup", "Algae Soup.png", False),
    ("artichoke_dip", "Artichoke Dip", "Artichoke Dip.png", True),
    ("autumn_bounty", "Autumn's Bounty", "Autumn's Bounty.png", False),
    ("baked_fish", "Baked Fish", "Baked Fish.png", True),
    ("banana_pudding", "Banana Pudding", "Banana Pudding.png", False),
    ("bean_hotpot", "Bean Hotpot", "Bean Hotpot.png", False),
    ("blackberry_cobbler", "Blackberry Cobbler", "Blackberry Cobbler.png", False),
    ("blueberry_tart", "Blueberry Tart", "Blueberry Tart.png", False),
    ("bread", "Bread", "Bread.png", True),
    ("bruschetta", "Bruschetta", "Bruschetta.png", True),
    ("carp_surprise", "Carp Surprise", "Carp Surprise.png", True),
    ("cheese_cauliflower", "Cheese Cauliflower", "Cheese Cauliflower.png", False),
    ("chocolate_cake", "Chocolate Cake", "Chocolate Cake.png", True),
    ("chowder", "Chowder", "Chowder.png", False),
    ("coleslaw", "Coleslaw", "Coleslaw.png", True),
    ("complete_breakfast", "Complete Breakfast", "Complete Breakfast.png", True),
    ("cookies", "Cookies", "Cookie.png  <-- MISMATCH (official = \"Cookie\")", True),
    ("crab_cakes", "Crab Cakes", "Crab Cakes.png", True),
    ("cranberry_sauce", "Cranberry Sauce", "Cranberry Sauce.png", False),
    ("cranberry_candy", "Cranberry Candy", "Cranberry Candy.png", True),
    ("crispy_bass", "Crispy Bass", "Crispy Bass.png", False),
    ("dish_o_the_sea", "Dish O' The Sea", "Dish O' The Sea.png", False),
    ("eggplant_parmesan", "Eggplant Parmesan", "Eggplant Parmesan.png", False),
    ("escargot", "Escargot", "Escargot.png", False),
    ("farmers_lunch", "Farmer's Lunch", "Farmer's Lunch.png", False),
    ("fiddlehead_risotto", "Fiddlehead Risotto", "Fiddlehead Risotto.png", True),
    ("fish_stew", "Fish Stew", "Fish Stew.png", False),
    ("fish_taco", "Fish Taco", "Fish Taco.png", False),
    ("fried_calamari", "Fried Calamari", "Fried Calamari.png", False),
    ("fried_eel", "Fried Eel", "Fried Eel.png", False),
    ("fried_egg", "Fried Egg", "Fried Egg.png", False),
    ("fried_mushroom", "Fried Mushroom", "Fried Mushroom.png", False),
    ("fruit_salad", "Fruit Salad", "Fruit Salad.png", True),
    ("ginger_ale", "Ginger Ale", "Ginger Ale.png", False),
    ("glazed_yams", "Glazed Yams", "Glazed Yams.png", True),
    ("hashbrowns", "Hashbrowns", "Hashbrowns.png", True),
    ("ice_cream", "Ice Cream", "Ice Cream.png", False),
    ("lobster_bisque", "Lobster Bisque", "Lobster Bisque.png", True),
    ("lucky_lunch", "Lucky Lunch", "Lucky Lunch.png", True),
    ("maki_roll", "Maki Roll", "Maki Roll.png", True),
    ("mango_sticky_rice", "Mango Sticky Rice", "Mango Sticky Rice.png", False),
    ("maple_bar", "Maple Bar", "Maple Bar.png", True),
    ("miners_treat", "Miner's Treat", "Miner's Treat.png", False),
    ("moss_soup", "Moss Soup", "Moss Soup.png", False),
    ("omelet", "Omelet", "Omelet.png", True),
    ("pale_broth", "Pale Broth", "Pale Broth.png", False),
    ("pancakes", "Pancakes", "Pancakes.png", True),
    ("parsnip_soup", "Parsnip Soup", "Parsnip Soup.png", False),
    ("pepper_poppers", "Pepper Poppers", "Pepper Poppers.png", False),
    ("pink_cake", "Pink Cake", "Pink Cake.png", True),
    ("pizza", "Pizza", "Pizza.png", True),
    ("plum_pudding", "Plum Pudding", "Plum Pudding.png", True),
    ("poi", "Poi", "Poi.png", False),
    ("poppyseed_muffin", "Poppyseed Muffin", "Poppyseed Muffin.png", True),
    ("pumpkin_pie", "Pumpkin Pie", "Pumpkin Pie.png", True),
    ("pumpkin_soup", "Pumpkin Soup", "Pumpkin Soup.png", False),
    ("radish_salad", "Radish Salad", "Radish Salad.png", True),
    ("red_plate", "Red Plate", "Red Plate.png", False),
    ("rhubarb_pie", "Rhubarb Pie", "Rhubarb Pie.png", False),
    ("rice_pudding", "Rice Pudding", "Rice Pudding.png", False),
    ("roasted_hazelnuts", "Roasted Hazelnuts", "Roasted Hazelnuts.png", True),
    ("roots_platter", "Roots Platter", "Roots Platter.png", False),
    ("salad", "Salad", "Salad.png", False),
    ("salmon_dinner", "Salmon Dinner", "Salmon Dinner.png", False),
    ("sashimi", "Sashimi", "Sashimi.png", False),
    ("seafoam_pudding", "Seafoam Pudding", "Seafoam Pudding.png", False),
    ("shrimp_cocktail", "Shrimp Cocktail", "Shrimp Cocktail.png", True),
    ("spaghetti", "Spaghetti", "Spaghetti.png", False),
    ("spicy_eel", "Spicy Eel", "Spicy Eel.png", False),
    ("squid_ink_ravioli", "Squid Ink Ravioli", "Squid Ink Ravioli.png", False),
    ("stir_fry", "Stir Fry", "Stir Fry.png", True),
    ("strange_bun", "Strange Bun", "Strange Bun.png", False),
    ("stuffing", "Stuffing", "Stuffing.png", False),
    ("super_meal", "Super Meal", "Super Meal.png", False),
    ("survival_burger", "Survival Burger", "Survival Burger.png", False),
    ("tom_kha_soup", "Tom Kha Soup", "Tom Kha Soup.png", False),
    ("tortilla", "Tortilla", "Tortilla.png", True),
    ("triple_shot_espresso", "Triple Shot Espresso", "Triple Shot Espresso.png", False),
    ("tropical_curry", "Tropical Curry", "Tropical Curry.png", False),
    ("trout_soup", "Trout Soup", "Trout Soup.png", True),
    ("vegetable_stew", "Vegetable Stew", "Vegetable Medley.png  <-- MISMATCH (no official \"Vegetable Stew\")", False),
]

out = []
out.append('| dish id | English name | official dish icon file (wiki File: name) | where found |')
out.append('|---|---|---|---|')
for i, n, f, qos in ROWS:
    fname = f.split('  <--')[0]
    article = {'Cookies': 'Cookie', 'Vegetable Stew': 'Vegetable_Medley'}.get(n, n.replace(' ', '_'))
    where = 'Cooking (recipe table), File:%s, article /%s' % (fname, article)
    if qos:
        where += ', + Queen of Sauce'
    out.append('| %s | %s | %s | %s |' % (i, n, f, where))
out.append('')
out.append('rows: %d' % len(ROWS))
Path('_cmp/recipecards/table.md').write_text('\n'.join(out), 'utf-8')
print('\n'.join(out[:8]))
print('...')
print('rows:', len(ROWS))
