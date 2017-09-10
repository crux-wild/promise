/**
 * `Promise`状态机状态枚举类
 * @private
 * @readonly
 * @enum {number}
 */
const Status = {
  PENDING: 0,
  FULFILLED: 1,
  REJECT: 2,
};

/**
 * @private
 * @param {Any} result
 */
function fulfill(result) {
  this.state = Status.FULFILLED;
  this.value = result;
  this.handlers.forEach(handle);
  this.handlers = null;
}

/**
 * @private
 * @param {Error} error
 */
function reject(error) {
  this.state = Status.REJECT;
  this.value = error;
  this.handlers.forEach(handle);
  this.handlers = null;
}

/**
 * @private
 * @param {Any|Promise} result
 */
function resolve(result) {
  try {
    const then = getThen(result);
    if (then) {
      doResolve(then.bind(result), resolve, reject);
      return;
    }
    fulfill(result);
  } catch (err) {
    reject(err);
  }
}

/**
 * @private
 * @param {Any|Promise} value
 * @return {Function|Null}
 */
function getThen(value) {
  const t = typeof value;
  if (value && (t == 'object' || t == 'function')) {
    const then = value.then;
    if (typeof then === 'function') {
      return then;
    }
  }
  return null;
}

/**
 * @private
 * @param {Function} fn
 * @param {Function} onFulfilled
 * @param {Function} onRejected
 */
function doResolve(fn, onFulfilled, onRejected) {
  if (this.done === false) return;
  try {
    fn(
      (value) => {
        if (done) return;
        this.done = true;
        onFulfilled(value);
      },
      (reason) => {
        if (done) return;
        this.done = true;
        onRejected(reason);
      }
    );
  } catch (err) {
    if (done) return;
    this.done = true;
    onRejected(err);
  }
}

/**
 * @private
 * @param {Handler} handler
 */
function handle(handler) {
  if (this.state === State.PENDING) {
    this.handlers.push(handler);
  } else {
    if (this.state === State.FULFILLED &&
      typeof handler.onFulfilled === 'function') {

      handler.onFulfilled(value);
    }
    if (this.state === State.REJECTED &&
      typeof handler.onReject === 'function') {

      handler.onFulfilled(value);
    }
  }
}

/**
 * @private
 * @param {Function} onFulfilled
 * @param {Function} onRejected
 */
function done(onFulfilled, onRejected) {
  setTimeout(() => {
    const handler = new Handler(onFulfilled, onRejected);
    handle(handler);
  }, 0);
}

/**
 * @private
 * @class
 */
class Handler {
  constructor(onFulfilled, onRejected) {
    this.onFulfilled = onFulfilled;
    this.onRejected = onRejected;
  }
}

/**
 * `Promise`的`es6`实现版本
 *
 * @see https://www.promisejs.org/
 * @see http://www.ecma-international.org/ecma-262/6.0/#sec-promise-objects/
 *
 * @public
 * @class
 */
class Promise {
  /**
   * @constructor
   */
  constructor(fn) {
    // @FIXME 隐藏状态机内部状态
    this.state = Status.PENDING;
    this.done = false;
    this.value = null;
    this.handlers = [];
    this.length = 1;

    doResolve(fn, resolve, reject);
  }

  /**
   * @static
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
   */
  static all(iterable) {
    return new Promise((resolve, reject) => {
      const promiseArray = [...iterable];
      const allResult = { result: [], length: 0 };
      promiseArray.forEach((promise, index) => {
        promise.then(
          (value) => {
            allResult.length = allResult.length + 1;
            allResult.result[index] = value;
            if (allResult.length === promiseArray.length) {
              resolve(allResult.result);
            }
          },
          (reason) => {
            reject(reason);
          }
        );
      });
    });
  }

  /**
   * @static
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race
   */
  static race(iterable) {
    return new Promise((resolve, reject) => {
      for (const promise of iterable) {
        promise.then(
          (value) => {
            resolve(value);
          },
          (reason) => {
            reject(reason);
          }
        );
      }
    });
  }

  /**
   * @static
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve
   */
  static resolve(result) {
    return resolve(result);
  }

  /**
   * @static
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject
   */
  static reject(reason) {
    return new Promise((resolve, reject) => {
      reject(reason);
    });
  }

  /**
   * @public
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then
   */
  then(onFulfilled, onRejected) {
    return new Promise((resolve, reject) => {
      return done(
        (result) => {
          if (typeof onFulfilled === 'function') {
            try {
              return resolve(onFulFilled(result));
            } catch (err) {
              return reject(err);
            }
          } else {
            return resolve(result);
          }
        },
        (error) => {
          if (typeof onRejected === 'function') {
            try {
              return resolve(onRejected(error));
            } catch (err) {
              return reject(err);
            }
          } else {
            return reject(err);
          }
        }
      );
    };
  }

  /**
   * @public
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch
   */
  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  /**
   * @public
   */
  toString() {
    const { state } = this;

    if (state === State.PENDING) {
      return `Promise { <state>: "${state}" }`
    }

    if (state === State.FULFILLED) {
      const { value } = this;
      return `Promise { <state>: "${state}", <value>: ${value} }`
    }

    if (state === State.REJECTED) {
      const { value: reason } = this;
      return `Promise { <state>: "${state}", <reason>: ${reason} }`
    }
  }
}

export default Promise;
