// Adds a match exported from My matches to the BludBowl epics (I Like to Watch > Our picks):
//   node tools/add-epic.js <exported .json.gz file> "a short note on why it's epic"
// The file is copied into epic/ and listed in epic/index.json (newest first).
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const [file, note = ''] = process.argv.slice(2);
if (!file) { console.error('usage: node tools/add-epic.js <match.json.gz> "note"'); process.exit(1); }
const raw = fs.readFileSync(file), text = raw[0] === 0x1f && raw[1] === 0x8b ? zlib.gunzipSync(raw).toString() : raw.toString();
const d = JSON.parse(text);
if (!d.game || !d.gameLog) { console.error('not a match replay'); process.exit(1); }
const b = d.bludbowl || {}, g = d.game, sc = b.score || ['?', '?'], names = b.names || [g.teamHome.teamName, g.teamAway.teamName];
const dir = path.join(__dirname, '..', 'epic'), base = ('epic-' + (g.gameId || Date.now())).replace(/[^A-Za-z0-9._-]/g, '') + '.json.gz';
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, base), raw[0] === 0x1f ? raw : zlib.gzipSync(raw));
const idx = path.join(dir, 'index.json'), list = fs.existsSync(idx) ? JSON.parse(fs.readFileSync(idx, 'utf8')) : [];
const entry = { file: 'epic/' + base, title: `${names[0]} ${sc[0]}–${sc[1]} ${names[1]}`, note, comp: b.comp || '', races: b.races || [], date: String(g.finished || g.started || '').slice(0, 10) };
const out = [entry, ...list.filter(e => e.file !== entry.file)];
fs.writeFileSync(idx, JSON.stringify(out, null, 1) + '\n');
console.log('added', entry);
