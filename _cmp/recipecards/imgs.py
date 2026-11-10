"""List all image file names on a dumped wiki page, with the anchor text/link target."""
import re
import sys
from pathlib import Path
from urllib.parse import unquote

for f in sys.argv[1:]:
    h = Path(f).read_text('utf-8', errors='ignore')
    print('=====', Path(f).name)
    found = {}
    for m in re.finditer(r'<img[^>]+src="(/mediawiki/images/[^"]+)"', h):
        src = unquote(m.group(1))
        t = re.search(r'/thumb/[^/]+/[^/]+/([^/]+)/\d+px-', src)
        name = t.group(1) if t else re.sub(r'^\d+px-', '', src.rsplit('/', 1)[-1])
        found.setdefault(name, 0)
        found[name] += 1
    for n in sorted(found):
        print(f'   {n}  x{found[n]}')
    print(f'   TOTAL {len(found)}')
