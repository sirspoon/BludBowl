# Collect FUMBBL Competitive (BB2025) matches between highly rated coaches, with their dice/action stats.
# Resumable: appends to fumbbl-matches.jsonl (in the current folder) and remembers where it got to. One request per second,
# to go easy on FUMBBL's volunteer-run server.   usage: python3 fumbbl-collect.py [how many matches, default 300] [min coach rating, default 1550]
# Gzip the result into data/ when done (gzip -9 -c fumbbl-matches.jsonl > data/fumbbl-....jsonl.gz).
import json, os, sys, time, urllib.request
BASE = 'https://fumbbl.com'
TARGET = int(sys.argv[1]) if len(sys.argv) > 1 else 300
MIN_CR = float(sys.argv[2]) if len(sys.argv) > 2 else 1550
STATE, OUT, SEEN = "fumbbl-state.json", "fumbbl-matches.jsonl", "fumbbl-seen.jsonl"
def get(path):
    for attempt in range(4):
        try:
            time.sleep(1.0)
            with urllib.request.urlopen(urllib.request.Request(BASE + path, headers={'User-Agent': 'BludBowl-research (personal project; slow fetch)'}), timeout=60) as r:
                return json.loads(r.read().decode('utf-8'))
        except Exception as e:
            print('retry', path, e, flush=True); time.sleep(5 * (attempt + 1))
    return None
st = json.load(open(STATE)) if os.path.exists(STATE) else {'last': None, 'kept': 0, 'looked': 0}
while st['kept'] < TARGET:
    page = get('/api/match/list' + (f"/{st['last']}" if st['last'] else ''))
    if not page: print('no page'); break
    for m in page:
        if m['id'] == st['last']: continue
        st['last'] = m['id']
        if m.get('division') != 'Competitive' or m.get('conceded') != 'None': continue
        st['looked'] += 1
        v = get(f"/api/match/get/{m['id']}?verbose=1")
        if not v: continue
        crs = [((v[t].get('coach') or {}).get('rating') or {}).get('pre', {}).get('cr', 0) for t in ('team1', 'team2')]
        with open(SEEN, 'a') as f: f.write(json.dumps({'id': m['id'], 'cr': crs, 'races': [v['team1']['roster']['name'], v['team2']['roster']['name']]}) + '\n')
        if min(crs) < MIN_CR: continue
        d = get(f"/p/match?op=stats&id={m['id']}")
        if not d or not d.get('finished'): continue
        with open(OUT, 'a') as f: f.write(json.dumps({'match': v, 'stats': d}) + '\n')
        st['kept'] += 1
        print(f"kept {st['kept']}/{TARGET} (looked at {st['looked']}) match {m['id']} {v['team1']['roster']['name']} v {v['team2']['roster']['name']} cr {crs}", flush=True)
        if st['kept'] >= TARGET: break
    json.dump(st, open(STATE, 'w'))
json.dump(st, open(STATE, 'w')); print('DONE', st)
