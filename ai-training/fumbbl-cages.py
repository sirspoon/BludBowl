#!/usr/bin/env python3
"""Cages in the downloaded FUMBBL replays: at the end of each turn where the moving team's ball carrier is standing on
the pitch, how its team-mates stand round it (next to it; in the four diagonal corners, the classic cage; within 2),
how far up the pitch and from the sideline, how many turns they've held the ball, how many opponents are next to the
carrier, and whether the other side has the ball (or has scored) by the end of their next turn.

  python3 ai-training/fumbbl-cages.py [--json out.json]
  python3 ai-training/fumbbl-cages.py --bb bb.json        (from bb-cages.js: the BludBowl computer, the same way)
"""
import argparse, collections, gzip, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
REP = os.path.join(HERE, 'data', 'fumbbl-replays')
def changes(c): return (c.get('modelChangeList') or {}).get('modelChangeArray', []) or []
def reports(c): return (c.get('reportList') or {}).get('reports', []) or []

def shape(car, mates, opps, toGo, reachOpps=None):
    cx, cy = car
    d = lambda p: max(abs(p[0] - cx), abs(p[1] - cy))
    adj = [p for p in mates if d(p) == 1]
    corners = sum(1 for p in adj if abs(p[0] - cx) == 1 and abs(p[1] - cy) == 1)
    return {'adj': len(adj), 'corners': corners, 'orth': len(adj) - corners, 'within2': sum(1 for p in mates if d(p) <= 2), 'within3': sum(1 for p in mates if d(p) <= 3),
            'oppAdj': sum(1 for p in opps if d(p) == 1), 'opp3': sum(1 for p in opps if d(p) <= 3), 'toGo': toGo, 'edge': min(cy, 14 - cy),
            'nearest': min([d(p) for p in opps] or [99]), 'reach': sum(1 for p, ma in (reachOpps or []) if d(p) - 1 <= ma + 2)}

