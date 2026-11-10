"""解析 wiki 页面 -> (名称, 图片文件) 映射。

两种来源：
  1) <a href="/wiki/X" title="X"><img src="/mediawiki/images/..."></a>  （最可靠）
  2) <tr> 行里第一个非图片单元格的文字 + 该行第一张图
"""
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote


def normfile(s):
    s = str(s).strip().lower()
    s = re.sub(r'^\d+px-', '', s)
    s = re.sub(r'_paintmask$', '', s)
    s = re.sub(r'\.(png|jpg|jpeg|gif)$', '', s)
    return s.replace('_', '').replace(' ', '')


def parse(path):
    html = Path(path).read_text('utf-8', errors='ignore')
    res = {}

    # 1) 图片 + 附近带 title 的链接（链接可能在图前，也可能在图后）
    for im in re.finditer(r'<img[^>]+src="(/mediawiki/images/[^"]+)"', html):
        src = im.group(1)
        f = re.sub(r'^\d+px-', '', unquote(src.split('/')[-1]))
        if '/thumb/' in src:
            # 缩略图路径：/mediawiki/images/en/thumb/7/7b/Green_Slime.png/24px-Green_Slime.png
            m = re.search(r'/thumb/[^/]+/[^/]+/([^/]+)/\d+px-', unquote(src))
            if m:
                f = m.group(1)
        title = ''
        after = html[im.end():im.end() + 600]
        m = re.search(r'<a\b[^>]*\btitle="([^"]+)"', after)
        if m:
            title = unquote(m.group(1)).strip()
        else:
            before = html[max(0, im.start() - 600):im.start()]
            ms = list(re.finditer(r'<a\b[^>]*\btitle="([^"]+)"', before))
            if ms:
                title = unquote(ms[-1].group(1)).strip()
        if title:
            res.setdefault(title.lower(), f)

    # 2) 表格行：优先取"文件名与行名相符"的那张图（避免抓到 PaintMask / Marker 之类）
    for tr in re.findall(r'<tr\b.*?</tr>', html, re.S):
        srcs = re.findall(r'<img[^>]+src="(/mediawiki/images/[^"]+)"', tr)
        if not srcs:
            continue
        files = []
        for s in srcs:
            u = unquote(s)
            if '/thumb/' in u:
                m2 = re.search(r'/thumb/[^/]+/[^/]+/([^/]+)/\d+px-', u)
                files.append(m2.group(1) if m2 else u.split('/')[-1])
            else:
                files.append(re.sub(r'^\d+px-', '', u.split('/')[-1]))
        tds = re.findall(r'<t[dh]\b[^>]*>(.*?)</t[dh]>', tr, re.S)
        name = ''
        for td in tds:
            txt = ' '.join(unquote(re.sub(r'<[^>]+>', ' ', td)).replace('&#160;', ' ').split())
            if txt and not txt.lower().startswith('image'):
                name = txt
                break
        if not name:
            continue
        key = normfile(name)
        pick = None
        for f in files:
            if normfile(f) == key:
                pick = f
                break
        if pick is None:
            for f in files:
                if key and key in normfile(f) and 'paintmask' not in f.lower():
                    pick = f
                    break
        if pick is None:
            pick = files[0]
        res.setdefault(name.lower(), pick)
    return res


if __name__ == '__main__':
    out = {}
    for p in sys.argv[2:]:
        out.update(parse(p))
    Path(sys.argv[1]).write_text(json.dumps(out, ensure_ascii=False, indent=1), 'utf-8')
    print(f'{len(out)} 条名称->图片映射 -> {sys.argv[1]}')

