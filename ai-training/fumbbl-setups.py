#!/usr/bin/env python3
"""Kick-off set-ups in the downloaded FUMBBL replays (data/fumbbl-replays): where each team stood at each kick-off.

  python3 ai-training/fumbbl-setups.py                 # a summary, kicking and receiving
  python3 ai-training/fumbbl-setups.py --show Orc      # draw every set-up of that team
  python3 ai-training/fumbbl-setups.py --json out.json # all set-ups, for other scripts

Positions are turned so the team's own end zone is on the left: x 0 (end zone) to 12 (its side of the line of
scrimmage), y 0-14 top to bottom, as on BludBowl's pitch. The wide zones are rows 0-3 and 11-14.
"""
import argparse, collections, gzip, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
REP = os.path.join(HERE, 'data', 'fumbbl-replays')

def changes(cmd): return (cmd.get('modelChangeList') or {}).get('modelChangeArray', []) or []
def reports(cmd): return (cmd.get('reportList') or {}).get('reports', []) or []

def setups(fn, meta):
    d = json.load(gzip.open(fn)); g = d['game']; out = []
    who = {}
    for side in ('teamHome', 'teamAway'):
        t = g[side]; pos = {p['positionId']: p for p in t['roster']['positionArray']}
        for p in t['playerArray']:
            ps = pos.get(p['positionId'], {})
            who[str(p['playerId'])] = {'side': side, 'pos': ps.get('positionName', p.get('playerType')), 'short': ps.get('shorthand') or '?',
                                       'ma': p['movement'], 'st': p['strength'], 'ag': p['agility'], 'av': p['armour'], 'skills': [s if isinstance(s, str) else s.get('skillName', str(s)) for s in p.get('skillArray', [])]}
    at, ball, half, kicks = {}, None, 0, 0
    for cmd in d['gameLog']['commandArray']:
        for m in changes(cmd):
            k, v = m['modelChangeId'], m.get('modelChangeValue')
            if k == 'fieldModelSetPlayerCoordinate': at[str(m['modelChangeKey'])] = v
            elif k == 'fieldModelSetBallCoordinate' and isinstance(v, list): ball = v
            elif k == 'gameSetHalf': half = v
        for r in reports(cmd):
            if r['reportId'] != 'kickoffResult': continue
            kicks += 1
            for side in ('teamHome', 'teamAway'):
                ps = [(pid, xy) for pid, xy in at.items() if pid in who and who[pid]['side'] == side and xy and 0 <= xy[0] <= 25 and 0 <= xy[1] <= 14]
                if not ps: continue
                mx = sum(xy[0] for _, xy in ps) / len(ps); flip = mx > 12.5
                race = meta['home' if side == 'teamHome' else 'away']['race']; coach = meta['home' if side == 'teamHome' else 'away']['coach']
                # the kicking team is the one whose half the ball is NOT in (it kicks into the receiving half)
                kicking = ball is not None and ((ball[0] <= 12) != (not flip))
                pl = [dict(who[pid], x=(25 - xy[0]) if flip else xy[0], y=xy[1]) for pid, xy in ps]
                out.append({'replay': meta['replay'], 'race': race, 'coach': coach, 'half': half, 'kick': kicks, 'kicking': kicking,
                            'opp': meta['away' if side == 'teamHome' else 'home']['race'], 'players': pl})
    return out

def shape(s):
    P = s['players']
    los = [p for p in P if p['x'] == 12]
    wide = lambda p: p['y'] <= 3 or p['y'] >= 11
    return {'n': len(P), 'los': len(los), 'losWide': sum(1 for p in los if wide(p)), 'wide': sum(1 for p in P if wide(p)),
            'wideTop': sum(1 for p in P if p['y'] <= 3), 'wideBot': sum(1 for p in P if p['y'] >= 11),
            'second': sum(1 for p in P if 9 <= p['x'] <= 11), 'deep': sum(1 for p in P if p['x'] <= 8), 'deepest': 12 - min(p['x'] for p in P)}

def draw(s):
    g = [['.'] * 13 for _ in range(15)]
    for p in s['players']: g[p['y']][p['x']] = (p['short'] or '?')[0]
    return '\n'.join('   ' + ''.join(r) + ' |' + ('  <- wide' if y in (3, 11) else '') for y, r in enumerate(g))

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--show', default=''); ap.add_argument('--json', default='')
    ap.add_argument('--bb', default='', help="BludBowl's set-ups from bb-setups.js, to summarise in the same way"); a = ap.parse_args()
    allS = []
    if a.bb: allS = json.load(open(a.bb)); print("BludBowl's computer:")
    else:
        index = json.load(open(os.path.join(REP, 'index.json')))
        for e in index:
            fn = os.path.join(REP, f"{e['replay']}.json.gz")
            if os.path.exists(fn): allS += setups(fn, e)
        print('FUMBBL top coaches:')
        # each kick-off has one kicking side: where the ball check didn't settle it, the side with fewer on the line kicks
        by = collections.defaultdict(list)
        for s in allS: by[(s['replay'], s['kick'])].append(s)
        for ss in by.values():
            if len(ss) == 2 and (ss[0]['kicking'] == ss[1]['kicking'] or abs(shape(ss[0])['los'] - shape(ss[1])['los']) >= 3):
                a0, a1 = shape(ss[0])['los'], shape(ss[1])['los']; ss[0]['kicking'] = a0 <= a1; ss[1]['kicking'] = not ss[0]['kicking']
    if a.json: json.dump(allS, open(a.json, 'w')); print(f'{len(allS)} set-ups written to {a.json}')
    for role in (True, False):
        rs = [s for s in allS if s['kicking'] == role]; sh = [shape(s) for s in rs]
        avg = lambda k: sum(x[k] for x in sh) / max(1, len(sh))
        print(f"{'Kicking (defence)' if role else 'Receiving (offence)'}: {len(rs)} set-ups. Mean on the line {avg('los'):.1f} (of them in a wide zone {avg('losWide'):.1f}), "
              f"in the wide zones {avg('wide'):.1f}, 1-3 squares back {avg('second'):.1f}, 4+ back {avg('deep'):.1f}, deepest {avg('deepest'):.1f} back")
        c = collections.Counter(x['los'] for x in sh); print('   players on the line: ' + ', '.join(f'{k}: {c[k]}' for k in sorted(c)))
        c = collections.Counter(x['deep'] for x in sh); print('   4+ squares back:     ' + ', '.join(f'{k}: {c[k]}' for k in sorted(c)))
    if a.show:
        for s in allS:
            if s['race'].lower() == a.show.lower():
                print(f"\n{s['race']} ({s['coach']}) v {s['opp']}, half {s['half']}, kick-off {s['kick']}: {'KICKING' if s['kicking'] else 'RECEIVING'}  {shape(s)}")
                print(draw(s))

if __name__ == '__main__':
    main()
