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
assert.match(section, /class="lm-project-rail"/);
assert.match(section, /aria-label="Selected projects, completed installations and coordinated designs"/);
assert.match(section, /c\.photoSrcSet/);
assert.match(section, /c\.posterSrcSet/);
assert.match(section, />Completed installation</);
assert.match(section, />Coordinated design</);
assert.match(section, /onClick="\{\{ railToggle \}\}"/);
assert.match(section, /aria-label="\{\{ railPauseLabel \}\}"/);
assert.match(section, /onClick="\{\{ railPrev \}\}"/);
assert.match(section, /onClick="\{\{ railNext \}\}"/);

for (const forbidden of [
  'Interactive<br/>BIM viewers',
  '3D viewer',
  'Open current 3D model',
  'BIM environments',
  'lm-work-deck',
  'lm-swapcard',
  'swapCards',
]) {
  assert.equal(section.includes(forbidden), false, `homepage showcase must not contain: ${forbidden}`);
}

const railStart = html.indexOf('const PROJECT_RAIL=[');
const railEnd = html.indexOf('];', railStart);
assert.ok(railStart >= 0 && railEnd > railStart, 'PROJECT_RAIL data must be present');
const railData = html.slice(railStart, railEnd);
assert.equal((railData.match(/title:/g) || []).length, 10, 'rail must feature ten unique projects');
assert.equal((railData.match(/photo:/g) || []).length, 10, 'each project must have a photograph');
assert.equal((railData.match(/poster:/g) || []).length, 10, 'each project must have a coordinated-design poster');

assert.match(html, /_railStart/);
assert.match(html, /_railStop/);
assert.match(html, /IntersectionObserver/);
assert.match(html, /document\.hidden/);
assert.match(html, /prefers-reduced-motion: reduce/);
assert.match(html, /PROJECT_RAIL\.concat\(PROJECT_RAIL\)/, 'cards must be duplicated for a seamless loop');

const assetPaths = [...railData.matchAll(/assets\/img\/project-rail\/(?:photos|posters)\/web\/[\w.-]+/g)]
  .map((match) => match[0]);
assert.equal(new Set(assetPaths).size, 58, 'ten projects must expose responsive photo and poster assets without upscaling small originals');
for (const assetPath of assetPaths) {
  const absolutePath = path.join(root, assetPath);
  assert.ok(fs.existsSync(absolutePath), `missing responsive rail asset: ${assetPath}`);
  const budget = assetPath.endsWith('-800w.webp') ? 140 * 1024 : 360 * 1024;
  assert.ok(fs.statSync(absolutePath).size <= budget, `rail asset exceeds its ${budget / 1024}KB budget: ${assetPath}`);
}

console.log('PASS selected projects rail has ten accessible photo-to-design cards');
