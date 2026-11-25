"""Play against drefsante in BludBowl: a small local web server that runs drefsante's brain (Frederic Bair's Java bot, the Bot
Bowl V winner) for BludBowl's game in your browser.

    python tools/drefsante-server.py --dref E:/python/projects/BloodbowlAI_312/drefsante     (port 8777 by default)

Then open http://127.0.0.1:8777/ (this server serves the game too), set Settings -> Computer coach -> drefsante and start a
match against the computer. The live site (https://sirspoon.github.io/BludBowl/) can use it as well if the browser lets it
reach this computer (Chrome asks), but its saved teams and settings are kept apart from the local copy's. The page asks this
server for each of drefsante's decisions; BludBowl's own rules, dice and screens play them out.

Needs what drefsante's BotBowl bot needs (see its README): Java (JAVA_HOME, or --java), pyjnius, botbowl (only for the skill
numbers), and the drefsante folder with drefsante_bot.cfg (jarPathName, temporaryFolder). drefsante's brain plays the LRB6
rules and knows the 79 older skills; newer BB2025 skills are left out of what it sees.

The Java side is driven exactly as drefsante's own BotBowl bot drives it (drefsante_bot.py): each team written to a file,
updateModel, then one question (playTurn, setup, askWhichDice, ...). Player names are BludBowl's ids plus _home / _away;
squares are (y * 26 + x) with x 0-25 along the pitch, y 0-14 across, as in BludBowl. BludBowl's team 1 is the home team
(scores at x 0), team 0 away, as in BotBowl."""
import argparse, configparser, json, os, sys, threading, traceback
from http.server import BaseHTTPRequestHandler, HTTPServer   # (one thread: the Java side is called from the main thread only)

ap = argparse.ArgumentParser()
ap.add_argument('--dref', default=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'drefsante'),
                help='the drefsante folder (drefsante_bot.cfg, the jar)')
ap.add_argument('--port', type=int, default=8777)
ap.add_argument('--host', default='127.0.0.1', help="the address to listen on: this PC's network address (e.g. 192.168.x.y) lets a phone on the same Wi-Fi play too")
ap.add_argument('--java', default=None, help='JAVA_HOME, if not set already')
ap.add_argument('--verbose', action='store_true')
args = ap.parse_args()

DREF = os.path.abspath(args.dref)
REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))   # (BludBowl, served on GET)
if args.java: os.environ['JAVA_HOME'] = args.java
if not os.environ.get('JAVA_HOME'):
    jdk = os.path.join(os.path.dirname(DREF), 'java')
    if os.path.isdir(jdk):
        sub = [d for d in os.listdir(jdk) if d.startswith('jdk')]
        if sub: os.environ['JAVA_HOME'] = os.path.join(jdk, sub[0])
cfg = configparser.ConfigParser()
cfg.read(os.path.join(DREF, 'drefsante_bot.cfg'))
JAR, TMP = cfg['setup']['jarPathName'], cfg['setup']['temporaryFolder']
os.makedirs(TMP, exist_ok=True)
os.chdir(DREF)   # (the Java side writes bloodbowl.log in the current folder)

import jnius_config
jnius_config.set_classpath('.', JAR)
from jnius import autoclass, JavaClass, MetaJavaClass, JavaMethod
from botbowl.core.table import Skill


class FFAIProxy(JavaClass, metaclass=MetaJavaClass):
    __javaclass__ = 'be/drefsante/bloodbowl/presenter/FFAIProxy'
    updateModel = JavaMethod('(IZIZZLjava/lang/String;Ljava/lang/String;ZLjava/lang/String;)V')
    setup = JavaMethod('(ZZ)Ljava/lang/String;')
    playTurn = JavaMethod('(Ljava/lang/String;)Ljava/lang/String;')
    selectPlayerToGetBall = JavaMethod('()Ljava/lang/String;')
    askWhichDice = JavaMethod('(Ljava/util/List;Ljava/lang/String;Ljava/lang/String;Z)I')
    askOnWhichSquarePushed = JavaMethod('(Ljava/lang/String;Ljava/lang/String;Ljava/util/List;Z)I')
    askToFollow = JavaMethod('(Ljava/lang/String;ILjava/lang/String;)Z')
    selectPlayerForHighKick = JavaMethod('()Ljava/lang/String;')
    selectBallDestinationSquare = JavaMethod('()I')
    askRerollForBlock = JavaMethod('(Ljava/util/List;Ljava/lang/String;Ljava/lang/String;Z)Z')
    askForReroll = JavaMethod('(Ljava/lang/String;)Z')
    endGame = JavaMethod('()V')


