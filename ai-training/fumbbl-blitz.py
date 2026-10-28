#!/usr/bin/env python3
"""Blitzes in the downloaded FUMBBL replays: how often a turn's blitz is used (by who has the ball), who is blitzed (their
ball carrier, a player marking our carrier, one of the players round their carrier, someone else), who does it, how
far they run, the dodges and Rushes on the way, the block dice, whether the target goes down, and where in the turn.

  python3 ai-training/fumbbl-blitz.py
  python3 ai-training/fumbbl-blitz.py --bb bb.json      (from bb-blitz.js: the BludBowl computer, the same way)
"""
import argparse, collections, gzip, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
REP = os.path.join(HERE, 'data', 'fumbbl-replays')
def changes(c): return (c.get('modelChangeList') or {}).get('modelChangeArray', []) or []
def reports(c): return (c.get('reportList') or {}).get('reports', []) or []
cheb = lambda a, b: max(abs(a[0] - b[0]), abs(a[1] - b[1]))

def turns(fn, meta):
    d = json.load(gzip.open(fn)); g = d['game']
    team, info = {}, {}
    for side in ('teamHome', 'teamAway'):
        pos = {p['positionId']: p for p in g[side]['roster']['positionArray']}
        for p in g[side]['playerArray']:
            pid = str(p['playerId']); team[pid] = side
            sk = {x if isinstance(x, str) else x.get('skillName', '') for x in p.get('skillArray', [])}
            info[pid] = {'st': p['strength'], 'ma': p['movement'], 'av': p['armour'], 'block': 'Block' in sk, 'pos': pos.get(p['positionId'], {}).get('positionName', '?')}
    teamId = {g['teamHome']['teamId']: 'teamHome', g['teamAway']['teamId']: 'teamAway'}
    at, st, ball = {}, {}, None; out = []; T = None
    up = lambda q: (st.get(q, 1) & 0xFF) in (1, 2)
    onp = lambda q: at.get(q) and 0 <= at[q][0] <= 25 and 0 <= at[q][1] <= 14
    def carrier():
        if not ball: return None
        for q in at:
            if q in team and onp(q) and up(q) and at[q] == ball: return q
        return None
    for cmd in d['gameLog']['commandArray']:
        for m in changes(cmd):
            k, v = m['modelChangeId'], m.get('modelChangeValue')
            if k == 'fieldModelSetPlayerCoordinate': at[str(m['modelChangeKey'])] = v
            elif k == 'fieldModelSetPlayerState' and isinstance(v, int): st[str(m['modelChangeKey'])] = v
            elif k == 'fieldModelSetBallCoordinate': ball = v if isinstance(v, list) else None
        for r in reports(cmd):
            rid = r['reportId']
            if rid == 'kickoffResult': T = None; continue
            if rid == 'playerAction' and str(r.get('actingPlayerId')) in team:
                pid = str(r['actingPlayerId']); side = team[pid]
                if T is None or T['side'] != side:
                    c = carrier()
                    T = {'side': side, 'race': meta['home' if side == 'teamHome' else 'away']['race'], 'n': 0, 'blitz': None,
                         'ball': 'ours' if c and team[c] == side else 'theirs' if c else 'loose'}
                    T['_c0'] = c
                if not T.get('_last') or T['_last'] != pid: T['n'] += 1; T['_last'] = pid
                if r.get('playerAction') == 'blitzMove' and T['blitz'] is None:
                    T['blitz'] = {'pid': pid, 'at': T['n'], 'from': at.get(pid), 'dodges': 0, 'rushes': 0, 'blocked': False, 'kd': False,
                                  'st': info[pid]['st'], 'ma': info[pid]['ma'], 'hasBlock': info[pid]['block'], 'pos': info[pid]['pos']}
                continue
            if T is None or not T.get('blitz'): 
                if rid == 'turnEnd' and T: out.append(T); T = None
                continue
            b = T['blitz']
            if rid == 'selectBlitzTarget':
                tid = str(r.get('defenderId')); b['target'] = tid
                c = carrier(); tgt = at.get(tid)
                ourC = c if c and team[c] == T['side'] else None; theirC = c if c and team[c] != T['side'] else None
                b['role'] = ('carrier' if theirC == tid else 'marking our carrier' if ourC and tgt and cheb(tgt, at[ourC]) == 1
                             else 'next to their carrier' if theirC and tgt and cheb(tgt, at[theirC]) == 1 else 'other')
                b['tst'] = info.get(tid, {}).get('st'); b['tblock'] = info.get(tid, {}).get('block')
                if tgt:
                    ours = [q for q in at if q in team and team[q] == T['side'] and onp(q) and up(q) and q != b['pid']]
                    b['ourAdj'] = sum(1 for q in ours if cheb(at[q], tgt) == 1)            # our players next to it (assists, or players it marks)
                    b['edge'] = min(tgt[1], 14 - tgt[1]); b['tpos'] = info.get(tid, {}).get('pos', '?'); b['tav'] = info.get(tid, {}).get('av'); b['tma'] = info.get(tid, {}).get('ma')
                    b['ballD'] = cheb(tgt, ball) if ball else None
                b['tline'] = bool(tgt and (tgt[0] in (12, 13)))
            elif rid == 'dodgeRoll' and str(r.get('playerId')) == b['pid']: b['dodges'] += 1
            elif rid == 'goForItRoll' and str(r.get('playerId')) == b['pid']: b['rushes'] += 1
            elif rid == 'blockRoll' and not b['blocked'] and T.get('_last') == b['pid']:
                b['blocked'] = True; b['dist'] = cheb(b['from'], at[b['pid']]) if b.get('from') and at.get(b['pid']) else None
                n = len(r.get('blockRoll') or []); b['dice'] = n if teamId.get(r.get('choosingTeamId')) == T['side'] or n == 1 else -n
            elif rid == 'injury' and str(r.get('defenderId')) == b.get('target') and r.get('injuryType') in ('block', None): b['kd'] = True
            elif rid == 'turnEnd': out.append(T); T = None
    return [t for t in out if t['n'] >= 2]

