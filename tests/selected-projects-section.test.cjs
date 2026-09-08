const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const start = html.indexOf('<section class="lm-project-section">');
const end = html.indexOf('<section class="lm-scroll-stop" style="background:var(--lm-gradient-brand)', start);
assert.ok(start >= 0 && end > start, 'selected-projects section must be present');
const section = html.slice(start, end);

assert.match(section, /Projects engineered for uptime\./);
assert.match(section, /View all projects/);
assert.match(section, /onClick="\{\{ goProjects \}\}"/);
assert.match(section, /aria-label="Selected project gallery"/);
assert.match(section, /c\.cardSrcSet/);
assert.match(section, /c\.cardFallback/);

for (const forbidden of [
  'Interactive<br/>BIM viewers',
  '3D viewer',
  'Open current 3D model',
  'BIM environments',
  'home-project-atlas',
  'toggleHomeProjects',
  'c.onOpen',
  'c.render',
]) {
  assert.equal(section.includes(forbidden), false, `homepage showcase must not contain: ${forbidden}`);
}

const swapStart = html.indexOf('const SWAP=[');
const swapEnd = html.indexOf('];', swapStart);
assert.ok(swapStart >= 0 && swapEnd > swapStart, 'SWAP data must be present');
const swapData = html.slice(swapStart, swapEnd);
assert.equal((swapData.match(/project-comparisons\/web\//g) || []).length, 18);
assert.equal((swapData.match(/cardSrcSet:/g) || []).length, 6);
assert.equal((swapData.match(/cardFallback:/g) || []).length, 6);

const assetPaths = [...swapData.matchAll(/assets\/img\/project-comparisons\/web\/[\w.-]+/g)]
  .map((match) => match[0]);
assert.equal(new Set(assetPaths).size, 18, 'all six cards must expose three distinct responsive assets');
for (const assetPath of assetPaths) {
  assert.ok(fs.existsSync(path.join(root, assetPath)), `missing responsive card asset: ${assetPath}`);
}

console.log('PASS selected projects section is delivery-led and uses responsive comparison cards');
