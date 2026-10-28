#!/usr/bin/env python3
"""Where the carrier's team-mates stand relative to the opponents who could get at the carrier next turn: towards them,
off to the side, or on the far side; and how many of the squares next to the carrier an opponent could reach are
left open (a way in for a blitz). Reads the --json output of fumbbl-cages.py and/or bb-cages.js.

  python3 ai-training/screen-sides.py fu.json [bb.json ...]
"""
import json, math, sys, collections

def reach(o, sq):   # can opponent o reach square sq next turn (as the crow flies, with two Rushes; standing up costs 3)
    return max(abs(o[0] - sq[0]), abs(o[1] - sq[1])) <= (o[2] + 2 if o[3] else o[2] - 1)

def analyse(r):
    w = r.get('raw')
    if not w: return None
    cx, cy = w['car']; mates = [tuple(m) for m in w['mates']]; opps = w['opps']
    adjSq = [(cx + dx, cy + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if (dx or dy) and 0 <= cx + dx <= 25 and 0 <= cy + dy <= 14]
    occupied = set(mates) | {(o[0], o[1]) for o in opps}
    threats = [o for o in opps if any(reach(o, s) for s in adjSq)]
    # the direction they come from: the mean of the unit vectors from the carrier to each threat
    vx = vy = 0
    for o in threats:
        dx, dy = o[0] - cx, o[1] - cy; n = math.hypot(dx, dy) or 1; vx += dx / n; vy += dy / n
    n = math.hypot(vx, vy)
    out = {'threats': len(threats), 'open': sum(1 for s in adjSq if s not in occupied and any(reach(o, s) for o in threats)),
           'reachable': sum(1 for s in adjSq if any(reach(o, s) for o in threats)), 'blocked': sum(1 for s in adjSq if s in set(mates) and any(reach(o, s) for o in threats)),
           'toward': 0, 'side': 0, 'away': 0, 'n3': 0, 'fwd': 0, 'back': 0, 'focused': n / max(1, len(threats)), 'kept': r.get('kept', True)}
    for m in mates:
        d = max(abs(m[0] - cx), abs(m[1] - cy))
        if d > 3: continue
        out['n3'] += 1
        if any(o[3] and max(abs(o[0] - m[0]), abs(o[1] - m[1])) == 1 for o in opps): out['marked'] = out.get('marked', 0) + 1
        out['d%d' % d] = out.get('d%d' % d, 0) + 1
        mx, my = m[0] - cx, m[1] - cy
        f = mx * w['dir']
        out['fwd' if f > 0 else 'back' if f < 0 else 'side'] += 0   # (placeholder, counted below)
        if f > 0: out['fwd'] += 1
        elif f < 0: out['back'] += 1
        if n < 0.5 or not threats: continue   # threats all round (or none): no side to favour
        cos = (mx * vx + my * vy) / (math.hypot(mx, my) * n)
        out['toward' if cos > 0.35 else 'away' if cos < -0.35 else 'side'] += 1
    return out

def report(lab, R):
    A = [a for a in (analyse(r) for r in R) if a]
    dirn = [a for a in A if a['threats'] and a['focused'] >= 0.5]   # threats mostly from one side
    pct = lambda x, y: f'{100 * x / y:.0f}%' if y else '-'
    tw, sd, aw = (sum(a[k] for a in dirn) for k in ('toward', 'side', 'away'))
    print(f'\n{lab}: {len(A)} turns ending with our carrier standing')
    print(f"  opponents who could get next to the carrier next turn: {sum(a['threats'] for a in A) / len(A):.1f}; their side is clear-cut in {pct(len(dirn), len(A))} of turns")
    print(f"  team-mates within 3, in those turns: towards the threat {pct(tw, tw + sd + aw)}, off to the side {pct(sd, tw + sd + aw)}, on the far side {pct(aw, tw + sd + aw)}  ({(tw + sd + aw) / max(1, len(dirn)):.1f} a turn)")
    fw, bk = sum(a['fwd'] for a in A), sum(a['back'] for a in A); n3 = sum(a['n3'] for a in A)
    print(f"  team-mates within 3: ahead of the carrier (towards the end zone) {pct(fw, n3)}, level {pct(n3 - fw - bk, n3)}, behind {pct(bk, n3)}")
    print(f"  team-mates within 3 standing next to an opponent: {pct(sum(a.get('marked', 0) for a in A), n3)}; at distance 1 / 2 / 3: " + ' / '.join(f"{sum(a.get('d%d' % k, 0) for a in A) / len(A):.2f}" for k in (1, 2, 3)))
    ra = sum(a['reachable'] for a in A); bl = sum(a['blocked'] for a in A); op = sum(a['open'] for a in A)
    print(f"  squares next to the carrier an opponent could reach: {ra / len(A):.1f} a turn; filled by our players {pct(bl, ra)}; left open {op / len(A):.1f} a turn")
    lost = lambda rs: sum(1 for a in rs if not a['kept'])
    print('  ball lost next turn by open ways in: ' + '  '.join(f"{k}{'+' if k == 4 else ''}: {pct(lost(rs), len(rs))} ({len(rs)})" for k in range(5) for rs in [[a for a in A if (a['open'] >= 4 if k == 4 else a['open'] == k)]]))
    print('  ...by threats: ' + '  '.join(f"{lo}-{hi}: {pct(lost(rs), len(rs))} ({len(rs)})" for lo, hi in ((0, 0), (1, 2), (3, 4), (5, 7), (8, 11)) for rs in [[a for a in A if lo <= a['threats'] <= hi]]))

if __name__ == '__main__':
    for i, f in enumerate(sys.argv[1:]): report('FUMBBL top coaches' if i == 0 and 'fu' in f else f, json.load(open(f)))
