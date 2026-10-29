#!/usr/bin/env python3
"""Throw Team-mate (and Kick Team-mate) in the downloaded FUMBBL replays: how often the teams that can do it throw, and
what for: the ball (the thrown player was carrying it), onto an opponent, next to their ball carrier, or just up the
pitch (positioning); how far, how accurate, whether they landed on their feet, and whether a touchdown followed.

  python3 ai-training/fumbbl-ttm.py
  python3 ai-training/fumbbl-ttm.py --bb bb.json      (from bb-ttm.js: the BludBowl computer, the same way)
"""
import argparse, collections, gzip, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
REP = os.path.join(HERE, 'data', 'fumbbl-replays')
def changes(c): return (c.get('modelChangeList') or {}).get('modelChangeArray', []) or []
def reports(c): return (c.get('reportList') or {}).get('reports', []) or []
cheb = lambda a, b: max(abs(a[0] - b[0]), abs(a[1] - b[1]))
THROW = {'Throw Team-Mate', 'Throw Team-mate', 'Kick Team-Mate', 'Kick Team-mate'}

def throws(fn, meta):
    d = json.load(gzip.open(fn)); g = d['game']
    team, info, can = {}, {}, collections.Counter()
    for side in ('teamHome', 'teamAway'):
        pos = {q['positionId']: q.get('positionName', '?') for q in g[side]['roster']['positionArray']}
        for p in g[side]['playerArray']:
            pid = str(p['playerId']); team[pid] = side; sk = set(x if isinstance(x, str) else x.get('skillName', '') for x in p.get('skillArray', []))
            info[pid] = {'type': pos.get(p['positionId'], p.get('playerType')), 'skills': sk}
            if sk & THROW: can[side] += 1
            if 'Right Stuff' in sk: can[side + ':rs'] += 1
    at, st, ball, homeLeft, turn = {}, {}, None, True, {'home': 0, 'away': 0}; out = []; T = None
    up = lambda q: (st.get(q, 1) & 0xFF) in (1, 2)
    onp = lambda q: at.get(q) and 0 <= at[q][0] <= 25 and 0 <= at[q][1] <= 14
    def carrier():
        if not ball: return None
        for q in at:
            if q in team and onp(q) and up(q) and at[q] == ball: return q
    def close(td=None):
        nonlocal T
        if T and T.get('thrown'):
            q = T['thrown']; end = at.get(q)
            T['landed'] = bool(end and onp(q) and up(q)); T['out'] = not (end and onp(q))
            if end and onp(q):
                right = homeLeft if T['side'] == 'teamHome' else not homeLeft
                toGo = lambda xy: (25 - xy[0]) if right else xy[0]
                T['gain'] = toGo(T['from']) - toGo(end); T['dist'] = cheb(T['from'], end); T['toGoEnd'] = toGo(end)
                T['ontoOpp'] = any(team.get(o) != T['side'] and xy == end for o, xy in T['opp0'])
                T['nextToCarrier'] = bool(T['theirC'] and cheb(end, T['theirC']) == 1)
                T['nearOpp'] = sum(1 for o, xy in T['opp0'] if cheb(xy, end) == 1)
            T['purpose'] = ('ball' if T['withBall'] else 'onto an opponent' if T.get('ontoOpp') or T['hurt']
                            else 'next to their carrier' if T.get('nextToCarrier') else 'up the pitch')
            for k in ('opp0', 'theirC'): T.pop(k, None)
            out.append(T)
        T = None
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
            if rid == 'playerAction':
                close()
                if r.get('playerAction') in ('throwTeamMateMove', 'kickTeamMateMove', 'throwTeamMate', 'kickTeamMate'):
                    pid = str(r['actingPlayerId'])
                    T = {'side': team[pid], 'race': meta['home' if team[pid] == 'teamHome' else 'away']['race'], 'kick': 'kick' in r['playerAction'],
                         'turn': turn['home' if team[pid] == 'teamHome' else 'away'], 'thrower': info[pid]['type'], 'hurt': False, 'thrown': None}
            elif T is not None:
                if rid == 'throwTeamMateRoll':
                    q = str(r.get('thrownPlayerId')); c = carrier()
                    T.update(thrown=q, thrownType=info.get(q, {}).get('type'), res=r.get('passResult') or ('ok' if r.get('successful') else 'failed'), withBall=(c == q),
                             **{'from': list(at.get(q) or [0, 0])}, opp0=[(o, list(at[o])) for o in at if o in team and team[o] != T['side'] and onp(o) and up(o)],
                             theirC=(at[c] if c and team[c] != T['side'] else None))
                    if r.get('kicked'): T['kick'] = True
                elif rid == 'kickTeamMateFumble': T['res'] = 'FUMBLE'
                elif rid == 'rightStuffRoll' and str(r.get('playerId')) == T.get('thrown'): T['rs'] = bool(r.get('successful'))
                elif rid == 'injury' and team.get(str(r.get('defenderId'))) and team[str(r['defenderId'])] != T['side']: T['hurt'] = True
                elif rid == 'turnEnd':
                    if T.get('thrown') and r.get('playerIdTouchdown') and str(r.get('playerIdTouchdown')) == T['thrown']: T['td'] = True
                    close()
    close()
    return out, {side: n for side, n in can.items()}, meta

