"""Print the result list of a Special:PrefixIndex dump.
Usage: python _cmp/prefix.py <htmlfile>
"""
import re
import sys
from pathlib import Path
from urllib.parse import unquote

h = Path(sys.argv[1]).read_text('utf-8', errors='ignore')
m = re.search(r'<ul class="mw-prefixindex-list"[^>]*>(.*?)</ul>', h, re.S)
if not m:
    m = re.search(r'<div class="mw-prefixindex-list"[^>]*>(.*?)</div>', h, re.S)
if m:
    items = re.findall(r'<li>(.*?)</li>', m.group(1), re.S)
    names = []
    for it in items:
        t = re.sub(r'<[^>]+>', '', it)
        names.append(' '.join(unquote(t).split()))
    print(f'{len(names)} entries:')
    for n in names:
        print('  ', n)
else:
    print('NO LIST FOUND')
    # fallback: find links to /wiki/File:
    links = sorted(set(unquote(x) for x in re.findall(r'href="/wiki/(File:[^"#]+)"', h)))
    print(f'{len(links)} File: links:')
    for l in links:
        print('  ', l)
