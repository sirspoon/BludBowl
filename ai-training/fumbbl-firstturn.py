#!/usr/bin/env python3
"""The receiving team's first turn after each kick-off, in the downloaded FUMBBL replays: who starts it in contact
(next to a standing opponent), what those players do (block, blitz, dodge away, stay put), the order of the turn
(blocks before or after the ball is picked up), the block dice, and how many of the team are still in contact at the end.

  python3 ai-training/fumbbl-firstturn.py [--json out.json]
  python3 ai-training/fumbbl-firstturn.py --bb bb.json [--bb bb2.json]   (from bb-firstturn.js)
"""
import argparse, collections, gzip, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
REP = os.path.join(HERE, 'data', 'fumbbl-replays')
def changes(c): return (c.get('modelChangeList') or {}).get('modelChangeArray', []) or []
def reports(c): return (c.get('reportList') or {}).get('reports', []) or []
STANDING = {1}   # FFB PlayerState base: 1 standing, 2 moving, 3 prone, 4 stunned, ... (the low byte of the state)

def turns(fn, meta):
    d = json.load(gzip.open(fn)); g = d['game']
    team = {}
    for side in ('teamHome', 'teamAway'):
        for p in g[side]['playerArray']: team[str(p['playerId'])] = side
    st = {}; at = {}; ball = None; out = []; homePlaying = None
    phase = None   # None, 'kicked' (after the kick-off result, waiting for the receivers' turn), 'turn'
    T = None
    def up(pid): return (st.get(pid, 1) & 0xFF) in (1, 2)
    def onp(pid): xy = at.get(pid); return xy and 0 <= xy[0] <= 25 and 0 <= xy[1] <= 14
    def contact(pid):
        x, y = at[pid]; me = team[pid]
        return any(team[q] != me and onp(q) and up(q) and max(abs(at[q][0] - x), abs(at[q][1] - y)) == 1 for q in at if q in team)
    for cmd in d['gameLog']['commandArray']:
        ch, rp = changes(cmd), reports(cmd)
        acting = None
        for m in ch:
            k, v = m['modelChangeId'], m.get('modelChangeValue')
            if k == 'fieldModelSetPlayerCoordinate': at[str(m['modelChangeKey'])] = v
            elif k == 'fieldModelSetPlayerState' and isinstance(v, int): st[str(m['modelChangeKey'])] = v
            elif k == 'fieldModelSetBallCoordinate' and isinstance(v, list): ball = v
            elif k == 'gameSetHomePlaying': homePlaying = v
        for r in rp:
            rid = r['reportId']
            if rid == 'kickoffResult':
                phase = 'kicked'; T = None
                # receivers: the side whose half the ball is in (home plays from the left, x 0-12)
                recvSide = None
                hx = [at[q][0] for q in at if q in team and team[q] == 'teamHome' and onp(q)]
                if hx and ball:
                    homeLeft = sum(hx) / len(hx) < 12.5
                    recvSide = 'teamHome' if (ball[0] <= 12) == homeLeft else 'teamAway'
                T = {'recv': recvSide, 'kick': r.get('kickoffResult')}
            elif rid == 'playerAction' and phase in ('kicked', 'turn') and T and T.get('recv'):
                pid = str(r['actingPlayerId']); side = team.get(pid)
                if phase == 'kicked':
                    if side != T['recv']: continue   # a Blitz! kick-off: the kickers' free turn first
                    phase = 'turn'
                    ps = [q for q in at if q in team and team[q] == T['recv'] and onp(q) and up(q)]
                    T.update(meta=meta['replay'], race=meta['home' if T['recv'] == 'teamHome' else 'away']['race'], players={q: {'contact0': contact(q), 'acts': [], 'dodges': 0, 'dodgeFail': 0, 'blocks': []} for q in ps},
                             order=[], pickupAt=None, homeLeft=None)
                if side == T['recv'] and pid in T['players']:
                    a = r['playerAction']; T['players'][pid]['acts'].append(a); T['order'].append((pid, a))
                T['cur'] = pid
            elif phase == 'turn' and T:
                pid = T.get('cur')
                if rid == 'dodgeRoll' and str(r.get('playerId')) in T['players']:
                    q = T['players'][str(r['playerId'])]; q['dodges'] += 1; q['dodgeFail'] += 0 if r.get('successful') else 1
                elif rid == 'blockChoice' and pid in T['players']:
                    T['players'][pid]['blocks'].append(r['nrOfDice'])
                elif rid == 'blockRoll' and pid in T['players']:
                    T['players'][pid]['own'] = r.get('choosingTeamId') == g[T['recv']]['teamId']
                elif rid in ('pickUpRoll',) and T['pickupAt'] is None:
                    T['pickupAt'] = len(T['order'])
                elif rid == 'turnEnd':
                    for q, v in T['players'].items(): v['contact1'] = onp(q) and up(q) and contact(q)
                    T['ended'] = True; out.append(T); phase = None; T = None
    return out

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--json', default=''); ap.add_argument('--bb', action='append', default=[]); a = ap.parse_args()
    for f in a.bb: summary(f"BludBowl computer ({os.path.basename(f)})", json.load(open(f)))
    if a.bb: return
    index = json.load(open(os.path.join(REP, 'index.json'))); allT = []
    for e in index:
        fn = os.path.join(REP, f"{e['replay']}.json.gz")
        if os.path.exists(fn): allT += turns(fn, e)
    if a.json: json.dump(allT, open(a.json, 'w'))
    summary('FUMBBL top coaches', allT)

