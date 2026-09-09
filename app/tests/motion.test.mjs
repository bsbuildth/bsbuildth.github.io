import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initReveal } from '../src/lib/motion.js';

test('reveal observes async content and disconnects both observers on unmount', (t) => {
  const observed = [];
  let disconnected = 0;
  let rescan;
  let onIntersection;
  const element = { classList: { add: (name) => observed.push(name) } };
  const original = Object.fromEntries(['window', 'document', 'IntersectionObserver', 'MutationObserver'].map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
  t.after(() => {
    for (const [key, descriptor] of Object.entries(original)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  globalThis.window = { matchMedia: () => ({ matches: false }) };
  globalThis.document = { body: {}, querySelectorAll: () => [element] };
  globalThis.IntersectionObserver = class {
    constructor(callback) { onIntersection = callback; }
    observe(el) { observed.push(el); }
    unobserve(el) { observed.push(['unobserve', el]); }
    disconnect() { disconnected++; }
  };
  globalThis.MutationObserver = class {
    constructor(callback) { rescan = callback; }
    observe() {}
    disconnect() { disconnected++; }
  };
  const cleanup = initReveal();
  assert.equal(observed[0], element);
  rescan();
  assert.equal(observed[1], element);
  onIntersection([{ isIntersecting: true, target: element }]);
  assert.equal(observed[2], 'is-visible');
  cleanup();
  assert.equal(disconnected, 2);
});
