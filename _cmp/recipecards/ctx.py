"""Show the HTML context around an image reference in a dumped page."""
import re
import sys
from pathlib import Path

f = sys.argv[1]
needle = sys.argv[2]
h = Path(f).read_text('utf-8', errors='ignore')
for m in re.finditer(re.escape(needle), h):
    seg = h[max(0, m.start() - 700):m.end() + 700]
    print('-----')
    print(seg)
