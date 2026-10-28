#!/usr/bin/env python3
"""How the receiving team's set-up answers the kicking team's (which is set up first). For each kick-off: the receivers'
real set-up against the same set-up mirrored top to bottom, which keeps its shape but undoes any reaction to the kickers.
If the real one does better on a measure than its mirror, the coach is reacting to the kicking set-up.

  python3 ai-training/fumbbl-replays.py ...; python3 ai-training/fumbbl-setups.py --json fu.json
  python3 ai-training/fumbbl-receive.py fu.json [bb.json]     (bb.json from bb-setups.js, for the BludBowl computer)

Both teams are put on one pitch: the receivers' end zone on the left (x 0-12), the kickers' line at x 13.
"""
import collections, json, sys

def pair(S):
    if S and S[0]['replay'] == 'bb':   # bb-setups.js writes each kick-off's two sides one after the other
        out = []
        for i in range(0, len(S) - 1, 2):
            a, b = S[i], S[i + 1]
            if a['kick'] == b['kick'] and a['kicking'] != b['kicking']: out.append((a['players'], b['players']) if a['kicking'] else (b['players'], a['players']))
        return out
    by = collections.defaultdict(dict)
    for s in S: by[(s['replay'], s['kick'], s.get('rep', 0))]['k' if s['kicking'] else 'r'] = s
    return [(v['k']['players'], v['r']['players']) for v in by.values() if 'k' in v and 'r' in v]

def sk(p, s): return s in (p.get('skills') or [])

def measures(K, R):
    """K: kickers (own frame), R: receivers (own frame). Returns a dict of numbers for this kick-off."""
    kk = [dict(p, X=25 - p['x']) for p in K]; rr = [dict(p, X=p['x']) for p in R]
    adj = lambda a, b: max(abs(a['X'] - b['X']), abs(a['y'] - b['y'])) == 1
    tz = lambda q, side: [o for o in side if adj(o, q)]
    def dice(a, d):   # block dice for receiver a on kicker d, counting assists (players not marked by anyone else)
        A = a['st'] + sum(1 for o in rr if o is not a and adj(o, d) and (sk(o, 'Guard') or all(m is d for m in tz(o, kk))))
        D = d['st'] + sum(1 for o in kk if o is not d and adj(o, a) and (sk(o, 'Guard') or all(m is a for m in tz(o, rr))))
        return 3 if A > 2 * D else 2 if A > D else 1 if A == D else -2 if D > 2 * A else -1
    los = [d for d in kk if d['X'] == 13]
    best = []
    for d in los:
        bs = [dice(a, d) for a in rr if adj(a, d)]
        best.append(max(bs) if bs else None)
    eng = [b for b in best if b is not None]
    lane = lambda y: 0 if y <= 3 else 2 if y >= 11 else 1
    kl = collections.Counter(lane(p['y']) for p in kk); rl = collections.Counter(lane(p['y']) for p in rr)
    # strong receivers (ST4+) on the line: is the kicker they face weak (ST3-, no Block)?
    strongR = [a for a in rr if a['X'] == 12 and a['st'] >= 4]
    soft = sum(1 for a in strongR if any(adj(a, d) and d['st'] <= 3 and not sk(d, 'Block') for d in los))
    hard = sum(1 for a in strongR if any(adj(a, d) and (d['st'] >= 4) for d in los))
    emptyWide = [z for z in (0, 2) if kl[z] == 0]
    # how many of us stand next to each of their line players (2+ means one can block with the other's assist)
    nextTo = collections.Counter(min(3, sum(1 for a in rr if adj(a, d))) for d in los)
    # their line players with ST4+ or Guard: do we leave them alone?
    big = [d for d in los if d['st'] >= 4 or sk(d, 'Guard')]
    # rows: where their screen (1-3 back) is thin, are our backfield players (not on the line) there?
    rowsK = [sum(1 for p in kk if 14 <= p['X'] <= 17 and abs(p['y'] - y) <= 1) for y in range(15)]
    rowsR = [sum(1 for p in rr if p['X'] <= 11 and abs(p['y'] - y) <= 1) for y in range(15)]
    mk, mr = sum(rowsK) / 15, sum(rowsR) / 15
    cov = sum((a - mk) * (b - mr) for a, b in zip(rowsK, rowsR)); vk = sum((a - mk) ** 2 for a in rowsK) ** 0.5; vr = sum((b - mr) ** 2 for b in rowsR) ** 0.5
    corr = cov / (vk * vr) if vk and vr else 0
    return {'losK': len(los), 'engaged': len(eng), 'two': sum(1 for b in eng if b >= 2), 'bestMean': sum(eng) / len(eng) if eng else 0,
            'oneOrWorse': sum(1 for b in eng if b <= 1),
            'strongR': len(strongR), 'strongSoft': soft, 'strongHard': hard,
            'emptyWide': len(emptyWide), 'fillEmpty': sum(1 for z in emptyWide if rl[z] > 0),
            'thinSide': (rl[0] - rl[2]) * (1 if kl[0] < kl[2] else -1 if kl[0] > kl[2] else 0),
            'onLine': sum(1 for a in rr if a['X'] == 12), 'n0': nextTo[0], 'n1': nextTo[1], 'n2': nextTo[2], 'n3': nextTo[3],
            'big': len(big), 'bigAlone': sum(1 for d in big if not any(adj(a, d) for a in rr)), 'bigDouble': sum(1 for d in big if sum(1 for a in rr if adj(a, d)) >= 2), 'corr': corr}

