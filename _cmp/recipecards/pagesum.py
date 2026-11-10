"""Summarize a dumped wiki page: heading, images, text snippet."""
import re
import sys
from pathlib import Path
from urllib.parse import unquote

for f in sys.argv[1:]:
    h = Path(f).read_text('utf-8', errors='ignore')
    title = re.search(r'<h1[^>]*id="firstHeading"[^>]*>(.*?)</h1>', h, re.S)
    compact = h.replace(' ', '')
    imgs = sorted(set(unquote(x) for x in re.findall(
        r'/mediawiki/images/en/(?:thumb/)?[^/]*?/([^/\'<>]+?\.(?:png|jpg|jpeg|gif))', h)))
    body = re.sub(r'<script.*?</script>', ' ', h, flags=re.S)
    body = ' '.join(re.sub(r'<[^>]+>', ' ', body).split())
    i = body.find('Beginning')
    snippet = body[i:i + 1400] if i >= 0 else body[:1200]
    print('=====', f)
    print('  heading :', ' '.join(re.sub(r'<[^>]+>', '', title.group(1)).split()) if title else '?')
    print('  redirect:', 'wgIsRedirect":true' in compact)
    print('  images  :', len(imgs), imgs[:12])
    print('  text    :', snippet[:1100])
    print()
