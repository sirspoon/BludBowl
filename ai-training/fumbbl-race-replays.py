#!/usr/bin/env python3
"""Find more FUMBBL Competitive (2025 rules) matches for particular teams and download their replays, politely.
The top-coaches list has few matches for rare teams (9 Goblin, 5 Snotling), so this pages back through FUMBBL's match
list (newest first, one request a second) for matches where one side is one of the races and its coach is rated
--mincr or more, and saves the replays alongside the others (data/fumbbl-replays/, listed in index.json).

  python3 ai-training/fumbbl-race-replays.py --races "Goblin,Snotling" --want 30 --mincr 1500 --pages 200
"""
import argparse, gzip, json, os, time, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'data', 'fumbbl-replays'); BASE = 'https://fumbbl.com'
UA = {'User-Agent': 'BludBowl AI research (a few replays, slowly)'}
def get(path, raw=False):
    for attempt in range(4):
        try:
            time.sleep(1.0)
            with urllib.request.urlopen(urllib.request.Request(BASE + path, headers=UA), timeout=60) as r:
                b = r.read(); return b if raw else json.loads(b.decode('utf-8'))
        except Exception as e:
            print('retry', path, e, flush=True); time.sleep(5 * (attempt + 1))
    return None
def side(t): return {'race': t['roster']['name'], 'coach': t['coach']['name'], 'rating': ((t['coach'].get('rating') or {}).get('pre') or {}).get('r'), 'score': t['score'], 'team': t['name']}
ap = argparse.ArgumentParser(); ap.add_argument('--races', default='Goblin,Snotling'); ap.add_argument('--want', type=int, default=30)
ap.add_argument('--mincr', type=float, default=1500); ap.add_argument('--pages', type=int, default=200); a = ap.parse_args()
races = {r.strip() for r in a.races.split(',')}; ip = os.path.join(OUT, 'index.json'); index = json.load(open(ip))
have = {e['match'] for e in index}; got, last = 0, None
for pg in range(a.pages):
    page = get('/api/match/list' + (f'/{last}' if last else ''))
    if not page: break
    for m in page:
        last = m['id']
        if got >= a.want: break
        if m.get('division') != 'Competitive' or m.get('conceded') != 'None' or m['id'] in have or not m.get('replayId'): continue
        if not ({m['team1']['roster']['name'], m['team2']['roster']['name']} & races): continue
        v = get(f"/api/match/get/{m['id']}?verbose=1")
        if not v: continue
        crs = [(((v[t].get('coach') or {}).get('rating') or {}).get('pre') or {}).get('cr', 0) for t in ('team1', 'team2') if v[t]['roster']['name'] in races]
        if max(crs) < a.mincr: continue
        body = get(f"/api/replay/get/{m['replayId']}/gz", raw=True)
        try: json.loads(gzip.decompress(body))
        except Exception: continue
        open(os.path.join(OUT, f"{m['replayId']}.json.gz"), 'wb').write(body)
        index.append({'match': m['id'], 'replay': m['replayId'], 'date': m['date'], 'home': side(v['team1']), 'away': side(v['team2'])}); have.add(m['id']); got += 1
        json.dump(sorted(index, key=lambda e: e['replay']), open(ip, 'w'), indent=1)
        print(f"{got}/{a.want} page {pg}: {m['replayId']} {v['team1']['roster']['name']} v {v['team2']['roster']['name']} cr {crs}", flush=True)
        time.sleep(2)
    if got >= a.want: break
print(f'{got} new replays; {len(index)} listed')
