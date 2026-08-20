const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(html, /const SEQ_PREVIEW_URL=SEQ_URL/, 'autoplay should already use the manual-scrub master source');
assert.match(html, /_seqEnableNative=.*nativeUpgradeNeeded\(SEQ_PREVIEW_URL\(0\),SEQ_URL\(0\)\)/s, 'manual input should check whether an upgrade is actually needed');
assert.match(html, /_stopAuto=.*_seqEnableNative/s, 'real user input should still enter the guarded manual-control path');
assert.doesNotMatch(
  html,
  /this\._seqFullQ\.add\(Array\.from\(\{length:SEQ_N\}/,
  'finishing preview downloads must not automatically decode the entire native sequence',
);

console.log('PASS: master-quality autoplay does not trigger redundant manual upgrades');
