// Contrast evidence for WCAG 1.4.3 (text, 4.5:1) and 1.4.11 (borders, icons, focus, 3:1) in every colour theme.
// Reads the tokens straight from public/db-form.js, so the numbers always match the code. Run: npm run contrast
// Exit code 1 if any pair fails. Add --md to print a Markdown table.
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../public/db-form.js', import.meta.url), 'utf8');
const block = src.slice(src.indexOf('const TOKENS = {'), src.indexOf('};', src.indexOf('const TOKENS = {')));
const themes = {};
for (const m of block.matchAll(/^\s*(\w+): '([^']+)'/gm)) {
  const t = {};
  for (const [, k, v] of m[2].matchAll(/--([\w-]+):([^;]+)/g)) t[k] = v.replace(/var\(--db-accent,(#[0-9a-f]{6})\)/i, '$1').trim();
  themes[m[1]] = t;
}
const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [foreground, background, minimum, what it is]
const PAIRS = [
  ['ink', 'surface', 4.5, 'Body text'], ['ink', 'bg', 4.5, 'Text on page background'], ['ink-2', 'surface', 4.5, 'Hints and secondary text'],
  ['ink-2', 'surface-2', 4.5, 'Caption label, privacy note'], ['ink', 'surface-2', 4.5, 'Caption text'], ['accent-ink', 'accent', 4.5, 'Primary button text'],
  ['accent-ink', 'accent-hover', 4.5, 'Primary button text (hover)'], ['ink', 'accent-soft', 4.5, 'Selected choice text, Listening banner'],
  ['ink', 'error-soft', 4.5, 'Error message text'], ['accent', 'surface', 4.5, 'Links, accent icons'],
  ['error', 'surface', 3, 'Error icon and invalid border'], ['line-strong', 'surface', 3, 'Button and input borders'],
  ['focus', 'surface', 3, 'Focus ring'], ['accent', 'accent-soft', 3, 'Selected choice border and tick'], ['error', 'error-soft', 3, 'Error bar'],
];
const rows = []; let fail = 0;
for (const [name, t] of Object.entries(themes)) for (const [f, b, min, what] of PAIRS) {
  if (!t[f] || !t[b]) continue;
  const r = ratio(t[f], t[b]), ok = r >= min; if (!ok) fail++;
  rows.push({ theme: name, what, fg: `--${f} ${t[f]}`, bg: `--${b} ${t[b]}`, ratio: r.toFixed(2), min, ok });
}
if (process.argv.includes('--md')) {
  console.log('| Theme | Use | Foreground | Background | Ratio | Needs | Result |\n|---|---|---|---|---|---|---|');
  rows.forEach(r => console.log(`| ${r.theme} | ${r.what} | \`${r.fg}\` | \`${r.bg}\` | ${r.ratio}:1 | ${r.min}:1 | ${r.ok ? 'Pass' : '**Fail**'} |`));
} else {
  rows.forEach(r => console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.theme.padEnd(9)} ${r.ratio.padStart(5)}:1 (needs ${r.min})  ${r.what}`));
  console.log(`\n${rows.length - fail} of ${rows.length} pairs pass across ${Object.keys(themes).length} themes.`);
}
process.exit(fail ? 1 : 0);
