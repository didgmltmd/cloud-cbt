import pathlib, json
H = pathlib.Path(__file__).resolve().parent; S = H.parent
qs = []
for f in ['qs_m2_m3.json', 'qs_m4_m5.json', 'qs_m6_m7.json']: qs += json.loads((S / 'cloud' / f).read_text(encoding='utf-8'))
qs.sort(key=lambda q: (q['module'], q['id']))
BS = chr(92)
cons = []
for f in ['concepts_m2_m4.json', 'concepts_m5_m7.json']:
    fp = S / 'cloud' / f
    if fp.exists(): cons += json.loads(fp.read_text(encoding='utf-8'))
cons.sort(key=lambda c: c['module'])
dgm = {}
for f in ['diagrams_m2_m3.json', 'diagrams_m4_m5.json', 'diagrams_m6_m7.json']:
    fp = S / 'cloud' / f
    if fp.exists():
        for d in json.loads(fp.read_text(encoding='utf-8')): dgm[d['id']] = d.get('figs', [])
import sys; sys.path.insert(0, str(H)); import iconize
sprite, modicons, istats, nicons = iconize.process(dgm)
data = 'window.CLOUD_QS = ' + json.dumps(qs, ensure_ascii=False).replace('</', '<' + BS + '/') + ';' + chr(10) + 'window.CLOUD_CONCEPTS = ' + json.dumps(cons, ensure_ascii=False).replace('</', '<' + BS + '/') + ';' + chr(10) + 'window.CLOUD_DIAGRAMS = ' + json.dumps(dgm, ensure_ascii=False).replace('</', '<' + BS + '/') + ';' + chr(10) + 'window.CLOUD_MODICON = ' + json.dumps(modicons) + ';'
js = (H / 'app.js').read_text(encoding='utf-8').replace('</script', '<' + BS + '/script')
page = (H / 'page.html').read_text(encoding='utf-8').replace('/*KIT*/', (S / 'cloud' / 'diagram_kit' / 'kit.css').read_text(encoding='utf-8')).replace('<!--SPRITE-->', sprite).replace('/*DATA*/', data).replace('/*SCRIPT*/', js)
(H / 'cloud_cbt.html').write_text(page, encoding='utf-8')
head, rest = page.split('<style>', 1); css, body = rest.split('</style>', 1)
full = '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n' + head + '<style>' + css + '</style>\n</head>\n<body>' + body + '</body>\n</html>\n'
(H / 'index.html').write_text(full, encoding='utf-8')
print('built', len(page), 'questions', len(qs), 'concept modules', len(cons), 'diagram sections', len(dgm), 'figs', sum(len(v) for v in dgm.values()), 'icons', nicons, istats)
