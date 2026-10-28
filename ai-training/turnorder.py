#!/usr/bin/env python3
"""The order of a turn: each player's activation labelled by its risk (free: no dice; block: a block or blitz;
dodge/rush: a move with a dodge or Rush; ball: a pick-up, pass, hand-off or catch; foul), where each kind comes in
the turn, and when a turn ends in a turnover, how many team-mates still hadn't acted.

  python3 ai-training/turnorder.py                 (the FUMBBL replays)
  python3 ai-training/turnorder.py --bb bb.json    (from bb-turnorder.js: the BludBowl computer)
"""
import argparse, collections, gzip, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
REP = os.path.join(HERE, 'data', 'fumbbl-replays')
def changes(c): return (c.get('modelChangeList') or {}).get('modelChangeArray', []) or []
def reports(c): return (c.get('reportList') or {}).get('reports', []) or []
SKILL_RR = {'Dodge', 'Sure Hands', 'Pro', 'Sure Feet', 'Catch', 'Pass', 'Brawler'}

def label(a):
    if a.get('foul'): return 'foul'
    if a.get('ball'): return 'ball:' + a.get('bk', '?')
    if a.get('blocks'): return 'block'
    if a.get('dodges') or a.get('rushes'): return 'dodge/rush'
    return 'free'

def turns_fumbbl(fn, meta):
    d = json.load(gzip.open(fn)); g = d['game']
    team, skills = {}, {}
    for side in ('teamHome', 'teamAway'):
        for p in g[side]['playerArray']: team[str(p['playerId'])] = side; skills[str(p['playerId'])] = {x if isinstance(x, str) else x.get('skillName', '') for x in p.get('skillArray', [])}
    at, st = {}, {}; out = []; acts = []; actSide = None; last = None; kicked = False
    onp = lambda q: at.get(q) and 0 <= at[q][0] <= 25 and 0 <= at[q][1] <= 14
    for cmd in d['gameLog']['commandArray']:
        for m in changes(cmd):
            k, v = m['modelChangeId'], m.get('modelChangeValue')
            if k == 'fieldModelSetPlayerCoordinate': at[str(m['modelChangeKey'])] = v
            elif k == 'fieldModelSetPlayerState' and isinstance(v, int): st[str(m['modelChangeKey'])] = v
        for r in reports(cmd):
            rid = r['reportId']
            if rid == 'kickoffResult': acts = []; actSide = None; continue
            if rid == 'playerAction' and str(r.get('actingPlayerId')) in team:
                pid = str(r['actingPlayerId'])
                if actSide and team[pid] != actSide: acts = []   # (a Blitz! kick-off's free turn, or the like)
                actSide = team[pid]
                if not acts or acts[-1]['pid'] != pid:
                    acts.append({'pid': pid, 'blocks': 0, 'dodges': 0, 'rushes': 0, 'ball': 0, 'foul': 0, 'action': r.get('playerAction')})
                a = acts[-1]
                if r.get('playerAction') in ('pass', 'handOver', 'handOff', 'throwTeamMate', 'secureTheBall'): a['ball'] = 1; a['bk'] = {'pass': 'pass', 'handOver': 'hand-off', 'handOff': 'hand-off', 'throwTeamMate': 'ttm', 'secureTheBall': 'pick-up'}[r.get('playerAction')]
                if r.get('playerAction') == 'foul': a['foul'] = 1
                last = None; continue
            if not acts: continue
            a = acts[-1]
            if rid in ('dodgeRoll', 'goForItRoll', 'pickUpRoll', 'passRoll', 'catchRoll', 'jumpRoll', 'leapRoll'):
                if str(r.get('playerId')) == a['pid']:
                    if rid == 'dodgeRoll': a['dodges'] += 1
                    elif rid == 'goForItRoll': a['rushes'] += 1
                    elif rid in ('pickUpRoll', 'passRoll'):
                        a['ball'] = 1; a.setdefault('bk', 'pick-up' if rid == 'pickUpRoll' else 'pass')
                if team.get(str(r.get('playerId'))) == actSide: last = ('roll', r.get('successful'))
            elif rid == 'blockChoice':
                a['blocks'] += 1
                res = r.get('blockResult', '')
                atkDown = res == 'SKULL' or (res == 'BOTH DOWN' and 'Block' not in skills.get(a['pid'], set()))
                last = ('block', not atkDown)
            elif rid == 'foul': a['foul'] = 1; last = ('foul', True)
            elif rid == 'referee' and r.get('foulingPlayerBanned'): last = ('foul', False)
            elif rid == 'reRoll': last = None
            elif rid == 'turnEnd':
                if acts and actSide:
                    turnover = bool(last and last[1] is False)
                    actedIds = {x['pid'] for x in acts}
                    left = sum(1 for q in at if q in team and team[q] == actSide and onp(q) and q not in actedIds and (st.get(q, 1) & 0xFF) in (1, 2, 3))
                    out.append({'race': meta['home' if actSide == 'teamHome' else 'away']['race'], 'acts': [label(x) for x in acts], 'turnover': turnover, 'left': left if turnover else None})
                acts = []; actSide = None; last = None
    return out

