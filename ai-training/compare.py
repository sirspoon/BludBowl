# Compares FUMBBL top-coach stats with BludBowl computer-v-computer stats, per team per match.
#   python3 ai-training/compare.py [--fumbbl data/fumbbl-top-coaches.jsonl.gz] [--bb data/bludbowl-v3.04.jsonl.gz] [--races] [--mincr 1550]
# --races adds a table per team. Files may be plain .jsonl or .jsonl.gz.
import json, re, sys, os, gzip, collections
HERE = os.path.dirname(os.path.abspath(__file__))
def opt(k, d):
    return sys.argv[sys.argv.index('--' + k) + 1] if '--' + k in sys.argv else d
def load(p):
    p = p if os.path.exists(p) else os.path.join(HERE, p)
    with (gzip.open(p, 'rt') if p.endswith('.gz') else open(p)) as f: return [json.loads(l) for l in f if l.strip()]
MINCR = float(opt('mincr', 0))
FUM = [d for d in load(opt('fumbbl', 'data/fumbbl-top-coaches.jsonl.gz'))
       if min(((d['match'][t].get('coach') or {}).get('rating') or {}).get('pre', {}).get('cr', 0) for t in ('team1', 'team2')) >= MINCR]
BB = [d for d in load(opt('bb', 'data/bludbowl-v3.04.jsonl.gz')) if not d.get('stalled') and not d.get('unfinished')]
RACE = {'Amazon': 'amazon', 'Black Orc': 'blackorc', 'Bretonnian': 'bretonnian', 'Chaos Chosen': 'chaoschosen', 'Chaos Dwarf': 'chaosdwarf', 'Chaos Renegade': 'renegades',
 'Dark Elf': 'darkelf', 'Dwarf': 'dwarf', 'Elven Union': 'elvenunion', 'Gnome': 'gnome', 'Goblin': 'goblin', 'Halfling': 'halfling', 'High Elf': 'highelf', 'Human': 'human',
 'Imperial Nobility': 'imperial', 'Khorne': 'khorne', 'Lizardmen': 'lizardmen', 'Necromantic Horror': 'necromantic', 'Norse': 'norse', 'Nurgle': 'nurgle', 'Ogre': 'ogre',
 'Old World Alliance': 'oldworld', 'Orc': 'orc', 'Shambling Undead': 'undead', 'Skaven': 'skaven', 'Snotling': 'snotling', 'Tomb Kings': 'tombkings', 'Underworld Denizens': 'underworld',
 'Vampire': 'vampire', 'Wood Elf': 'woodelf'}
def tcat(s):
    s = s.lower()
    for k, v in [('go for it', 'Rush'), ('rushing', 'Rush'), ('secure', 'Pick-up'), ('block', 'Block'), ('attacker down', 'Block'), ('both down', 'Block'), ('dodge', 'Dodge'), ('go for it', 'Rush'), ('rush', 'Rush'), ('pick', 'Pick-up'), ('pass', 'Pass'), ('fumble', 'Pass'),
                 ('catch', 'Catch'), ('hand', 'Hand-off'), ('foul', 'Foul'), ('sent off', 'Foul'), ('steady', 'Rush'), ('landing', 'Landing'), ('jump', 'Dodge'), ('leap', 'Dodge')]:
        if k in s: return v
    return 'Other'
