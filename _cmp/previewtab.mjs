/* 给 anim-demo.html 生成一个临时副本，自动切到指定标签页，
 * 用来在无头 Chrome 里检查新标签页是否真的渲染出东西。
 *
 * 用法: node _cmp/previewtab.mjs . <tab1,tab2,...>
 * 产出: 项目根目录的 _preview-tabs.html（用完请删）
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv[2] || '.');
const tabs = (process.argv[3] || 'bundles').split(',');
const src = fs.readFileSync(path.join(ROOT, 'anim-demo.html'), 'utf8');

const inject = `
<script>
window.addEventListener('load', function () {
  setTimeout(function () {
    var tabs = ${JSON.stringify(tabs)};
    tabs.forEach(function (t) {
      var b = document.querySelector('[data-tab="' + t + '"]');
      if (b) b.click();
    });
    setTimeout(function () {
      var out = document.createElement('div');
      out.id = 'diag';
      var info = { tabs: tabs };
      tabs.forEach(function (t) {
        var panel = document.getElementById('tab-' + t);
        var canv = panel ? panel.querySelectorAll('canvas') : [];
        var painted = 0, nonEmpty = 0;
        canv.forEach(function (cv) {
          var g = cv.getContext('2d');
          if (!g) return;
          var d = g.getImageData(0, 0, cv.width, cv.height).data;
          var n = 0;
          for (var i = 0; i < d.length; i += 4) if (d[i + 3] > 0) { n++; }
          if (n > 0) nonEmpty++;
          painted += n;
        });
        info[t] = {
          panelFound: !!panel,
          display: panel ? getComputedStyle(panel).display : null,
          canvases: canv.length,
          nonEmptyCanvases: nonEmpty,
          paintedPixels: painted,
          buttons: panel ? panel.querySelectorAll('button').length : 0,
          items: panel ? panel.querySelectorAll('[data-item],[data-npc],[data-dish],[data-icon]').length : 0
        };
      });
      out.textContent = JSON.stringify(info);
      document.body.appendChild(out);
    }, 2500);
  }, 1500);
});
</script>`;

const out = src.replace(/(<script type="module" src="js\/anim-demo\.js"><\/script>)/,
  `$1\n${inject}`);
fs.writeFileSync(path.join(ROOT, '_preview-tabs.html'), out, 'utf8');
console.log('_preview-tabs.html 已生成: ' + tabs.join(', '));
