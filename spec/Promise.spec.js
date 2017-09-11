import test from 'ava';

import Promise from 'Promise';

/**
 * `Promise`属性测试用例
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#Properties
 */
test((it) => {
  const promise = new Promise((resolve, reject) => {});

  it.is(promise.length, 1, '[Properties] The promise length should equal to one;');
});
