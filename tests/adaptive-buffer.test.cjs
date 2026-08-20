const assert = require('node:assert/strict');
const { bufferedAhead, playbackScale } = require('../sequence-priority.js');

assert.equal(typeof bufferedAhead, 'function', 'bufferedAhead should be exported');
assert.equal(typeof playbackScale, 'function', 'playbackScale should be exported');

const loaded = [true, true, true, true, false, true, true];
assert.equal(bufferedAhead(loaded, 0, 12), 3, 'buffering stops at the first missing frame');
assert.equal(bufferedAhead(loaded, 4, 12), 2, 'buffering counts consecutive frames after the current position');
assert.equal(bufferedAhead(loaded, 6, 12), 0, 'the final frame has no look-ahead buffer');

assert.equal(playbackScale(12, 12, 0.35), 1, 'a full buffer uses normal autoplay speed');
assert.equal(playbackScale(0, 12, 0.35), 0.35, 'an empty buffer slows smoothly instead of racing into a stall');
assert.ok(playbackScale(6, 12, 0.35) > 0.35 && playbackScale(6, 12, 0.35) < 1);

console.log('PASS: adaptive autoplay responds to the decoded look-ahead buffer');