ArrayList = autoclass('java.util.ArrayList')
# skill names as BludBowl writes them -> BotBowl's numbers (only the 79 older ones drefsante knows, less the five its map lacks)
SKILL = {}
for s in Skill:
    if s.value <= 79 and s.value not in (32, 74, 75, 77, 79):
        SKILL[''.join(c for c in s.name.lower() if c.isalpha())] = s.value
# BotBowl's block die numbers (BBDieResult): attacker down 1, both down 2, push 3, defender stumbles 4, defender down 5
DIE = {'skull': 1, 'both': 2, 'push': 3, 'stumble': 4, 'pow': 5}
# BotBowl's player action numbers (PlayerActionType), for a player part-way through an action
PACT = {'move': 1, 'block': 2, 'blitz': 3, 'pass': 4, 'handoff': 5, 'foul': 6}
WEATHER = {'heat': 'HEAT', 'sunny': 'SUNNY', 'nice': 'GOOD', 'rain': 'RAIN', 'blizzard': 'BLIZZARD'}

lock = threading.Lock()
games = {}   # game id -> FFAIProxy (one per match, as drefsante's bot makes one in new_game)


def name(p): return f"p{p['id']}_{'home' if p['team'] == 1 else 'away'}"


def sq(x, y):
    return y * 26 + x if x is not None and y is not None and 0 <= x < 26 and 0 <= y < 15 else -1


def player_rec(p, active, action=None):
    """One player as drefsante_bot.convertPlayer writes him."""
    on = p.get('state') in ('up', 'prone', 'stunned')
    skills = []
    for k in p.get('skills') or []:
        v = SKILL.get(''.join(c for c in str(k).split('(')[0].lower() if c.isalpha()))
        if v is not None and v not in skills: skills.append(v)
    ma_left = p.get('maLeft', p.get('ma', 6))
    rec = [name(p), p.get('role') or 'Lineman', p.get('cost') or 50000, p.get('ma', 6), p.get('st', 3), p.get('ag', 3), p.get('av', 9),
           on, sq(p.get('x'), p.get('y')) if on else -1,
           p.get('state') == 'reserve', p.get('state') == 'ko', p.get('state') == 'dead', p.get('state') == 'cas', p.get('state') == 'out',
           active is not None and active == p['id'], PACT.get(action) if active is not None and active == p['id'] else None,
           bool(p.get('used')),
           bool(p.get('hypnotized')), bool(p.get('boneHead')), bool(p.get('reallyStupid')), bool(p.get('rooted')), False,
           bool(p.get('hasBlocked')), p.get('state') == 'stunned', p.get('state') in ('cas', 'dead'), p.get('state') == 'ko',
           False, p.get('state') in ('prone', 'stunned'),
           ma_left + p.get('rushesLeft', 2), ma_left, len(skills)] + skills
    return [len(rec)] + rec


def team_rec(d, t):
    """One team as drefsante_bot.convertTeam writes it."""
    T = d['teams'][t]
    recs = [player_rec(p, d.get('activePlayer'), d.get('action')) for p in d['players'] if p['team'] == t]
    flat = [v for r in recs for v in r]
    used = d.get('used', {}) if d.get('active') == t else {}
    out = [len(flat) + 1, len(recs)] + flat
    out += [T.get('race', 'Human'), T.get('name', 'Team') + ('_home' if t == 1 else '_away'), T.get('rerolls', 3), T.get('cheerleaders', 0),
            T.get('fans', 3), T.get('coaches', 0), bool(T.get('apothecary')), not T.get('apothecary'), T.get('rrLeft', 0),
            bool(used.get('foul')), bool(used.get('blitz')), bool(used.get('handoff')), bool(used.get('pass')),
            bool(T.get('rrUsed')), T.get('turn', 0), t == 1, T.get('score', 0), T.get('bribes', 0)]
    return out


