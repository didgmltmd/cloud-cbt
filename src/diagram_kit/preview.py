import sys, json, pathlib, subprocess, html, os
H = pathlib.Path(__file__).resolve().parent
args = [a for a in sys.argv[1:] if not a.startswith('--')]
ids = None
for a in sys.argv[1:]:
    if a.startswith('--ids='): ids = set(a[6:].split(','))
src, out = pathlib.Path(args[0]), pathlib.Path(args[1])
data = json.loads(src.read_text(encoding='utf-8'))
css = (H / 'kit.css').read_text(encoding='utf-8')
parts = []
for d in data:
    if ids and d['id'] not in ids: continue
    for f in d.get('figs', []):
        parts.append(f'<section><h3>{html.escape(d["id"])}</h3><figure class="dg">{f["svg"]}<figcaption>{html.escape(f.get("caption", ""))}</figcaption></figure></section>')
page = ('<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;800&display=swap">'
        '<style>body{margin:0;padding:20px;background:#fff;font-family:"Noto Sans KR",sans-serif;width:800px}h3{font:700 13px monospace;color:#888;margin:14px 0 4px}' + css + '</style>' + ''.join(parts))
tmp = H / ('_preview_' + str(os.getpid()) + '.html'); tmp.write_text(page, encoding='utf-8')
h = 200 + 470 * len(parts)
subprocess.run([r'C:\Program Files\Google\Chrome\Application\chrome.exe', '--headless=new', '--disable-gpu', '--hide-scrollbars',
                '--user-data-dir=' + str(H / ('_prof_' + str(os.getpid()))), f'--window-size=840,{min(h, 16000)}',
                '--virtual-time-budget=4000', '--screenshot=' + str(out.resolve()), tmp.as_uri()], capture_output=True, timeout=120)
tmp.unlink()
print('wrote', out, len(parts), 'figures')