def summary(lab, T):
    pct = lambda a, b: f'{100 * a / b:.0f}%' if b else '-'
    T = [t for t in T if len(t['acts']) >= 3]
    pb = collections.defaultdict(list)
    for t in T:
        for i, k in enumerate(t['acts']):
            if k.startswith('ball'): pb[k].append(i / (len(t['acts']) - 1))
    print(f'\n{lab}: ball actions by kind (how many a turn, where in the turn): ' + '  '.join(f'{k[5:]} {len(v) / len(T):.2f} at {sum(v) / len(v):.2f}' for k, v in sorted(pb.items(), key=lambda x: -len(x[1]))))
    for t in T: t['acts'] = ['ball' if k.startswith('ball') else k for k in t['acts']]
    kinds = ['free', 'block', 'dodge/rush', 'ball', 'foul']
    print(f'\n{lab}: {len(T)} turns (3+ players acting)')
    n = collections.Counter(k for t in T for k in t['acts']); tot = sum(n.values())
    print('  activations: ' + '  '.join(f'{k} {pct(n[k], tot)}' for k in kinds) + f'  ({tot / len(T):.1f} a turn)')
    # where in the turn each kind comes: 0 = first, 1 = last
    pos = collections.defaultdict(list)
    for t in T:
        L = len(t['acts'])
        for i, k in enumerate(t['acts']): pos[k].append(i / (L - 1))
    print('  where in the turn (0 first, 1 last): ' + '  '.join(f'{k} {sum(pos[k]) / max(1, len(pos[k])):.2f}' for k in kinds))
    # turn thirds: what's done in the first, middle and last third
    for third, (lo, hi) in (('first third', (0, 1 / 3)), ('middle', (1 / 3, 2 / 3)), ('last third', (2 / 3, 1.01))):
        c = collections.Counter(k for t in T for i, k in enumerate(t['acts']) if lo <= i / len(t['acts']) < hi); s = sum(c.values())
        print(f'    {third:12} ' + '  '.join(f'{k} {pct(c[k], s)}' for k in kinds))
    # free moves left until after the risky ones?
    fr = [t for t in T if 'free' in t['acts'] and any(k in ('dodge/rush', 'ball') for k in t['acts'])]
    after = sum(1 for t in fr if max(i for i, k in enumerate(t['acts']) if k == 'free') > min(i for i, k in enumerate(t['acts']) if k in ('dodge/rush', 'ball')))
    print(f"  turns with both free moves and a dodge/rush or ball action: {len(fr)}; some free move still to come after the first risky one: {pct(after, len(fr))}")
    to = [t for t in T if t['turnover']]
    print(f"  turnovers: {pct(len(to), len(T))} of turns; team-mates who hadn't acted yet when it happened: {sum(t['left'] for t in to) / max(1, len(to)):.1f}" +
          f"; the turnover came with {sum(len(t['acts']) for t in to) / max(1, len(to)):.1f} players acted")
    c = collections.Counter(t['acts'][-1] for t in to); s = sum(c.values())
    print('  what the turnover was: ' + '  '.join(f'{k} {pct(c[k], s)}' for k in kinds))

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--bb', action='append', default=[]); a = ap.parse_args()
    for f in a.bb: summary(f'BludBowl computer ({os.path.basename(f)})', json.load(open(f)))
    if a.bb: return
    index = json.load(open(os.path.join(REP, 'index.json'))); T = []
    for e in index:
        fn = os.path.join(REP, f"{e['replay']}.json.gz")
        if os.path.exists(fn): T += turns_fumbbl(fn, e)
    summary('FUMBBL top coaches', T)

if __name__ == '__main__':
    main()
