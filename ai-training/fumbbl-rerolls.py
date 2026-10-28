#!/usr/bin/env python3
"""Team re-rolls in the downloaded FUMBBL replays: what they're spent on, when (turn of the half, how far into the turn,
how many are left), and which failed rolls are left alone with one available. A "decision" is a failed roll by the
side whose turn it is, not rescued by a skill (Dodge, Sure Hands, Pro...), with a team re-roll still unused this turn.

  python3 ai-training/fumbbl-rerolls.py [--json out.json]
  python3 ai-training/fumbbl-rerolls.py --bb bb.json      (from bb-rerolls.js: the BludBowl computer, the same way)
"""
import argparse, collections, gzip, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
REP = os.path.join(HERE, 'data', 'fumbbl-replays')
def changes(c): return (c.get('modelChangeList') or {}).get('modelChangeArray', []) or []
def reports(c): return (c.get('reportList') or {}).get('reports', []) or []
KIND = {'dodgeRoll': 'dodge', 'goForItRoll': 'rush', 'pickUpRoll': 'pick-up', 'catchRoll': 'catch', 'passRoll': 'pass', 'confusionRoll': 'Bone Head etc.',
        'jumpRoll': 'jump', 'leapRoll': 'jump', 'standUpRoll': 'stand up', 'jumpUpRoll': 'stand up', 'interceptionRoll': 'interception', 'throwTeamMateRoll': 'throw team-mate',
        'landingRoll': 'landing', 'rightStuffRoll': 'landing', 'handOver': 'hand-off', 'animosityRoll': 'Bone Head etc.', 'bloodLustRoll': 'Bone Head etc.', 'hypnoticGazeRoll': 'gaze', 'foulAppearanceRoll': 'Bone Head etc.'}
TEAM = {'Team ReRoll', 'Leader', 'Brilliant Coaching ReRoll', 'Team Captain'}

def blockCat(dice, ours, atk, dfn):
    # what the first roll of a block gives the blocking side: 'down' (the attacker goes over), 'nothing' (no knockdown), 'kd'
    def face(f):
        if f == 1: return 0
        if f == 2: return (2 if 'Block' not in dfn else 1) if 'Block' in atk else 0
        if f in (3, 4): return 1
        if f == 5: return 2 if ('Dodge' not in dfn or 'Tackle' in atk) else 1
        return 2
    vals = [face(f) for f in dice] or [1]
    v = max(vals) if ours else min(vals)
    return ['down', 'nothing', 'kd'][v]

