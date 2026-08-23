#!/bin/sh
# Re-stamp the css/js links with the current file hashes.
# Run after editing assets/css/site.css or assets/js/site.js.
cd "$(dirname "$0")"
python3 - <<'PY'
import glob, re, hashlib
css = hashlib.md5(open('assets/css/site.css','rb').read()).hexdigest()[:8]
js  = hashlib.md5(open('assets/js/site.js','rb').read()).hexdigest()[:8]
for f in ['index.html', '404.html'] + sorted(glob.glob('*/index.html')):
    s = open(f).read()
    s = re.sub(r'href="/assets/css/site\.css(\?v=[a-f0-9]+)?"', f'href="/assets/css/site.css?v={css}"', s)
    s = re.sub(r'src="/assets/js/site\.js(\?v=[a-f0-9]+)?"',   f'src="/assets/js/site.js?v={js}"', s)
    open(f,'w').write(s)
print('stamped css', css, 'js', js)
PY
