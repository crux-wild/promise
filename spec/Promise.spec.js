import test from 'ava';

import Promise from 'Promise';

test((test) => {
  const promise = new Promise((resolve, reject) => {
    resolve(1);
  });

  test.deepEqual(promise.length, 1);
});