def events(fn, meta):
    d = json.load(gzip.open(fn)); g = d['game']
    team, skills = {}, {}
    for side in ('teamHome', 'teamAway'):
        for p in g[side]['playerArray']: team[str(p['playerId'])] = side; skills[str(p['playerId'])] = {x if isinstance(x, str) else x.get('skillName', '') for x in p.get('skillArray', [])}
    teamId = {g['teamHome']['teamId']: 'teamHome', g['teamAway']['teamId']: 'teamAway'}; cur = None; defender = None; curAct = None
    at, ball, rr = {}, None, {'home': 0, 'away': 0}; out = []; acts = []; actSide = None; usedThisTurn = False
    turn = {'home': 0, 'away': 0}; pend = None; blk = None; halfEnd = []
    key = lambda side: 'home' if side == 'teamHome' else 'away'
    def close(rerolledBy):
        nonlocal pend
        if pend:
            pend['rerolled'] = rerolledBy; out.append(pend); pend = None
    for cmd in d['gameLog']['commandArray']:
        for m in changes(cmd):
            k, v = m['modelChangeId'], m.get('modelChangeValue')
            if k == 'fieldModelSetPlayerCoordinate': at[str(m['modelChangeKey'])] = v
            elif k == 'fieldModelSetBallCoordinate': ball = v if isinstance(v, list) else None
            elif k == 'turnDataSetReRolls': rr[m['modelChangeKey']] = v
            elif k == 'turnDataSetTurnNr': turn[m['modelChangeKey']] = v
            elif k == 'gameSetHalf': halfEnd.append(dict(rr))
        for r in reports(cmd):
            rid = r['reportId']
            if rid == 'playerAction' and str(r.get('actingPlayerId')) in team:
                actSide = team[str(r['actingPlayerId'])]; pid = str(r['actingPlayerId']); cur = pid; curAct = r.get('playerAction')
                if not acts or acts[-1] != pid: acts.append(pid)
                continue
            if rid == 'reRoll':
                src = r.get('reRollSource')
                if pend and str(r.get('playerId')) == pend['pid']: close(src)
                if blk and src in TEAM: blk['trr'] = True
                if src in TEAM: usedThisTurn = True
                continue
            if rid == 'turnEnd':
                close(None)
                if acts and actSide: pass
                acts = []; usedThisTurn = False; blk = None; continue
            if rid == 'block': defender = str(r.get('defenderId'))
            if rid == 'blockRoll' and actSide:
                close(None)
                if blk: continue   # the same block's dice, rolled again after a re-roll
                cat = blockCat(r.get('blockRoll') or [], teamId.get(r.get('choosingTeamId')) == actSide, skills.get(cur, set()), skills.get(defender, set()))
                blk = {'cat': cat, 'nd': len(r.get('blockRoll') or []), 'defCarrier': bool(ball and defender in at and at[defender] == ball), 'blitz': curAct in ('blitz', 'blitzMove'), 'atkCarrier': bool(ball and cur in at and at[cur] == ball), 'kind': 'block', 'side': actSide, 'trr': False, 'turn': turn[key(actSide)], 'rr': rr[key(actSide)], 'act': len(acts), 'avail': rr[key(actSide)] > 0 and not usedThisTurn}
                continue
            if rid == 'blockChoice' and blk:
                res = r.get('blockResult', '')
                blk['bad'] = res in ('SKULL', 'BOTH DOWN'); blk['res'] = res; blk['race'] = meta[key(blk['side'])]['race']
                out.append(blk); blk = None; continue
            if rid in KIND and 'successful' in r:
                close(None)   # (a roll we were holding wasn't re-rolled)
                pid = str(r.get('playerId')); side = team.get(pid)
                if r.get('successful') or r.get('reRolled') or side != actSide: continue
                carrier = bool(ball and at.get(pid) == ball)
                pend = {'kind': KIND[rid], 'pid': pid, 'side': side, 'race': meta[key(side)]['race'], 'turn': turn[key(side)], 'rr': rr[key(side)], 'act': len(acts),
                        'avail': rr[key(side)] > 0 and not usedThisTurn, 'carrier': carrier or rid in ('pickUpRoll', 'catchRoll', 'passRoll')}
        close(None) if False else None
    close(None)
    return out, halfEnd

