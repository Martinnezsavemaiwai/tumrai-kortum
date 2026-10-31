// Download Thai fonts (all SIL Open Font License, from google/fonts) into <episode>/assets/fonts/.
//   node .agents/skills/tumraikortum/scripts/setup-fonts.mjs <episode> [key ...]
// Kanit is always fetched. Extra fonts are saved as <Family>-<weight>.ttf, which is the name
// Kit.loadFonts() in kit/style.js expects. Keys and when to use them: references/genres.md.
import fs from 'node:fs';
import path from 'node:path';

// key: [google/fonts dir, file in that dir, family, weight]
const FONTS = {
  mitr: ['mitr', 'Mitr-Bold.ttf', 'Mitr', 700], // rounded, friendly: comedy
  chakra: ['chakrapetch', 'ChakraPetch-Bold.ttf', 'Chakra Petch', 700], // square, techy: found footage
  k2d: ['k2d', 'K2D-ExtraBold.ttf', 'K2D', 800], // loopless headline: puzzles, titles
  sriracha: ['sriracha', 'Sriracha-Regular.ttf', 'Sriracha', 400], // marker handwriting: diary
  itim: ['itim', 'Itim-Regular.ttf', 'Itim', 400], // cute handwriting: bedtime / facts
  mali: ['mali', 'Mali-Bold.ttf', 'Mali', 700], // kid handwriting
  charmonman: ['charmonman', 'Charmonman-Bold.ttf', 'Charmonman', 700], // Thai calligraphy: folk tales
  srisakdi: ['srisakdi', 'Srisakdi-Bold.ttf', 'Srisakdi', 700], // ornate old Thai: temple, legends
  pridi: ['pridi', 'Pridi-Bold.ttf', 'Pridi', 700], // serif: news / documentary
};

const [ep, ...keys] = process.argv.slice(2);
if (!ep) { console.error(`usage: setup-fonts.mjs <episode> [${Object.keys(FONTS).join('|')} ...]`); process.exit(1); }
const bad = keys.filter((k) => !FONTS[k]);
if (bad.length) { console.error(`unknown font ${bad.join(', ')}; have: ${Object.keys(FONTS).join(', ')}`); process.exit(1); }

const dir = path.join(ep, 'assets', 'fonts');
fs.mkdirSync(dir, { recursive: true });
const BASE = 'https://raw.githubusercontent.com/google/fonts/main/ofl/';
const jobs = [['kanit/Kanit-Bold.ttf', 'Kanit-Bold.ttf'], ['kanit/Kanit-Medium.ttf', 'Kanit-Medium.ttf'], ['kanit/OFL.txt', 'OFL.txt']];
for (const k of keys) {
  const [d, file, family, weight] = FONTS[k];
  jobs.push([`${d}/${file}`, `${family.replace(/ /g, '')}-${weight}.ttf`], [`${d}/OFL.txt`, `OFL-${k}.txt`]);
}
for (const [src, name] of jobs) {
  const dest = path.join(dir, name);
  if (fs.existsSync(dest)) { console.log('have', name); continue; }
  const r = await fetch(BASE + src);
  if (!r.ok) { console.error(`failed ${src}: ${r.status}`); process.exit(1); }
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
  console.log('got', name);
}