def update(px, d):
    me = d['me']
    pre = os.path.join(TMP, 'bludbowl_' + str(d.get('game', 'g')))
    for i, t in enumerate((me, 1 - me)):
        with open(pre + ('team1' if i == 0 else 'team2'), 'w') as f: f.writelines(str(v) + '\n' for v in team_rec(d, t))
    b = d.get('ball') or {}
    carrier = next((p for p in d['players'] if p['id'] == b.get('carrier')), None)
    bx, by = (carrier['x'], carrier['y']) if carrier else (b.get('x'), b.get('y'))
    px.updateModel(sq(bx, by), bool(b.get('inAir')), d.get('half', 1), bool(d.get('blitz')), bool(d.get('quickSnap')),
                   WEATHER.get(str(d.get('weather', 'nice')).lower(), 'GOOD'), name(carrier) if carrier else '',
                   d.get('activePlayer') is not None and d.get('action') is not None, pre)


def answer(req):
    g = str(req.get('game', 'g'))
    if req.get('q') == 'end':
        px = games.pop(g, None)
        if px: px.endGame()
        return {'ok': True}
    if req.get('q') == 'hello':
        return {'ok': True, 'jar': os.path.basename(JAR)}
    px = games.get(g)
    if px is None:
        px = games[g] = autoclass('be.drefsante.bloodbowl.presenter.FFAIProxy')()
    d = req['state']; d['game'] = g
    update(px, d)
    q = req['q']
    if q == 'turn':
        return {'plan': str(px.playTurn(req.get('active') or ''))}
    if q == 'setup':
        return {'placed': str(px.setup(bool(req.get('receiving')), bool(req.get('reorganize'))))}
    if q == 'kick':
        return {'square': int(px.selectBallDestinationSquare())}
    if q == 'touchback':
        return {'player': str(px.selectPlayerToGetBall())}
    if q == 'highkick':
        return {'player': str(px.selectPlayerForHighKick())}
    if q == 'dice':
        L = ArrayList()
        for f in req['faces']: L.add(DIE[f])
        return {'index': int(px.askWhichDice(L, req['atk'], req['def'], bool(req.get('blitz'))))}
    if q == 'blockReroll':
        L = ArrayList()
        for f in req['faces']: L.add(DIE[f])
        return {'reroll': bool(px.askRerollForBlock(L, req['atk'], req['def'], bool(req.get('ours'))))}
    if q == 'reroll':
        return {'reroll': bool(px.askForReroll(req['player']))}
    if q == 'push':
        L = ArrayList()
        for s in req['squares']: L.add(int(s))
        return {'index': int(px.askOnWhichSquarePushed(req['pusher'], req['pushed'], L, bool(req.get('first', True))))}
    if q == 'follow':
        return {'follow': bool(px.askToFollow(req['atk'], int(req.get('oldDef', -1)), req['def']))}
    return {'error': 'unknown question ' + str(q)}


class H(BaseHTTPRequestHandler):
    def cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Private-Network', 'true')

    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()

    def do_GET(self):
        # the game itself too (this repo's files), so http://127.0.0.1:PORT/ plays against drefsante with nothing in between
        # (the live https site needs the browser to allow it to reach this computer; this way it doesn't)
        rel = self.path.split('?')[0].split('#')[0].lstrip('/') or 'index.html'
        f = os.path.normpath(os.path.join(REPO, rel))
        if not f.startswith(REPO) or not os.path.isfile(f):
            self.send_response(404); self.cors(); self.end_headers(); return
        ctype = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.md': 'text/markdown; charset=utf-8',
                 '.png': 'image/png', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.webp': 'image/webp', '.ico': 'image/x-icon'}.get(os.path.splitext(f)[1].lower(), 'application/octet-stream')
        with open(f, 'rb') as fh: body = fh.read()
        self.send_response(200); self.cors(); self.send_header('Content-Type', ctype); self.send_header('Content-Length', str(len(body))); self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        try:
            req = json.loads(self.rfile.read(int(self.headers.get('Content-Length') or 0)) or b'{}')
            with lock:
                out = answer(req)
            if args.verbose: print(req.get('q'), '->', json.dumps(out)[:200], flush=True)
        except Exception as e:
            traceback.print_exc()
            out = {'error': f'{type(e).__name__}: {e}'}
        body = json.dumps(out).encode()
        self.send_response(200); self.cors(); self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(body))); self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a): pass


if __name__ == '__main__':
    srv = HTTPServer((args.host, args.port), H)
    print(f'drefsante for BludBowl: open http://{args.host}:{args.port}/ and set Settings > Computer coach to drefsante (jar {os.path.basename(JAR)}; Ctrl+C to stop)', flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
