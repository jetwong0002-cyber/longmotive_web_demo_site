const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(html, /_seqEnableNative/, 'native upgrades should have an explicit opt-in lifecycle');
assert.match(html, /_stopAuto=.*_seqEnableNative/s, 'real user input should enable nearby native upgrades');
assert.match(html, /_seqNativeStarted&&this\._seqReady/, 'drawing should request native frames only after opt-in');
assert.doesNotMatch(
  html,
  /this\._seqFullQ\.add\(Array\.from\(\{length:SEQ_N\}/,
  'finishing preview downloads must not automatically decode the entire native sequence',
);

console.log('PASS: native JPEG decoding is deferred until the user takes control');
