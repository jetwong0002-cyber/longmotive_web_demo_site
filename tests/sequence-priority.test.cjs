const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const modulePath = path.join(__dirname, '..', 'sequence-priority.js');
assert.ok(fs.existsSync(modulePath), 'sequence-priority.js should exist');

const {
  SequencePriorityQueue,
  startupIndices,
  rollingIndices,
  previewWorkerLimit,
  frameUrl,
  nativeUpgradeNeeded,
} = require(modulePath);

assert.deepEqual(
  startupIndices(136, 12),
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  'startup should use contiguous opening frames',
);

assert.deepEqual(
  rollingIndices(136, 40, 4, 2),
  [40, 41, 42, 43, 44, 39, 38],
  'rolling window should prioritize the play direction before nearby history',
);

assert.deepEqual(
  rollingIndices(5, 4, 4, 2),
  [4, 3, 2],
  'rolling window should clamp to sequence bounds',
);

assert.equal(
  frameUrl('assets/frames/', 0, 'q2-20260820'),
  'assets/frames/frame-0001.jpg?v=q2-20260820',
  'master frame URLs should be versioned so immutable 960p cache entries cannot be reused',
);

const versionedMaster = frameUrl('assets/frames/', 0, 'q2-20260820');
assert.equal(
  nativeUpgradeNeeded(versionedMaster, versionedMaster),
  false,
  'manual input should not decode a second copy when autoplay already uses the master source',
);

assert.equal(previewWorkerLimit(false), 6, 'startup should fill its first contiguous buffer quickly');
assert.equal(previewWorkerLimit(true), 2, 'autoplay should limit concurrent quality-2 decoding after startup');

const queue = new SequencePriorityQueue(136);
queue.add([10, 11], 100);
queue.add([50], 0);
queue.add([11], -1);
assert.equal(queue.next(), 11, 'adding an existing item should upgrade its priority');
queue.complete(11);
assert.equal(queue.next(), 50, 'lower numeric priority should load first');
queue.complete(50);
assert.equal(queue.next(), 10, 'remaining background work should stay queued');
queue.complete(10);
assert.equal(queue.next(), null, 'completed work should not be returned twice');
assert.equal(queue.completed, 3);

console.log('PASS: progressive sequence priority scheduling');