def cages(fn, meta):
    d = json.load(gzip.open(fn)); g = d['game']
    team, ma = {}, {}
    for side in ('teamHome', 'teamAway'):
        for p in g[side]['playerArray']: team[str(p['playerId'])] = side; ma[str(p['playerId'])] = p['movement']
    st, at, ball, homePlaying, homeLeft, turn = {}, {}, None, None, True, {'home': 0, 'away': 0}
    score = {'home': 0, 'away': 0}; out = []; pend = None; held = {'teamHome': 0, 'teamAway': 0}; actSide = None; order = []
    up = lambda q: (st.get(q, 1) & 0xFF) in (1, 2)
    onp = lambda q: at.get(q) and 0 <= at[q][0] <= 25 and 0 <= at[q][1] <= 14
    for cmd in d['gameLog']['commandArray']:
        for m in changes(cmd):
            k, v = m['modelChangeId'], m.get('modelChangeValue')
            if k == 'fieldModelSetPlayerCoordinate': at[str(m['modelChangeKey'])] = v
            elif k == 'fieldModelSetPlayerState' and isinstance(v, int): st[str(m['modelChangeKey'])] = v
            elif k == 'fieldModelSetBallCoordinate': ball = v if isinstance(v, list) else None
            elif k == 'gameSetHomePlaying': homePlaying = v
            elif k == 'turnDataSetTurnNr': turn[m['modelChangeKey']] = v
            elif k == 'teamResultSetScore': score[m['modelChangeKey']] = v
        for r in reports(cmd):
            if r['reportId'] == 'playerAction' and str(r.get('actingPlayerId')) in team:
                actSide = team[str(r['actingPlayerId'])]; pid = str(r['actingPlayerId'])
                if not order or order[-1][0] != pid: order.append((pid, [at.get(pid)]))
            if r['reportId'] == 'kickoffResult':
                hx = [at[q][0] for q in at if q in team and team[q] == 'teamHome' and onp(q)]
                if hx: homeLeft = sum(hx) / len(hx) < 12.5
                held = {'teamHome': 0, 'teamAway': 0}; pend = None   # (the half ended, or someone scored: no next turn to judge by)
            if r['reportId'] != 'turnEnd': continue
            # (FFB switches homePlaying to the next team before this report, so the side whose turn it was is the last to act)
            side = actSide; actSide = None; turnOrder = order; order = []
            if side is None: continue
            other = 'teamAway' if side == 'teamHome' else 'teamHome'
            carrier = None
            if ball:
                for q in at:
                    if q in team and onp(q) and up(q) and at[q] == ball: carrier = q
            # the turn after one we recorded: does the recorded side still have the ball?
            if pend and pend['side'] != side:
                pend['kept'] = bool(carrier and team[carrier] == pend['side']); pend['oppScored'] = score['home' if side == 'teamHome' else 'away'] > pend['oppScore0']
                out.append(pend); pend = None
            if carrier and team[carrier] == side:
                held[side] += 1; held[other] = 0
                attacksRight = homeLeft if side == 'teamHome' else not homeLeft
                x = at[carrier][0]; toGo = (25 - x) if attacksRight else x
                mates = [at[q] for q in at if q in team and team[q] == side and q != carrier and onp(q) and up(q)]
                opps = [at[q] for q in at if q in team and team[q] == other and onp(q) and up(q)]
                reachO = [(at[q], ma[q] - (0 if up(q) else 3)) for q in at if q in team and team[q] == other and onp(q) and (st.get(q, 1) & 0xFF) in (1, 2, 3)]
                rec = shape(at[carrier], mates, opps, toGo, reachO)
                # when in the turn the carrier moved (its last activation, of all the team's activations), and whether it moved at all
                acts = [pid for pid, _ in turnOrder]
                if carrier in acts:
                    k = len(acts) - 1 - acts[::-1].index(carrier); rec['carrierAt'] = (k + 1) / len(acts); rec['nActs'] = len(acts)
                rec['raw'] = {'car': at[carrier], 'dir': 1 if attacksRight else -1, 'mates': [at[q] for q in at if q in team and team[q] == side and q != carrier and onp(q) and up(q)],
                              'opps': [[at[q][0], at[q][1], ma[q], 1 if up(q) else 0] for q in at if q in team and team[q] == other and onp(q) and (st.get(q, 1) & 0xFF) in (1, 2, 3)]}
                rec.update(race=meta['home' if side == 'teamHome' else 'away']['race'], side=side, turn=turn['home' if side == 'teamHome' else 'away'], held=held[side],
                           oppScore0=score['home' if other == 'teamHome' else 'away'])
                if toGo > 0: pend = rec
            elif carrier is None or team.get(carrier) != side: held[side] = 0
    return out

