const assert = require('node:assert/strict');
const { shouldRepaint } = require('../sequence-priority.js');

assert.equal(typeof shouldRepaint, 'function', 'shouldRepaint should be exported');
const visible = {};
const unrelated = {};
assert.equal(shouldRepaint(12, visible, 12, visible), false, 'an unrelated frame load must not repaint the current canvas frame');
assert.equal(shouldRepaint(12, visible, 13, unrelated), true, 'a closer loaded frame should repaint');
assert.equal(shouldRepaint(12, visible, 12, unrelated), true, 'a native upgrade of the visible frame should repaint');

console.log('PASS: canvas repaints only when the visible source changes');
