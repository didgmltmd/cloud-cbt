import pathlib, json
H = pathlib.Path(__file__).resolve().parent; S = H.parent
qs = []
for f in ['qs_m2_m3.json', 'qs_m4_m5.json', 'qs_m6_m7.json']: qs += json.loads((S / 'cloud' / f).read_text(encoding='utf-8'))
qs.sort(key=lambda q: (q['module'], q['id']))
BS = chr(92)
data = 'window.CLOUD_QS = ' + json.dumps(qs, ensure_ascii=False).replace('</', '<' + BS + '/') + ';'
js = (H / 'app.js').read_text(encoding='utf-8').replace('</script', '<' + BS + '/script')
page = (H / 'page.html').read_text(encoding='utf-8').replace('/*DATA*/', data).replace('/*SCRIPT*/', js)
(H / 'cloud_cbt.html').write_text(page, encoding='utf-8')
head, rest = page.split('<style>', 1); css, body = rest.split('</style>', 1)
full = '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n' + head + '<style>' + css + '</style>\n</head>\n<body>' + body + '</body>\n</html>\n'
(H / 'index.html').write_text(full, encoding='utf-8')
print('built', len(page), 'questions', len(qs))
