"""Build deploy/ from src/. Run: python3 build.py"""
import shutil, pathlib
root = pathlib.Path(__file__).parent
src, out = root / 'src', root / 'deploy'
link = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        '<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=Public+Sans:wght@400..700&display=swap" rel="stylesheet">\n<style>')
s = (src / 'src.html').read_text(encoding='utf-8')
assert '—' not in s, 'em dash in src.html'
assert '<style>\n/*FONTS*/' in s, 'font marker missing'
(out / 'index.html').write_text(s.replace('<style>\n/*FONTS*/', link, 1), encoding='utf-8')
for f in sorted(src.glob('preview-*.html')):
    n = f.stem.split('-')[1]
    p = f.read_text(encoding='utf-8')
    assert '—' not in p, f'em dash in preview-{n}'
    (out / f'preview-{n}').mkdir(exist_ok=True)
    (out / f'preview-{n}' / 'index.html').write_text(p, encoding='utf-8')
for name, dest in (('council-feed.js', 'council-feed.js'), ('inbox.html', 'inbox/index.html')):
    t = (src / name).read_text(encoding='utf-8')
    assert '\u2014' not in t, f'em dash in {name}'
    (out / dest).parent.mkdir(exist_ok=True)
    (out / dest).write_text(t, encoding='utf-8')
print('built deploy/')