def summary(lab, E, unusedAtHalf=None, matches=None):
    pct = lambda a, b: f'{100 * a / b:.0f}%' if b else '-'
    rolls = [e for e in E if e['kind'] != 'block']; blocks = [e for e in E if e['kind'] == 'block']
    dec = [e for e in rolls if e['avail'] and e['rerolled'] not in ('Dodge', 'Sure Hands', 'Pro', 'Sure Feet', 'Catch', 'Pass', 'Brawler', 'Unstoppable Momentum', 'Hail Mary Pass')]
    used = [e for e in dec if e['rerolled'] in TEAM]
    bu = [b for b in blocks if b['trr']]
    print(f'\n{lab}')
    if matches: print(f'  team re-rolls used a team a match: {(len(used) + len(bu)) / matches / 2:.2f} (on rolls {len(used) / matches / 2:.2f}, on block dice {len(bu) / matches / 2:.2f})' + (f'; left unused at the end of a half {unusedAtHalf:.2f}' if unusedAtHalf is not None else ''))
    print(f'  failed rolls with a team re-roll available: {len(dec)}, re-rolled {pct(len(used), len(dec))}')
    print(f"  (the splits below leave out Bone Head and the like: {sum(1 for e in dec if e['kind'] == 'Bone Head etc.')} of them, re-rolled {pct(sum(1 for e in dec if e['kind'] == 'Bone Head etc.' and e['rerolled'] in TEAM), sum(1 for e in dec if e['kind'] == 'Bone Head etc.'))})")
    dec = [e for e in dec if e['kind'] != 'Bone Head etc.']
    by = lambda f, keys: '  '.join(f"{k}: {pct(sum(1 for e in dec if f(e) == k and e['rerolled'] in TEAM), sum(1 for e in dec if f(e) == k))} ({sum(1 for e in dec if f(e) == k)})" for k in keys)
    ks = [k for k, _ in collections.Counter(e['kind'] for e in dec).most_common(8)]
    print('  by roll:      ' + by(lambda e: e['kind'], ks))
    print('  by turn:      ' + by(lambda e: '1-2' if e['turn'] <= 2 else '3-4' if e['turn'] <= 4 else '5-6' if e['turn'] <= 6 else '7-8', ['1-2', '3-4', '5-6', '7-8']))
    print('  by re-rolls left: ' + by(lambda e: min(e['rr'], 4), [1, 2, 3, 4]) + '  (4 = 4+)')
    print('  by place in the turn (players already acted): ' + by(lambda e: '0-1' if e['act'] <= 1 else '2-4' if e['act'] <= 4 else '5-7' if e['act'] <= 7 else '8+', ['0-1', '2-4', '5-7', '8+']))
    print('  ball at stake (carrier, pick-up, catch, pass): ' + by(lambda e: 'yes' if e['carrier'] else 'no', ['yes', 'no']))
    sp = collections.Counter(e['kind'] for e in used) + collections.Counter('block dice' for _ in bu); tot = sum(sp.values())
    print('  what they were spent on: ' + '  '.join(f'{k} {pct(v, tot)}' for k, v in sp.most_common(8)))
    bad = [b for b in blocks if b.get('bad')]; badAvail = [b for b in blocks if b['avail'] and b['trr']]
    for c in ('down', 'nothing', 'kd'):
        bs = [b for b in blocks if b.get('cat') == c and b['avail']]
        print(f"  blocks whose first roll was '{c}' (a team re-roll available): {len(bs)}, re-rolled {pct(sum(1 for b in bs if b['trr']), len(bs))}" + (f"; by dice 1/2/3: " + ' / '.join(pct(sum(1 for b in bs if b['trr'] and b.get('nd') == n), sum(1 for b in bs if b.get('nd') == n)) for n in (1, 2, 3)) if c != 'kd' else ''))
    for c in ('down', 'nothing'):
        bs = [b for b in blocks if b.get('cat') == c and b['avail'] and 'defCarrier' in b]
        if not bs: continue
        print(f"    '{c}' re-rolled: against their ball carrier {pct(sum(1 for b in bs if b['trr'] and b['defCarrier']), sum(1 for b in bs if b['defCarrier']))} ({sum(1 for b in bs if b['defCarrier'])}), by our carrier {pct(sum(1 for b in bs if b['trr'] and b['atkCarrier']), sum(1 for b in bs if b['atkCarrier']))} ({sum(1 for b in bs if b['atkCarrier'])}), a blitz {pct(sum(1 for b in bs if b['trr'] and b['blitz']), sum(1 for b in bs if b['blitz']))} ({sum(1 for b in bs if b['blitz'])}), other blocks {pct(sum(1 for b in bs if b['trr'] and not (b['defCarrier'] or b['atkCarrier'] or b['blitz'])), sum(1 for b in bs if not (b['defCarrier'] or b['atkCarrier'] or b['blitz'])))}")
    print(f"  block dice re-rolled with a team re-roll: {len(bu)} of {len(blocks)} blocks ({pct(len(bu), len(blocks))}); blocks ending in a skull or both down: {pct(len(bad), len(blocks))}")

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--json', default=''); ap.add_argument('--bb', action='append', default=[]); a = ap.parse_args()
    for f in a.bb:
        D = json.load(open(f)); summary(f'BludBowl computer ({os.path.basename(f)})', D['events'], D.get('unused'), D.get('matches'))
    if a.bb: return
    index = json.load(open(os.path.join(REP, 'index.json'))); E = []; U = []
    for e in index:
        fn = os.path.join(REP, f"{e['replay']}.json.gz")
        if os.path.exists(fn):
            ev, he = events(fn, e); E += ev; U += he
    if a.json: json.dump(E, open(a.json, 'w'))
    un = [h[k] for h in U[1:] for k in ('home', 'away')]
    summary('FUMBBL top coaches', E, sum(un) / max(1, len(un)), len(index))

if __name__ == '__main__':
    main()
