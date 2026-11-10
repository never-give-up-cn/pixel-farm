"""Compute MediaWiki direct image URLs (MD5-based path) for a list of file names.

Usage: python _cmp/recipecards/urls.py <names-file> [names-file ...]
Prints: name | url
"""
import hashlib
import sys
from pathlib import Path
from urllib.parse import quote


def mediawiki_path(name):
    fn = name.replace(' ', '_')
    h = hashlib.md5(fn.encode('utf-8')).hexdigest()
    return f'/mediawiki/images/en/{h[0]}/{h[0:2]}/{fn}'


for f in sys.argv[1:]:
    for ln in Path(f).read_text('utf-8').splitlines():
        ln = ln.strip()
        if not ln or ln.startswith('#'):
            continue
        p = mediawiki_path(ln)
        print(f'{ln}\thttps://stardewvalleywiki.com{quote(p)}')
