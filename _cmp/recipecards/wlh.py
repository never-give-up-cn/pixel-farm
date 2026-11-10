"""Extract the page list from a WhatLinksHere dump."""
import re
import sys
from pathlib import Path
from urllib.parse import unquote

for f in sys.argv[1:]:
    h = Path(f).read_text('utf-8', errors='ignore')
    print('=====', Path(f).name)
    m = re.search(r'<ul class="mw-list"[^>]*>(.*?)</ul>', h, re.S)
    body = m.group(1) if m else h
    seen = set()
    for href, title in re.findall(r'<a href="(/[^"#]+)" title="([^"]*)"', body):
        t = unquote(title)
        if t in seen or t.startswith(('Visit ', 'A list ', 'Log ', 'Create ', 'Upload ', 'Special:', 'MediaWiki', 'Show ')):
            continue
        seen.add(t)
        print('   ', t, '->', href)
