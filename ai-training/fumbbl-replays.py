#!/usr/bin/env python3
"""Download a few full FUMBBL replays for matches in data/fumbbl-top-coaches.jsonl.gz, politely (one every 3 seconds).

  python3 ai-training/fumbbl-replays.py --races "Orc,Human" --per 2      # the best-rated coaches' matches with those teams
  python3 ai-training/fumbbl-replays.py --matches 4746217,4746215       # particular matches

Each replay is saved as data/fumbbl-replays/<replayId>.json.gz (FUMBBL's own gzipped JSON, unchanged), and
data/fumbbl-replays/index.json lists them: match, replay, date, both teams (race, coach, rating, score). Files already
there are skipped. Keep it to a few dozen: FUMBBL is run by volunteers (see README.md, "Getting data from FUMBBL").
"""
import argparse, gzip, json, os, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'data', 'fumbbl-top-coaches.jsonl.gz')
OUT = os.path.join(HERE, 'data', 'fumbbl-replays')
URL = 'https://fumbbl.com/api/replay/get/{}/gz'

def side(t):
    return {'race': t['roster']['name'], 'coach': t['coach']['name'], 'rating': t['coach']['rating']['pre']['r'], 'score': t['score'], 'team': t['name']}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--races', default='')
    ap.add_argument('--per', type=int, default=2)
    ap.add_argument('--matches', default='')
    a = ap.parse_args()
    matches = [json.loads(l)['match'] for l in gzip.open(DATA, 'rt')]
    pick = []
    if a.matches:
        want = {int(x) for x in a.matches.split(',')}
        pick = [m for m in matches if m['id'] in want]
    for race in [r.strip() for r in a.races.split(',') if r.strip()]:
        rs = []
        for m in matches:
            for t in (m['team1'], m['team2']):
                if t['roster']['name'] == race: rs.append((t['coach']['rating']['pre']['r'], m))
        rs.sort(key=lambda x: -x[0]); n = 0
        for _, m in rs:
            if n >= a.per: break
            if m in pick: continue
            pick.append(m); n += 1
        if n < a.per: print(f'only {n} matches with {race}', file=sys.stderr)
    os.makedirs(OUT, exist_ok=True)
    ip = os.path.join(OUT, 'index.json')
    index = json.load(open(ip)) if os.path.exists(ip) else []
    have = {e['replay'] for e in index}
    for m in pick:
        rid = m['replayId']; fn = os.path.join(OUT, f'{rid}.json.gz')
        if rid not in have:
            index.append({'match': m['id'], 'replay': rid, 'date': m['date'], 'home': side(m['team1']), 'away': side(m['team2'])}); have.add(rid)
        if os.path.exists(fn): continue
        req = urllib.request.Request(URL.format(rid), headers={'User-Agent': 'BludBowl AI research (a few replays, slowly)'})
        with urllib.request.urlopen(req, timeout=60) as r: body = r.read()
        json.loads(gzip.decompress(body))   # check it's a whole replay before keeping it
        open(fn, 'wb').write(body)
        print(f"{rid}: {m['team1']['roster']['name']} v {m['team2']['roster']['name']} ({len(body) // 1024} KB)")
        time.sleep(3)
    json.dump(sorted(index, key=lambda e: e['replay']), open(ip, 'w'), indent=1)
    print(f'{len(index)} replays listed in {ip}')

if __name__ == '__main__':
    main()
