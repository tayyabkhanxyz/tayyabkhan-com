#!/bin/sh
# Re-stamp the css/js links with the current file hashes.
# Run after editing assets/css/site.css or assets/js/site.js.
cd "$(dirname "$0")"
python3 - <<'PY'
import glob, re, hashlib
css = hashlib.md5(open('assets/css/site.css','rb').read()).hexdigest()[:8]
js  = hashlib.md5(open('assets/js/site.js','rb').read()).hexdigest()[:8]
fab = hashlib.md5(open('assets/js/fable.js','rb').read()).hexdigest()[:8]
vid = hashlib.md5(open('assets/video/profile.mp4','rb').read()).hexdigest()[:8]
pos = hashlib.md5(open('assets/video/profile-poster.jpg','rb').read()).hexdigest()[:8]
for f in ['index.html', '404.html'] + sorted(glob.glob('*/index.html')):
    s = open(f).read()
    s = re.sub(r'href="/assets/css/site\.css(\?v=[a-f0-9]+)?"', f'href="/assets/css/site.css?v={css}"', s)
    s = re.sub(r'src="/assets/js/site\.js(\?v=[a-f0-9]+)?"',   f'src="/assets/js/site.js?v={js}"', s)
    s = re.sub(r'src="/assets/js/fable\.js(\?v=[a-f0-9]+)?"',  f'src="/assets/js/fable.js?v={fab}"', s)
    # the /about square: re-encoded more than once, and a cached copy of an
    # old cut would otherwise stick around on returning visitors' machines.
    s = re.sub(r'src="/assets/video/profile\.mp4(\?v=[a-f0-9]+)?"',
               f'src="/assets/video/profile.mp4?v={vid}"', s)
    s = re.sub(r'poster="/assets/video/profile-poster\.jpg(\?v=[a-f0-9]+)?"',
               f'poster="/assets/video/profile-poster.jpg?v={pos}"', s)
    open(f,'w').write(s)
print('stamped css', css, 'js', js, 'fable', fab, 'video', vid)
PY