def summary(lab, R):
    pct = lambda a, b: f'{100 * a / b:.0f}%' if b else '-'
    lost = lambda rs: sum(1 for r in rs if not r.get('kept', True))
    print(f'\n{lab}: {len(R)} turns ending with our carrier standing; ball lost by the end of their next turn {pct(lost(R), len(R))}')
    m = lambda rs, k: sum(r[k] for r in rs) / max(1, len(rs))
    print(f"  team-mates next to the carrier {m(R, 'adj'):.2f} (diagonal corners {m(R, 'corners'):.2f}, sides {m(R, 'orth'):.2f}); within 2 {m(R, 'within2'):.2f}; within 3 {m(R, 'within3'):.2f}")
    print(f"  nearest opponent: next to it {pct(sum(1 for r in R if r.get('nearest') == 1), len(R))}, 2 away {pct(sum(1 for r in R if r.get('nearest') == 2), len(R))}, 3 {pct(sum(1 for r in R if r.get('nearest') == 3), len(R))}, 4+ {pct(sum(1 for r in R if r.get('nearest', 99) >= 4), len(R))}; opponents able to reach it next turn {m(R, 'reach'):.1f}")
    print('  lost next turn by nearest opponent: ' + '  '.join(f"{k}{'+' if k == 4 else ''}: {pct(lost(rs), len(rs))} ({len(rs)})" for k in (1, 2, 3, 4) for rs in [[r for r in R if (r.get('nearest', 99) >= 4 if k == 4 else r.get('nearest') == k)]]))
    print('  lost next turn by opponents in reach: ' + '  '.join(f"{a}-{b}: {pct(lost(rs), len(rs))} ({len(rs)})" for a, b in ((0, 1), (2, 3), (4, 5), (6, 7), (8, 11)) for rs in [[r for r in R if a <= r.get('reach', 0) <= b]]))
    print(f"  all four corners {pct(sum(1 for r in R if r['corners'] == 4), len(R))}, 3+ corners {pct(sum(1 for r in R if r['corners'] >= 3), len(R))}; carrier marked {pct(sum(1 for r in R if r['oppAdj']), len(R))}; opponents within 3 {m(R, 'opp3'):.1f}")
    print('  by team-mates next to the carrier (turns, lost next turn):  ' + '  '.join(f"{k}{'+' if k == 4 else ''}: {len(rs)} ({pct(lost(rs), len(rs))})" for k in range(5) for rs in [[r for r in R if (r['adj'] >= 4 if k == 4 else r['adj'] == k)]]))
    print('  by corners filled:  ' + '  '.join(f"{k}: {len(rs)} ({pct(lost(rs), len(rs))})" for k in range(5) for rs in [[r for r in R if r['corners'] == k]]))
    zones = [('own half (14+ to go)', lambda r: r['toGo'] >= 14), ('their half, 7-13 to go', lambda r: 7 <= r['toGo'] <= 13), ('scoring range (1-6 to go)', lambda r: r['toGo'] <= 6)]
    print('  by place on the pitch:')
    for zl, f in zones:
        rs = [r for r in R if f(r)]
        print(f"    {zl:26} {len(rs):4} turns: next to it {m(rs, 'adj'):.2f}, corners {m(rs, 'corners'):.2f}, 3+ corners {pct(sum(1 for r in rs if r['corners'] >= 3), len(rs))}, within 2 {m(rs, 'within2'):.2f}, marked {pct(sum(1 for r in rs if r['oppAdj']), len(rs))}, lost {pct(lost(rs), len(rs))}")
    print('  by turns holding the ball:')
    for hl, f in (('1st turn', lambda r: r['held'] == 1), ('2nd', lambda r: r['held'] == 2), ('3rd', lambda r: r['held'] == 3), ('4th+', lambda r: r['held'] >= 4)):
        rs = [r for r in R if f(r)]
        print(f"    {hl:8} {len(rs):4} turns: next to it {m(rs, 'adj'):.2f}, corners {m(rs, 'corners'):.2f}, 3+ corners {pct(sum(1 for r in rs if r['corners'] >= 3), len(rs))}, within 2 {m(rs, 'within2'):.2f}, mean to go {m(rs, 'toGo'):.1f}, lost {pct(lost(rs), len(rs))}")
    print(f"  from the sideline: " + '  '.join(f"{lab2} {pct(len(rs), len(R))} (lost {pct(lost(rs), len(rs))})" for lab2, f in (('on it', lambda r: r['edge'] == 0), ('1-2', lambda r: 1 <= r['edge'] <= 2), ('3-4', lambda r: 3 <= r['edge'] <= 4), ('5+ (middle)', lambda r: r['edge'] >= 5)) for rs in [[r for r in R if f(r)]]))

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--json', default=''); ap.add_argument('--bb', action='append', default=[]); a = ap.parse_args()
    for f in a.bb: summary(f'BludBowl computer ({os.path.basename(f)})', json.load(open(f)))
    if a.bb: return
    index = json.load(open(os.path.join(REP, 'index.json'))); R = []
    for e in index:
        fn = os.path.join(REP, f"{e['replay']}.json.gz")
        if os.path.exists(fn): R += cages(fn, e)
    if a.json: json.dump(R, open(a.json, 'w'))
    summary('FUMBBL top coaches', R)

if __name__ == '__main__':
    main()
