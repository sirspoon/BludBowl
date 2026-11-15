# How often each race wins: FUMBBL's Competitive division (BB2025) against BludBowl's AI playing itself.
#   python3 compare.py fumbbl-matches.json ai-roundrobin.jsonl [--md out.md]
# fumbbl-matches.json: from pull_fumbbl.py (FUMBBL's /api/match/list). ai-roundrobin.jsonl: tools/ai-match.js --pairs (every
# pairing) --out. A draw counts as half a win; mirror matches are left out. "Starting TV" keeps FUMBBL matches where both teams
# have a team value of 1,150k or less, the nearest to the AI's starting rosters.
import json, sys, math, collections
NAMES = {'Amazon': 'amazon', 'Black Orc': 'blackorc', 'Bretonnian': 'bretonnian', 'Chaos Chosen': 'chaoschosen', 'Chaos Dwarf': 'chaosdwarf',
  'Chaos Renegade': 'renegades', 'Dark Elf': 'darkelf', 'Dwarf': 'dwarf', 'Elven Union': 'elvenunion', 'Gnome': 'gnome', 'Goblin': 'goblin',
  'Halfling': 'halfling', 'High Elf': 'highelf', 'Human': 'human', 'Imperial Nobility': 'imperial', 'Khorne': 'khorne', 'Lizardmen': 'lizardmen',
  'Necromantic Horror': 'necromantic', 'Norse': 'norse', 'Nurgle': 'nurgle', 'Ogre': 'ogre', 'Old World Alliance': 'oldworld', 'Orc': 'orc',
  'Shambling Undead': 'undead', 'Skaven': 'skaven', 'Snotling': 'snotling', 'Tomb Kings': 'tombkings', 'Underworld Denizens': 'underworld',
  'Vampire': 'vampire', 'Wood Elf': 'woodelf'}
PRETTY = {v: k for k, v in NAMES.items()}

def tally(games):   # games: (raceA, raceB, scoreA, scoreB)
    t = collections.defaultdict(lambda: [0, 0, 0, 0, 0])   # W D L TDfor TDagainst
    for a, b, sa, sb in games:
        if a == b: continue
        for x, y, s1, s2 in ((a, b, sa, sb), (b, a, sb, sa)):
            r = t[x]; r[0 if s1 > s2 else 1 if s1 == s2 else 2] += 1; r[3] += s1; r[4] += s2
    return t
def rate(r):
    n = r[0] + r[1] + r[2]
    return (r[0] + 0.5 * r[1]) / n if n else float('nan'), n
def spearman(xs, ys):
    rk = lambda v: {k: i for i, k in enumerate(sorted(v, key=v.get))}
    a, b = rk(xs), rk(ys); ks = [k for k in xs if k in ys]; n = len(ks)
    return 1 - 6 * sum((a[k] - b[k]) ** 2 for k in ks) / (n * (n * n - 1))

fum = [m for m in json.load(open(sys.argv[1])) if m.get('div') == 'Competitive' and m['r1'] in NAMES and m['r2'] in NAMES]
f_all = tally([(NAMES[m['r1']], NAMES[m['r2']], m['s1'], m['s2']) for m in fum])
low = [m for m in fum if (m.get('tv1') or 9e9) <= 1150000 and (m.get('tv2') or 9e9) <= 1150000]
f_low = tally([(NAMES[m['r1']], NAMES[m['r2']], m['s1'], m['s2']) for m in low])
ai_rows = [json.loads(l) for l in open(sys.argv[2]) if l.strip()]
ai_rows = [r for r in ai_rows if r.get('over') and not r.get('errs')]
ai = tally([(r['a'], r['b'], r['score'][0], r['score'][1]) for r in ai_rows])

F = {k: rate(v)[0] for k, v in f_all.items()}; L = {k: rate(v)[0] for k, v in f_low.items() if rate(v)[1] >= 30}; A = {k: rate(v)[0] for k, v in ai.items()}
dates = sorted(m['date'] for m in fum)
lines = [f'FUMBBL Competitive: {len(fum)} matches, {dates[0]} to {dates[-1]} (starting-TV cut: {len(low)}). BludBowl AI round robin: {len(ai_rows)} matches.', '',
         '| Race | FUMBBL win % (games) | FUMBBL starting TV | AI win % (games) | AI minus FUMBBL | TDs a game: FUMBBL / AI |', '| --- | ---: | ---: | ---: | ---: | ---: |']
for k in sorted(A, key=lambda k: -F.get(k, 0)):
    fr, fn = rate(f_all[k]); lr, ln = rate(f_low[k]); ar, an = rate(ai[k])
    se = math.sqrt(ar * (1 - ar) / an) if an else 0
    ftd = f_all[k][3] / fn if fn else 0; atd = ai[k][3] / an if an else 0
    lines.append(f"| {PRETTY[k]} | {fr*100:.0f}% ({fn}) | {'%.0f%% (%d)' % (lr*100, ln) if ln >= 30 else '–'} | {ar*100:.0f}% ±{se*100:.0f} ({an}) | {(ar-fr)*100:+.0f} | {ftd:.2f} / {atd:.2f} |")
lines += ['', f'Rank agreement (Spearman, 1 = same order): AI v FUMBBL all {spearman(A, F):.2f}; AI v FUMBBL starting TV {spearman({k: A[k] for k in L}, L):.2f}; FUMBBL starting TV v all {spearman({k: F[k] for k in L}, L):.2f}.']
spread = lambda d: (max(d.values()) - min(d.values())) * 100
lines.append(f'Spread between best and worst race: FUMBBL {spread(F):.0f} points, AI {spread(A):.0f} points.')
out = '\n'.join(lines); print(out)
if '--md' in sys.argv: open(sys.argv[sys.argv.index('--md') + 1], 'w').write(out + '\n')
