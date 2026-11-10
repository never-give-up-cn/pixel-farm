"""List all File: names from prefix dumps, filtered by regex given on argv."""
import json
import re
import sys
from pathlib import Path

files = json.load(open('_cmp/out/allfiles.json', encoding='utf-8'))
pat = sys.argv[1] if len(sys.argv) > 1 else '.'
rx = re.compile(pat, re.I)
sel = [f for f in files if rx.search(f)]
print(f'{len(sel)} of {len(files)} files match /{pat}/')
for f in sorted(sel):
    print('  ', f)
