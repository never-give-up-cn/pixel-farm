import json
from pathlib import Path

d = json.load(open('_cmp/out/cook-compare.json', encoding='utf-8'))
out = ['# 配方配料对比（我们 vs wiki /Cooking）', '']
out.append('完全一致 %d，不一致 %d，wiki 没找到 %d' % (len(d['match']), len(d['diff']), len(d['missing'])))
out.append('')
out.append('## 不一致明细')
for x in d['diff']:
    out.append('- **%s**' % x['en'])
    out.append('  - 我们: ' + '、'.join('%s x%d' % (a, b) for a, b in x['ours']))
    out.append('  - wiki: ' + '、'.join('%s x%d' % (a, b) for a, b in x['wiki']))
out.append('')
out.append('## wiki 没找到的')
for x in d['missing']:
    out.append('- %s (%s)' % (x['en'], x['id']))
Path('_cmp/report/cookdiff.md').write_text('\n'.join(out), encoding='utf-8')
print('written')
