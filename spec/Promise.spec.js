import test from 'ava';

import Promise from 'Promise';

/**
 * `Promise`属性测试用例
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#Properties
 */
test('[Promise]: properties test case;', (it) => {
  const promise = new Promise((resolve, reject) => {
    // PENDING...
  });

  it.is(promise.length, 1);
});

/**
 * `Promise`序列化测试用例
 */
test('[Promise]: serialization test case;', (it) => {
  const promise1 = new Promise((resolve, reject) => {
    // PENDING...
  });

  it.is(promise1 + '', 'Promise { <state>: "PENDING" }');

  const value = 1;
  const promise2 = new Promise((resolve, reject) => {
    // FULFILLED...
    resolve(value);
  });

  it.is(promise2 + '', `Promise { <state>: "FULFILLED", <value>: ${value} }`);
});
