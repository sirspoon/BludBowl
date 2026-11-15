import json, urllib.request, time, sys
last = None; rows = []; pages = 0
while pages < 480:
    url = 'https://fumbbl.com/api/match/list' + (f'/{last}' if last else '')
    try:
        with urllib.request.urlopen(url, timeout=40) as r: lst = json.loads(r.read())
    except Exception as e:
        time.sleep(3); continue
    if not lst: break
    last = lst[-1]['id']; pages += 1
    for m in lst:
        rows.append({'id': m['id'], 'date': m['date'], 'div': m.get('division'), 'conceded': m.get('conceded'),
                     'r1': m['team1']['roster']['name'], 's1': m['team1']['score'], 'tv1': m['team1'].get('teamValue'),
                     'r2': m['team2']['roster']['name'], 's2': m['team2']['score'], 'tv2': m['team2'].get('teamValue')})
    if pages % 40 == 0:
        json.dump(rows, open('matches.json', 'w')); print(pages, len(rows), rows[-1]['date'], file=sys.stderr, flush=True)
    time.sleep(0.35)
json.dump(rows, open('matches.json', 'w')); print('done', pages, len(rows), rows[-1]['date'], file=sys.stderr)
