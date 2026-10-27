"""Build the offline, file:// compatible edition using only Python's standard library."""
from pathlib import Path
import re
root = Path(__file__).resolve().parent.parent
css = (root / 'style.css').read_text()
css = re.sub(r'@import\s+url\([^)]*\)\s*;\s*', '', css)
css = css.replace("'Noto Sans JP',sans-serif", "'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',sans-serif")
css = css.replace("'Noto Serif JP',serif", "'Noto Serif JP','Hiragino Mincho ProN','Yu Mincho',serif")
game = re.sub(r'^export ', '', (root / 'src/game.js').read_text(), flags=re.MULTILINE)
app = re.sub(r'^import .*?;\s*', '', (root / 'src/app.js').read_text(), count=1)
html = (root / 'index.html').read_text().replace('href="./"', 'href="#"')
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>')
html = html.replace('<script type="module" src="src/app.js"></script>', '<script>\n(() => {\n' + game + '\n' + app + '\n})();\n</script>')
out = root / 'downloads/rokuyo-duel.html'
out.parent.mkdir(exist_ok=True)
out.write_text(html)
site = root / 'docs/index.html'
site.parent.mkdir(exist_ok=True)
site.write_text(html)
(site.parent / '.nojekyll').touch()
print(out)
print(site)
