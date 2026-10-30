// Download Kanit (SIL Open Font License) into <episode>/assets/fonts/.
//   node .agents/skills/tumraikortum/scripts/setup-fonts.mjs <episode>
import fs from 'node:fs';
import path from 'node:path';

const ep = process.argv[2];
if (!ep) { console.error('usage: setup-fonts.mjs <episode>'); process.exit(1); }
const dir = path.join(ep, 'assets', 'fonts');
fs.mkdirSync(dir, { recursive: true });
const BASE = 'https://raw.githubusercontent.com/google/fonts/main/ofl/kanit/';
for (const f of ['Kanit-Bold.ttf', 'Kanit-Medium.ttf', 'OFL.txt']) {
  const dest = path.join(dir, f);
  if (fs.existsSync(dest)) { console.log('have', f); continue; }
  const r = await fetch(BASE + f);
  if (!r.ok) { console.error(`failed ${f}: ${r.status}`); process.exit(1); }
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
  console.log('got', f);
}