def summary(lab, allT):
    n = len(allT); P = [v for t in allT for v in t['players'].values()]
    c0 = [v for v in P if v['contact0']]
    pct = lambda a, b: f'{100 * a / b:.0f}%' if b else '-'
    blk = lambda v: any(x in ('block', 'blitz', 'blitzMove') for x in v['acts']) and v['blocks']
    print(f'{lab}: {n} first turns of a receiving team')
    print(f'  in contact at the start: {len(c0) / n:.1f} players a turn')
    did = collections.Counter()
    for v in c0:
        if blk(v): did['blocked'] += 1
        elif v['dodges']: did['dodged away (no block)'] += 1
        elif v['acts']: did['other action, no dodge'] += 1
        else: did['did nothing'] += 1
    print('  ...what they did: ' + ' · '.join(f'{k} {pct(x, len(c0))}' for k, x in did.most_common()))
    print(f"  ...dodged at all: {pct(sum(1 for v in c0 if v['dodges']), len(c0))}; still in contact at the end: {pct(sum(1 for v in c0 if v.get('contact1')), len(c0))}")
    bl = [b for v in P for b in v['blocks']]
    print(f'  blocks a turn: {len(bl) / n:.1f} (by players who started in contact {sum(len(v["blocks"]) for v in c0) / n:.1f}); dice: ' + ' · '.join(f'{k} {pct(x, len(bl))}' for k, x in sorted(collections.Counter(bl).items())))
    print(f"  dodges a turn: {sum(v['dodges'] for v in P) / n:.2f} (failed {sum(v['dodgeFail'] for v in P) / n:.2f}); by players who started in contact {sum(v['dodges'] for v in c0) / n:.2f}")
    # order: where in the turn the blocks come
    firstNon, pk, early = [], [], 0
    for t in allT:
        o = t['order']; kinds = ['b' if a in ('block', 'blitz', 'blitzMove') else 'm' for _, a in o]
        if 'm' in kinds: firstNon.append(kinds.index('m'))
        if t['pickupAt'] is not None:
            pk.append(t['pickupAt']); early += sum(1 for k in kinds[:t['pickupAt']] if k == 'b')
    print(f'  order: blocks before the first other action {sum(firstNon) / max(1, len(firstNon)):.1f}; ball picked up after {sum(pk) / max(1, len(pk)):.1f} actions (in {pct(len(pk), n)} of turns), with {early / max(1, len(pk)):.1f} blocks before it')
    print(f"  in contact at the end: {sum(1 for v in P if v.get('contact1')) / n:.1f} players a turn")

if __name__ == '__main__':
    main()