rows = []   # one row per team per match
for d in FUM:
    m, st = d['match'], d['stats']
    for side, tk, ok in (('home', 'team1', 'team2'), ('away', 'team2', 'team1')):
        s, t, o = st[side], m[tk], m[ok]
        dod = {k: s['successfulDodgeRolls'].get(k, 0) + s['failedDodgeRolls'].get(k, 0) for k in ('2+', '3+', '4+', '5+', '6+')}
        gfi = sum(s['successfulGfiRolls'].values()) + sum(s['failedGfiRolls'].values())
        tb = s['totalBlocks']
        perf = t.get('performances') or {}
        rows.append(dict(src='FUMBBL', race=RACE.get(t['roster']['name'], t['roster']['name']), td=t['score'], ag=o['score'],
            cas=sum(1 for x in s['causedInjuries'] if x['state'] != 'KO'), dodges=sum(dod.values()), dodge_hard=dod['4+'] + dod['5+'] + dod['6+'], dodge_3=dod['3+'],
            dodge_fail=sum(s['failedDodgeRolls'].values()), rush=gfi, rush_fail=sum(s['failedGfiRolls'].values()),
            blocks=sum(tb.values()), b1=tb.get('1', 0), b2p=tb.get('2', 0) + tb.get('3', 0), bneg=tb.get('-2', 0) + tb.get('-3', 0),
            tos=len(s['turnOvers']), tocat=collections.Counter(tcat(x['action']) for x in s['turnOvers']),
            rr=s['additionalStats'].get('REROLL', 0), comp=sum(int(p.get('comp', 0)) for p in perf.values()), fouls=sum(int(p.get('fouls', 0)) for p in perf.values()),
            blitz_n=len(s['playerActionMap'].get('BLITZ', []))))
for d in BB:
    for t in (0, 1):
        R = [r for r in d['rolls'] if r['team'] == t]
        dod = [r for r in R if r['type'] == 'DODGE']; gfi = [r for r in R if r['type'] == 'RUSH']
        B = [b for b in d['blocks'] if b['team'] == t]
        TO = [x for x in d['tos'] if x['team'] == t]
        rows.append(dict(src='BludBowl', race=d['races'][t], td=d['score'][t], ag=d['score'][1 - t], cas=d['cas'][t],
            dodges=len(dod), dodge_hard=sum(r['target'] >= 4 for r in dod), dodge_3=sum(r['target'] == 3 for r in dod), dodge_fail=sum(r.get('ok') is False for r in dod),
            rush=len(gfi), rush_fail=sum(r.get('ok') is False for r in gfi),
            blocks=len(B), b1=sum(b['dice'] == 1 for b in B), b2p=sum(b['dice'] >= 2 and b['own'] for b in B), bneg=sum(b['dice'] >= 2 and not b['own'] for b in B),
            tos=len(TO), tocat=collections.Counter(tcat(x['reason']) for x in TO), rr=sum(1 for x in d['rr'] if x['team'] == t),
            comp=sum(1 for r in R if r['type'] == 'PASS' and r.get('ok')), fouls=None, blitz_n=sum(b['blitz'] for b in B)))
def avg(rs, k):
    v = [r[k] for r in rs if r[k] is not None]; return sum(v) / len(v) if v else float('nan')
def table(rs_by_src, title):
    print(f'\n== {title}')
    keys = [('td', 'Touchdowns'), ('cas', 'Casualties caused'), ('blocks', 'Blocks thrown'), ('b1', '  1-die blocks'), ('bneg', '  blocks where opponent picks'),
            ('dodges', 'Dodges tried'), ('dodge_3', '  at 3+'), ('dodge_hard', '  at 4+ or harder'), ('rush', 'Rushes (GFI) tried'), ('tos', 'Turnovers'), ('rr', 'Team re-rolls used'), ('comp', 'Passes (accurate / completed)')]
    srcs = list(rs_by_src)
    print(f"{'':32}" + ''.join(f'{s + " (" + str(len(rs_by_src[s])) + ")":>18}' for s in srcs))
    for k, lab in keys: print(f'{lab:32}' + ''.join(f'{avg(rs_by_src[s], k):18.2f}' for s in srcs))
    for s in srcs:
        c = collections.Counter(); [c.update(r['tocat']) for r in rs_by_src[s]]; n = sum(c.values()) or 1
        print(f'  turnover causes {s}: ' + ', '.join(f'{k} {100 * v / n:.0f}%' for k, v in c.most_common(7)))
by = collections.defaultdict(list)
for r in rows: by[r['src']].append(r)
table(by, 'All teams, per team per match')
if '--races' in sys.argv:
    for race in sorted({r['race'] for r in rows}):
        g = {s: [r for r in by[s] if r['race'] == race] for s in by}
        if all(len(v) >= 3 for v in g.values()): table(g, race)
print('\nFUMBBL: %d matches, BludBowl: %d matches' % (len(FUM), len(BB)))
