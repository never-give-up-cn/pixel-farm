"""Collect all File-namespace page names from prefix-*.html dumps into one JSON list.
Usage: python _cmp/collectfiles.py <out.json> <prefixdir>
"""
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote

out = Path(sys.argv[1])
files = {}
for p in sorted(Path(sys.argv[2]).glob('prefix-*.html')):
    h = p.read_text('utf-8', errors='ignore')
    m = re.search(r'<ul class="mw-prefixindex-list"[^>]*>(.*?)</ul>', h, re.S)
    if not m:
        continue
    for it in re.findall(r'<li>(.*?)</li>', m.group(1), re.S):
        # <a href="/wiki/File:X" title="File:X">X</a>
        a = re.search(r'title="(File:[^"]+)"', it)
        if a:
            name = unquote(a.group(1))[5:]
        else:
            name = ' '.join(unquote(re.sub(r'<[^>]+>', '', it)).split())
        files.setdefault(name, []).append(p.stem)

out.write_text(json.dumps(sorted(files.keys(), key=lambda s: s.lower()), ensure_ascii=False, indent=1), 'utf-8')
print(f'{len(files)} unique File: names -> {out}')
