"""Print categories + short body of a dumped File: page."""
import re
import sys
from pathlib import Path
from urllib.parse import unquote

for f in sys.argv[1:]:
    h = Path(f).read_text('utf-8', errors='ignore')
    c = re.search(r'wgCategories":\[(.*?)\]', h)
    t = re.sub(r'<script.*?</script>', ' ', h, flags=re.S)
    t = re.sub(r'<style.*?</style>', ' ', t, flags=re.S)
    t = ' '.join(unquote(re.sub(r'<[^>]+>', ' ', t)).split())
    i = t.find('File history')
    j = t.find('Categories')
    body = t[i:j if j > i else i + 700]
    print('=====', Path(f).name)
    print('CATS:', c.group(1) if c else '?')
    print('BODY:', body[:700])
    print()
