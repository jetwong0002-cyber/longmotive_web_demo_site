const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(html, /assets\/frames-preview\/frame-/, 'desktop bootstrap should request preview JPEGs');
assert.doesNotMatch(
  html.slice(0, html.indexOf('</head>')),
  /fetch\('assets\/frames\/frame-/,
  'the head should not compete for full-resolution frames',
);
assert.match(html, /const SEQ_STARTUP=12/, 'autoplay should start from a 12-frame contiguous buffer');
assert.match(html, /LMSequencePriority/, 'the runtime should use the tested priority scheduler');
assert.match(html, /_seqPreviewOk/, 'preview readiness should be tracked separately from full-resolution upgrades');
assert.match(html, /_seqFullOk/, 'full-resolution readiness should be tracked separately from preview frames');

console.log('PASS: homepage uses the progressive two-tier sequence loader');