def summary(lab, T):
    pct = lambda a, b: f'{100 * a / b:.0f}%' if b else '-'
    B = [t['blitz'] for t in T if t['blitz']]
    print(f'\n{lab}: {len(T)} turns (2+ players acting)')
    print(f'  a blitz declared in {pct(len(B), len(T))} of turns; ' + '  '.join(f"{k} ball: {pct(sum(1 for t in T if t['ball'] == k and t['blitz']), sum(1 for t in T if t['ball'] == k))} ({sum(1 for t in T if t['ball'] == k)})" for k in ('ours', 'theirs', 'loose')))
    bl = [b for b in B if b['blocked']]
    print(f"  ...of those, the block actually made {pct(len(bl), len(B))}; target down {pct(sum(1 for b in bl if b['kd']), len(bl))}")
    r = collections.Counter(b.get('role', '?') for b in bl)
    print('  who was blitzed: ' + '  '.join(f"{k} {pct(v, len(bl))} (down {pct(sum(1 for b in bl if b.get('role') == k and b['kd']), v)})" for k, v in r.most_common()))
    for k in ('theirs', 'ours', 'loose'):
        bs = [t['blitz'] for t in T if t['ball'] == k and t['blitz'] and t['blitz']['blocked']]
        rr = collections.Counter(b.get('role', '?') for b in bs)
        print(f'    ({k} ball) ' + '  '.join(f'{x} {pct(v, len(bs))}' for x, v in rr.most_common()))
    oth = [b for b in bl if b.get('role') == 'other' and 'ourAdj' in b]
    if oth:
        print(f"  'other' targets ({len(oth)}): next to 0 / 1 / 2 / 3+ of ours (besides the blitzer): " + ' / '.join(pct(sum(1 for b in oth if min(3, b['ourAdj']) == k), len(oth)) for k in range(4))
              + f"; on the sideline {pct(sum(1 for b in oth if b['edge'] == 0), len(oth))}, a square in {pct(sum(1 for b in oth if b['edge'] == 1), len(oth))}; within 3 of the ball {pct(sum(1 for b in oth if b['ballD'] is not None and b['ballD'] <= 3), len(oth))}")
        print(f"    their MA {sum(b['tma'] or 0 for b in oth) / len(oth):.1f}, AV {sum(b['tav'] or 0 for b in oth) / len(oth):.1f}; most often: " + ', '.join(f'{k} {v}' for k, v in collections.Counter(b['tpos'] for b in oth).most_common(8)))
    print(f"  the target: ST {sum(b['tst'] or 0 for b in bl) / max(1, len(bl)):.2f}, with Block {pct(sum(1 for b in bl if b.get('tblock')), len(bl))}; on the line of scrimmage {pct(sum(1 for b in bl if b.get('tline')), len(bl))}")
    print(f"  the blitzer: ST {sum(b['st'] for b in bl) / max(1, len(bl)):.2f}, MA {sum(b['ma'] for b in bl) / max(1, len(bl)):.1f}, with Block {pct(sum(1 for b in bl if b['hasBlock']), len(bl))}")
    ds = [b['dist'] for b in bl if b.get('dist') is not None]
    print(f"  squares run (start to block): mean {sum(ds) / max(1, len(ds)):.1f}; 0-1 {pct(sum(1 for d in ds if d <= 1), len(ds))}, 2-4 {pct(sum(1 for d in ds if 2 <= d <= 4), len(ds))}, 5+ {pct(sum(1 for d in ds if d >= 5), len(ds))}")
    print(f"  with a dodge on the way {pct(sum(1 for b in bl if b['dodges']), len(bl))}, a Rush {pct(sum(1 for b in bl if b['rushes']), len(bl))}")
    dc = collections.Counter(b.get('dice') for b in bl)
    print('  block dice: ' + '  '.join(f"{('-' if k < 0 else '') + str(abs(k)) if k else '?'} {pct(v, len(bl))}" for k, v in sorted(dc.items(), key=lambda x: (x[0] or 0))) + '  (minus: they choose)')
    pos = [(b['at'] - 1) / max(1, t['n'] - 1) for t in T for b in [t['blitz']] if b and b['blocked']]
    print(f"  where in the turn (0 first, 1 last): {sum(pos) / max(1, len(pos)):.2f}; first third {pct(sum(1 for p in pos if p < 1 / 3), len(pos))}, last third {pct(sum(1 for p in pos if p >= 2 / 3), len(pos))}")

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--bb', action='append', default=[]); a = ap.parse_args()
    for f in a.bb: summary(f'BludBowl computer ({os.path.basename(f)})', json.load(open(f)))
    if a.bb: return
    index = json.load(open(os.path.join(REP, 'index.json'))); T = []
    for e in index:
        fn = os.path.join(REP, f"{e['replay']}.json.gz")
        if os.path.exists(fn): T += turns(fn, e)
    summary('FUMBBL top coaches', T)

if __name__ == '__main__':
    main()
