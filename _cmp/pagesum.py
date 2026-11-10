"""Summarize a dumped wiki article page: heading, redirect?, images."""
import re
import sys
from pathlib import Path

for f in sys.argv[1:]:
    h = Path(f).read_text('utf-8', errors='ignore')
    title = re.search(r'<h1[^>]*id="firstHeading"[^>]*>(.*?)</h1>', h, re.S)
    compact = h.replace(' ', '')
    redir = 'wgIsRedirect":true' in compact
    imgs = sorted(set(re.findall(r'/mediawiki/images/en/(?:thumb/)?[^/]*?/([^/\'<>]+?\.(?:png|jpg))', h)))
    body = re.sub(r'<script.*?</script>', ' ', h, flags=re.S)
    body = ' '.join(re.sub(r'<[^>]+>', ' ', body).split())
    i = body.find('Jump to content')
    j = body.find('Categories')
    snippet = body[i + 14:j if j > i else i + 1200][:900]
    print('=====', f)
    print('  heading :', ' '.join(re.sub(r'<[^>]+>', '', title.group(1)).split()) if title else '?')
    print('  redirect:', redir)
    print('  images  :', imgs[:30], f'({len(imgs)} total)')
    print('  text    :', snippet[:700])
    print()