def mirror(R): return [dict(p, y=14 - p['y']) for p in R]

def report(lab, S):
    P = pair(S); real = [measures(k, r) for k, r in P]
    # the baseline: each receiving set-up against kicking set-ups from other kick-offs (every 7th, for speed)
    mir = []
    for i, (k, r) in enumerate(P):
        others = [P[j][0] for j in range(len(P)) if j != i and (j - i) % 7 == 0][:12] or [P[(i + 1) % len(P)][0]]
        ms = [measures(o, r) for o in others]
        mir.append({key: sum(m[key] for m in ms) / len(ms) for key in ms[0]})
    t = lambda L, f: sum(f(m) for m in L)
    print(f"\n{lab}: {len(P)} kick-offs (against the kickers they faced v against other kick-offs' kickers)")
    print(f"  kickers' line players a receiver can block on turn 1: {t(real, lambda m: m['engaged']) / len(P):.2f} v {t(mir, lambda m: m['engaged']) / len(P):.2f} (of {t(real, lambda m: m['losK']) / len(P):.1f})")
    print(f"  ...of those, with a 2+ dice block for us: {t(real, lambda m: m['two']) / len(P):.2f} v {t(mir, lambda m: m['two']) / len(P):.2f}")
    sr, sm = t(real, lambda m: m['strongR']), t(mir, lambda m: m['strongR'])
    print(f"  our ST4+ players on the line: {sr / len(P):.2f}; facing a soft kicker (ST3-, no Block) {t(real, lambda m: m['strongSoft']) / max(1, sr):.0%} v {t(mir, lambda m: m['strongSoft']) / max(1, sm):.0%}, "
          f"facing an ST4+ kicker {t(real, lambda m: m['strongHard']) / max(1, sr):.0%} v {t(mir, lambda m: m['strongHard']) / max(1, sm):.0%}")
    ew = t(real, lambda m: m['emptyWide'])
    print(f"  wide zones the kickers left empty: {ew} ; we put someone there {t(real, lambda m: m['fillEmpty']) / max(1, ew):.0%} v {t(mir, lambda m: m['fillEmpty']) / max(1, ew):.0%}")
    print(f"  their line players with 0 / 1 / 2 / 3+ of us next to them: " + ' / '.join(f"{t(real, lambda m, k=k: m[k]) / len(P):.2f} v {t(mir, lambda m, k=k: m[k]) / len(P):.2f}" for k in ('n0', 'n1', 'n2', 'n3')))
    bg = t(real, lambda m: m['big']); bgm = t(mir, lambda m: m['big'])
    print(f"  their ST4+ or Guard line players ({bg / len(P):.2f} a kick-off): left alone {t(real, lambda m: m['bigAlone']) / max(1, bg):.0%} v {t(mir, lambda m: m['bigAlone']) / max(1, bgm):.0%}, two or more of us on them {t(real, lambda m: m['bigDouble']) / max(1, bg):.0%} v {t(mir, lambda m: m['bigDouble']) / max(1, bgm):.0%}")
    print(f"  our backfield by row against their screen by row (correlation, - means we go where they're thin): {t(real, lambda m: m['corr']) / len(P):+.2f} v {t(mir, lambda m: m['corr']) / len(P):+.2f}")
    th = [m['thinSide'] for m in real]
    print(f"  more of us on the kickers' thinner wide side: {sum(1 for x in th if x > 0)}, fewer: {sum(1 for x in th if x < 0)}, level/no thin side: {sum(1 for x in th if x == 0)}")

if __name__ == '__main__':
    report('FUMBBL top coaches', json.load(open(sys.argv[1])))
    if len(sys.argv) > 2: report('BludBowl computer', json.load(open(sys.argv[2])))
