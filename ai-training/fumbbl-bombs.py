#!/usr/bin/env python3
"""Bombs (Bombardier: Goblin Bommas, Snotling Fungus Flingas, bomb-throwing star players) in the downloaded FUMBBL replays:
how often the teams that have one throw, when in the turn and the half, at whom (their ball carrier, a crowd, a lone
player, players already on the floor...), how accurate, and what it did (opponents knocked down, hurt, the ball knocked
loose, our own players hit, turnovers).

  python3 ai-training/fumbbl-bombs.py
  python3 ai-training/fumbbl-bombs.py --bb bb.json      (from bb-bombs.js: the BludBowl computer, the same way)
"""
import argparse, collections, gzip, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
REP = os.path.join(HERE, 'data', 'fumbbl-replays')
def changes(c): return (c.get('modelChangeList') or {}).get('modelChangeArray', []) or []
def reports(c): return (c.get('reportList') or {}).get('reports', []) or []
cheb = lambda a, b: max(abs(a[0] - b[0]), abs(a[1] - b[1]))
ROLES = ('Big Guy', 'Blitzer', 'Catcher', 'Thrower', 'Runner', 'Blocker', 'Lineman')

def role(kw, name):
    for r in ROLES:
        if r in kw: return r
    n = (name or '').lower()
    return 'Lineman' if 'line' in n else 'Special'

def throws(fn, meta):
    d = json.load(gzip.open(fn)); g = d['game']
    team, info, can, bomberSk = {}, {}, collections.Counter(), {}
    for side in ('teamHome', 'teamAway'):
        pos = {q['positionId']: q for q in g[side]['roster']['positionArray']}
        for p in g[side]['playerArray']:
            pid = str(p['playerId']); team[pid] = side; ps = pos.get(p['positionId'], {})
            sk = set(x if isinstance(x, str) else x.get('skillName', '') for x in p.get('skillArray', [])) | set(ps.get('skillArray') or [])
            info[pid] = {'type': ps.get('positionName', p.get('playerType')), 'role': role(ps.get('keywords') or [], ps.get('positionName')),
                         'st': p.get('strength'), 'av': p.get('armour'), 'skills': sorted(sk & {'Block', 'Dodge', 'Guard', 'Sure Hands', 'Stand Firm', 'Sidestep'})}
            if 'Bombardier' in sk: can[side] += 1; bomberSk[pid] = sk
    at, st, ball, turn = {}, {}, None, {'home': 0, 'away': 0}
    out, T, acts = [], None, collections.Counter()   # acts: players' actions so far in each side's current turn
    up = lambda q: (st.get(q, 1) & 0xFF) in (1, 2)
    hit = lambda q: (st.get(q, 1) & 0xFF) in (3, 4, 5, 6, 7, 8)   # prone, stunned, KO, hurt (not off to the reserves at half time)
    onp = lambda q: at.get(q) and 0 <= at[q][0] <= 25 and 0 <= at[q][1] <= 14
    def carrier():
        if not ball: return None
        for q in at:
            if q in team and onp(q) and up(q) and at[q] == ball: return q
    def close():
        nonlocal T
        if T and T.get('target'):
            side = T['side']
            T['kd'] = sum(1 for q in T['up0'] if team[q] != side and hit(q))
            T['ownKd'] = sum(1 for q in T['up0'] if team[q] == side and hit(q))
            T['ballLoose'] = bool(T['c0'] and team[T['c0']] != side and carrier() != T['c0'])
            T['turnover'] = T['ownKd'] > 0
            T.pop('up0'); T.pop('c0')
            out.append(T)
        T = None
    cur = {'home': [], 'away': []}   # this turn's throws, to fill in the action count when it ends
    for cmd in d['gameLog']['commandArray']:
        rs = reports(cmd)
        if any(r['reportId'] == 'turnEnd' for r in rs): close()   # before the end-of-turn changes (players leaving at half time)
        for r in rs:   # (the action is reported in the same command as its target square: start it first)
            if r['reportId'] != 'playerAction': continue
            close(); pid = str(r['actingPlayerId']); hs = 'home' if team.get(pid) == 'teamHome' else 'away'
            if acts[hs] == 0 and any(team[q] == team.get(pid) and onp(q) and up(q) and 'Bombardier' in bomberSk.get(q, ()) for q in at if q in team):
                can[team[pid] + ':ready'] += 1   # a team-turn starting with a bomber on their feet
            if r.get('playerAction') == 'throwBomb':
                opp = [cheb(at[q], at[pid]) for q in at if q in team and team[q] != team[pid] and onp(q) and up(q)] if at.get(pid) else []
                T = {'oppD': min(opp) if opp else 99, 'side': team[pid], 'race': meta[hs]['race'], 'turn': turn[hs], 'thrower': info[pid]['type'], 'tid': pid, 'idx': acts[hs],
                     'hurt': 0, 'cas': 0, 'rr': False, 'res': None, 'target': None}
                cur[hs].append(T)
            # (one player's action can be reported more than once - a Blitz after a move - so count each player once a turn)
            if pid not in acts.get(hs + ':who', set()):
                acts[hs] += 1; acts.setdefault(hs + ':who', set()); acts[hs + ':who'].add(pid)
        for m in changes(cmd):
            k, v = m['modelChangeId'], m.get('modelChangeValue')
            if k == 'fieldModelSetPlayerCoordinate': at[str(m['modelChangeKey'])] = v
            elif k == 'fieldModelSetPlayerState' and isinstance(v, int): st[str(m['modelChangeKey'])] = v
            elif k == 'fieldModelSetBallCoordinate': ball = v if isinstance(v, list) else None
            elif k == 'turnDataSetTurnNr': turn[m['modelChangeKey']] = v
            elif k == 'gameSetPassCoordinate' and T is not None and v and not T.get('target'):
                side = T['side']; T['target'] = v; c = carrier()
                near = []
                for q in at:
                    if q not in team or not onp(q) or cheb(at[q], v) > 1: continue
                    near.append({'own': team[q] == side, 'up': up(q), 'carrier': q == c, 'd': cheb(at[q], v), **info[q]})
                T['near'] = near
                T['ball'] = 'theirs' if c and team[c] != side else 'ours' if c else 'loose'
                T['theirC'] = bool(c and team[c] != side)
                T['carrierD'] = cheb(at[c], v) if c and team[c] != side else None
                T['up0'] = [q for q in at if q in team and onp(q) and up(q)]; T['c0'] = c
        for r in rs:
            rid = r['reportId']
            if rid == 'playerAction': continue
            elif rid == 'turnEnd':
                close()
                for hs in ('home', 'away'):
                    if cur[hs]:
                        for t in cur[hs]: t['n'] = acts[hs]
                        cur[hs] = []
                    acts[hs] = 0; acts[hs + ':who'] = set()
            elif T is not None:
                if rid == 'passRoll' and r.get('bomb'): T['res'] = r.get('passResult'); T['dist'] = r.get('passingDistance')
                elif rid == 'reRoll' and str(r.get('playerId')) == T['tid']: T['rr'] = True
                elif rid == 'injury' and r.get('injuryType') == 'bomb' and team.get(str(r.get('defenderId'))) != T['side']:
                    if r.get('armorBroken'): T['hurt'] += 1
                    if r.get('casualtyRoll') or (r.get('injuryRoll') and sum(r['injuryRoll']) >= 8): T['cas'] += 1   # KO or worse
    close()
    return out, can

