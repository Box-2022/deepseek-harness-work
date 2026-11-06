from pathlib import Path

root = Path(__file__).resolve().parent
html = (root / 'index.html').read_text(encoding='utf-8')
css = (root / 'src' / 'style.css').read_text(encoding='utf-8')
three = (root / 'vendor' / 'three.min.js').read_text(encoding='utf-8')
orbit = (root / 'vendor' / 'OrbitControls.js').read_text(encoding='utf-8')
main = (root / 'src' / 'main.js').read_text(encoding='utf-8')

html = html.replace('<link rel="stylesheet" href="./src/style.css">', '<style>\n' + css + '\n</style>')
html = html.replace('<script src="./vendor/three.min.js"></script>', '<script>\n' + three + '\n</script>')
html = html.replace('<script src="./vendor/OrbitControls.js"></script>', '<script>\n' + orbit + '\n</script>')
html = html.replace('<script src="./src/main.js"></script>', '<script>\n' + main + '\n</script>')

out = root / 'rainy-convenience-store.html'
out.write_text(html, encoding='utf-8')
print(f'Wrote {out} ({out.stat().st_size:,} bytes)')
