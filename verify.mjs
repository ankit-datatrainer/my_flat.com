import fs from 'node:fs';
import assert from 'node:assert/strict';
const html = fs.readFileSync('dist/index.html', 'utf8');
for (const link of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  const value = link[1];
  if (/^(https?:|tel:|data:)/.test(value)) continue;
  assert(fs.existsSync('dist/' + value.split('?')[0]), 'Missing local file: ' + value);
}
for (let n = 1; n <= 20; n++) for (const suffix of ['', '-original', '-thumb']) {
  const file = `dist/assets/${String(n).padStart(2, '0')}${suffix}.webp`;
  assert(fs.statSync(file).size > 1000, 'Missing or empty image: ' + file);
}
for (const f of ['js/site.js', 'js/hero3d.js', 'css/site.css', 'vendor/three.module.min.js', 'vendor/gsap.min.js', 'vendor/ScrollTrigger.min.js', 'vendor/lenis.min.js'])
  assert(fs.statSync('dist/' + f).size > 1000, 'Missing: ' + f);
for (const link of html.matchAll(/href="#([^"]+)"/g)) assert(html.includes(`id="${link[1]}"`), 'Missing section: ' + link[1]);
assert(!html.includes('7,000'), 'Old rental price remains');
assert(html.includes('tel:+917838349247'), 'Phone link missing');
assert(html.includes('https://wa.me/917838349247'), 'WhatsApp link missing');
assert(/First floor/i.test(html) && /One month/i.test(html) && /No fixed deposit/i.test(html), 'Rental facts missing');
console.log('Passed: local files, 20 complete photo sets, section links, rent and contact destinations.');