def kind(t):
    """at whom: what was in the blast (the target square and the eight round it)"""
    opp = [q for q in t.get('near', []) if not q['own']]
    if t.get('theirC') and t.get('carrierD') is not None and t['carrierD'] <= 1: return 'their ball carrier'
    if t.get('theirC') and t.get('carrierD') == 2: return 'next to their carrier'
    up = [q for q in opp if q['up']]
    if len(up) >= 2: return 'a crowd (2+ standing)'
    if len(up) == 1: return 'one standing player'
    if opp: return 'players on the floor'
    return 'nobody'

def summary(lab, Tz, teamMatches, ready=0):
    pct = lambda a, b: f'{100 * a / b:.0f}%' if b else '-'
    n = len(Tz); print(f'\n{lab}: {n} bombs by {teamMatches} team-matches with a bomber ({n / max(1, teamMatches):.2f} a match)')
    print('  by team: ' + ', '.join(f'{k} {v}' for k, v in collections.Counter(t['race'] for t in Tz).most_common()))
    if ready: print(f'  team-turns starting with the bomber on their feet: {ready / max(1, teamMatches):.1f} a match; a bomb thrown in {100 * n / ready:.0f}% of them')
    od = collections.Counter('next to one (marked)' if t.get('oppD') == 1 else '2-3 away' if t.get('oppD', 99) <= 3 else '4+ away' for t in Tz)
    print('  the bomber, as it throws: nearest standing opponent ' + ', '.join(f'{k} {pct(v, n)}' for k, v in od.most_common()))
    print('  at whom:')
    K = collections.defaultdict(list)
    for t in Tz: K[kind(t)].append(t)
    for k in ('their ball carrier', 'next to their carrier', 'a crowd (2+ standing)', 'one standing player', 'players on the floor', 'nobody'):
        g = K.get(k, [])
        print(f"    {k:24} {len(g):3} ({pct(len(g), n)})" + (f": knocked down {sum(t['kd'] for t in g) / len(g):.1f} each, accurate {pct(sum(1 for t in g if t.get('res') == 'ACCURATE'), len(g))}" if g else ''))
    opp = [q for t in Tz for q in t.get('near', []) if not q['own'] and q['up']]
    print(f"  standing opponents in the blast: {len(opp) / max(1, n):.1f} a bomb; of them: " + ', '.join(f'{k} {pct(v, len(opp))}' for k, v in collections.Counter(q['role'] for q in opp).most_common()))
    cen = [q for t in Tz for q in t.get('near', []) if not q['own'] and q['d'] == 0]
    print(f"  aimed right at an opponent: {pct(len(cen), n)}" + (': ' + ', '.join(f'{k} {v}' for k, v in collections.Counter(q['role'] + ('' if q['up'] else ' (down)') for q in cen).most_common()) if cen else ''))
    sk = collections.Counter(s for q in opp for s in q['skills'])
    print('  their skills (standing in the blast): ' + ', '.join(f'{k} {pct(v, len(opp))}' for k, v in sk.most_common()))
    own = sum(1 for t in Tz if any(q['own'] and q['up'] for q in t.get('near', [])))
    print(f"  own standing player in the blast: {pct(own, n)}")
    print(f"  the ball: theirs {pct(sum(1 for t in Tz if t.get('ball') == 'theirs'), n)}, ours {pct(sum(1 for t in Tz if t.get('ball') == 'ours'), n)}, loose {pct(sum(1 for t in Tz if t.get('ball') == 'loose'), n)}")
    res = collections.Counter(t.get('res') or '?' for t in Tz)
    print('  result: ' + ', '.join(f'{k.lower()} {pct(v, n)}' for k, v in res.most_common()) + f"; re-rolled {pct(sum(1 for t in Tz if t.get('rr')), n)}")
    print('  distance: ' + ', '.join(f'{k} {pct(v, n)}' for k, v in collections.Counter(t.get('dist') or '?' for t in Tz).most_common()))
    print(f"  did: opponents knocked down {sum(t['kd'] for t in Tz) / max(1, n):.2f} a bomb (none {pct(sum(1 for t in Tz if not t['kd']), n)}), armour broken {sum(t['hurt'] for t in Tz) / max(1, n):.2f}, KO or casualty {sum(t['cas'] for t in Tz) / max(1, n):.2f}, "
          f"ball knocked loose {pct(sum(1 for t in Tz if t.get('ballLoose')), n)}, own player knocked down (a turnover) {pct(sum(1 for t in Tz if t.get('turnover')), n)}")
    tn = collections.Counter('turn 8' if t['turn'] >= 8 else 'turns 6-7' if t['turn'] >= 6 else 'turns 1-5' for t in Tz)
    print('  when in the half: ' + ', '.join(f'{k} {pct(v, n)}' for k, v in sorted(tn.items())))
    fr = [t['idx'] / max(1, t.get('n', 1) - 1) for t in Tz if t.get('n', 0) > 1]
    first = sum(1 for t in Tz if t['idx'] == 0); last = sum(1 for t in Tz if t.get('n') and t['idx'] == t['n'] - 1)
    print(f"  when in the turn: {sum(fr) / max(1, len(fr)):.2f} of the way through (0 = first action, 1 = last); first action {pct(first, n)}, last action {pct(last, n)}")

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--bb', action='append', default=[]); a = ap.parse_args()
    for f in a.bb: D = json.load(open(f)); summary(f'BludBowl computer ({os.path.basename(f)})', D['throws'], D['teamMatches'], D.get('ready', 0))
    if a.bb: return
    index = json.load(open(os.path.join(REP, 'index.json'))); Tz = []; tm = 0; rd = 0; per = collections.Counter(); perT = collections.Counter()
    for e in index:
        fn = os.path.join(REP, f"{e['replay']}.json.gz")
        if not os.path.exists(fn): continue
        t, can = throws(fn, e); Tz += t
        for side in ('teamHome', 'teamAway'):
            rd += can.get(side + ':ready', 0)
            if can.get(side): tm += 1; race = e['home' if side == 'teamHome' else 'away']['race']; per[race] += 1
        for x in t: perT[x['race']] += 1
    summary('FUMBBL coaches (teams with a bomber)', Tz, tm, rd)
    print('  bombs a match, by team: ' + ', '.join(f"{r} {perT[r] / k:.1f} ({k})" for r, k in per.most_common()))

if __name__ == '__main__':
    main()
