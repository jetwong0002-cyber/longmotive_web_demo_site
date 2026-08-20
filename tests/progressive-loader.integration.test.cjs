const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(html, /assets\/frames\/frame-.*\.jpg\?v=q2-20260820/, 'desktop bootstrap should request versioned quality-2 master JPEGs');
assert.doesNotMatch(
  html.slice(0, html.indexOf('</head>')),
  /assets\/frames-preview\/frame-/,
  'the head should never request the recompressed preview tier',
);
assert.match(html, /const SEQ_STARTUP=20/, 'master-quality autoplay should wait for a 20-frame contiguous buffer');
assert.match(html, /const SEQ_PREVIEW_URL=SEQ_URL/, 'autoplay and manual scrubbing should share the same master-quality source');
assert.match(html, /LMSequencePriority/, 'the runtime should use the tested priority scheduler');
assert.match(html, /nativeUpgradeNeeded/, 'the runtime should suppress redundant master-quality upgrades');

console.log('PASS: homepage uses the versioned master-quality sequence loader');