def summary(lab, Tz, teamMatches):
    pct = lambda a, b: f'{100 * a / b:.0f}%' if b else '-'
    print(f'\n{lab}: {len(Tz)} throws by {teamMatches} team-matches with a thrower ({len(Tz) / max(1, teamMatches):.2f} a match)')
    by = collections.Counter(t['race'] for t in Tz); print('  by team: ' + ', '.join(f'{k} {v}' for k, v in by.most_common()))
    print(f"  kicked rather than thrown: {pct(sum(1 for t in Tz if t.get('kick')), len(Tz))}")
    P = collections.defaultdict(list)
    for t in Tz: P[t['purpose']].append(t)
    for k in ('ball', 'up the pitch', 'next to their carrier', 'onto an opponent'):
        g = P.get(k, [])
        if not g: print(f'  {k:22} 0'); continue
        gain = [t['gain'] for t in g if 'gain' in t]
        print(f"  {k:22} {len(g):3} ({pct(len(g), len(Tz))}): squares gained {sum(gain) / max(1, len(gain)):.1f}, landed on their feet {pct(sum(1 for t in g if t.get('landed')), len(g))}, "
              f"accurate {pct(sum(1 for t in g if str(t.get('res', '')).upper() in ('ACCURATE', 'SUPERB')), len(g))}, fumbled {pct(sum(1 for t in g if 'FUMBLE' in str(t.get('res', '')).upper()), len(g))}"
              + (f", touchdown that turn {pct(sum(1 for t in g if t.get('td')), len(g))}" if k == 'ball' else '')
              + (f", opponent hurt {pct(sum(1 for t in g if t.get('hurt')), len(g))}" if k == 'onto an opponent' else ''))
    tn = collections.Counter('turn 8' if t['turn'] >= 8 else 'turns 6-7' if t['turn'] >= 6 else 'turns 1-5' for t in Tz)
    print('  when: ' + ', '.join(f'{k} {pct(v, len(Tz))}' for k, v in sorted(tn.items())))
    print('  thrown: ' + ', '.join(f'{k} {v}' for k, v in collections.Counter(t.get('thrownType') or '?' for t in Tz).most_common(6)))

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--bb', action='append', default=[]); a = ap.parse_args()
    for f in a.bb: D = json.load(open(f)); summary(f'BludBowl computer ({os.path.basename(f)})', D['throws'], D['teamMatches'])
    if a.bb: return
    index = json.load(open(os.path.join(REP, 'index.json'))); Tz = []; tm = 0; per = {}
    for e in index:
        fn = os.path.join(REP, f"{e['replay']}.json.gz")
        if not os.path.exists(fn): continue
        t, can, _ = throws(fn, e); Tz += t
        for side in ('teamHome', 'teamAway'):
            if can.get(side) and can.get(side + ':rs'):
                tm += 1; race = e['home' if side == 'teamHome' else 'away']['race']; per[race] = per.get(race, 0) + 1
    summary('FUMBBL top coaches (teams with a thrower and a Right Stuff player)', Tz, tm)
    print('  throws a match, by team: ' + ', '.join(f"{r} {sum(1 for t in Tz if t['race'] == r) / n:.1f} ({n})" for r, n in sorted(per.items(), key=lambda x: -x[1])))
    att = [t for t in Tz if t['purpose'] == 'onto an opponent']
    print('  onto an opponent: ' + ', '.join(f"{t['race']} {t['thrownType']}{' (kicked)' if t.get('kick') else ''} turn {t['turn']}" for t in att))

if __name__ == '__main__':
    main()
