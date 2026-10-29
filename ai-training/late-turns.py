#!/usr/bin/env python3
"""The last two turns of a half with the ball: at the start of the side's 7th or 8th turn with its carrier standing on
the pitch, how far the carrier is from the end zone against its Move, and how the turn ends: a touchdown, a turnover
(the try failed), or short (the carrier still holding the ball, not in). And how they score: the carrier running
in, after a hand-off or pass, or a thrown team-mate.

  python3 ai-training/late-turns.py                   (the FUMBBL replays)
  python3 ai-training/late-turns.py --bb bb.json      (from bb-lateturns.js: the BludBowl computer)
"""
import argparse, collections, gzip, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
REP = os.path.join(HERE, 'data', 'fumbbl-replays')
def changes(c): return (c.get('modelChangeList') or {}).get('modelChangeArray', []) or []
def reports(c): return (c.get('reportList') or {}).get('reports', []) or []

def turns(fn, meta):
    d = json.load(gzip.open(fn)); g = d['game']
    team, ma = {}, {}
    for side in ('teamHome', 'teamAway'):
        for p in g[side]['playerArray']: team[str(p['playerId'])] = side; ma[str(p['playerId'])] = p['movement']
    at, st, ball, homeLeft, turn = {}, {}, None, True, {'home': 0, 'away': 0}; out = []; T = None; last = None
    up = lambda q: (st.get(q, 1) & 0xFF) in (1, 2)
    onp = lambda q: at.get(q) and 0 <= at[q][0] <= 25 and 0 <= at[q][1] <= 14
    def carrier():
        if not ball: return None
        for q in at:
            if q in team and onp(q) and up(q) and at[q] == ball: return q
    for cmd in d['gameLog']['commandArray']:
        for m in changes(cmd):
            k, v = m['modelChangeId'], m.get('modelChangeValue')
            if k == 'fieldModelSetPlayerCoordinate': at[str(m['modelChangeKey'])] = v
            elif k == 'fieldModelSetPlayerState' and isinstance(v, int): st[str(m['modelChangeKey'])] = v
            elif k == 'fieldModelSetBallCoordinate': ball = v if isinstance(v, list) else None
            elif k == 'turnDataSetTurnNr': turn[m['modelChangeKey']] = v
        for r in reports(cmd):
            rid = r['reportId']
            if rid == 'kickoffResult':
                hx = [at[q][0] for q in at if q in team and team[q] == 'teamHome' and onp(q)]
                if hx: homeLeft = sum(hx) / len(hx) < 12.5
                T = None; continue
            if rid == 'playerAction' and str(r.get('actingPlayerId')) in team:
                pid = str(r['actingPlayerId']); side = team[pid]
                if T is None:
                    tn = turn['home' if side == 'teamHome' else 'away']
                    c = carrier()
                    if tn in (7, 8) and c and team[c] == side:
                        right = homeLeft if side == 'teamHome' else not homeLeft
                        toGo = (25 - at[c][0]) if right else at[c][0]
                        T = {'side': side, 'race': meta['home' if side == 'teamHome' else 'away']['race'], 'turn': tn, 'toGo': toGo, 'ma': ma[c], 'c0': c, 'acts': set(), 'last': None}
                    else: T = {'skip': True, 'side': side}
                if not T.get('skip'): T['acts'].add(r.get('playerAction'))
                continue
            if T is None or T.get('skip'):
                if rid == 'turnEnd': T = None
                continue
            if 'successful' in r and team.get(str(r.get('playerId'))) == T['side']: T['last'] = r.get('successful')
            elif rid == 'blockChoice': T['last'] = r.get('blockResult') not in ('SKULL', 'BOTH DOWN')
            elif rid == 'turnEnd':
                td = r.get('playerIdTouchdown')
                c = carrier()
                T['out'] = 'td' if td else 'turnover' if T['last'] is False else 'short' if c and team[c] == T['side'] else 'lost'
                if td: T['how'] = 'thrown team-mate' if 'throwTeamMate' in T['acts'] else 'pass' if 'passMove' in T['acts'] or 'pass' in T['acts'] else 'hand-off' if 'handOverMove' in T['acts'] else 'ran in'
                T.pop('acts'); out.append(T); T = None
    return out

def summary(lab, R):
    pct = lambda a, b: f'{100 * a / b:.0f}%' if b else '-'
    print(f'\n{lab}')
    for tn in (8, 7):
        rs = [r for r in R if r['turn'] == tn and 'out' in r]
        print(f'  turn {tn}: {len(rs)} turns starting with our carrier on its feet')
        for lab2, f in (('can walk in (to go <= MA)', lambda r: r['toGo'] <= r['ma']), ('needs a Rush or two (MA+1, +2)', lambda r: r['ma'] < r['toGo'] <= r['ma'] + 2),
                        ('3-6 beyond its Move', lambda r: r['ma'] + 2 < r['toGo'] <= r['ma'] + 8), ('further', lambda r: r['toGo'] > r['ma'] + 8)):
            g = [r for r in rs if f(r)]
            if not g: continue
            c = collections.Counter(r['out'] for r in g); h = collections.Counter(r.get('how') for r in g if r['out'] == 'td')
            print(f"    {lab2:32} {len(g):4}: touchdown {pct(c['td'], len(g))}, tried and failed {pct(c['turnover'], len(g))}, short {pct(c['short'], len(g))}, lost it {pct(c['lost'], len(g))}"
                  + (f"   (scored by: {', '.join(f'{k} {v}' for k, v in h.most_common())})" if h else ''))

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--bb', action='append', default=[]); a = ap.parse_args()
    for f in a.bb: summary(f'BludBowl computer ({os.path.basename(f)})', json.load(open(f)))
    if a.bb: return
    index = json.load(open(os.path.join(REP, 'index.json'))); R = []
    for e in index:
        fn = os.path.join(REP, f"{e['replay']}.json.gz")
        if os.path.exists(fn): R += turns(fn, e)
    summary('FUMBBL top coaches', R)

if __name__ == '__main__':
    main()
