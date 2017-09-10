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
 * @readonly
 * @const
 */
const STATE = Symbol('state');

/**
 * @private
 * @param {Any} result
 */
function fulfill(result) {
  this[STATE].state = Status.FULFILLED;
  this[STATE].value = result;
  this[STATE].handlers.forEach(handle);
  this[STATE].handlers = null;
}

/**
 * @private
 * @param {Error} error
 */
function reject(error) {
  this[STATE].state = Status.REJECT;
  this[STATE].value = error;
  this[STATE].handlers.forEach(handle);
  this[STATE].handlers = null;
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
  if (this[STATE].done === false) return;
  try {
    fn(
      (value) => {
        if (done) return;
        this[STATE].done = true;
        onFulfilled(value);
      },
      (reason) => {
        if (done) return;
        this[STATE].done = true;
        onRejected(reason);
      }
    );
  } catch (err) {
    if (done) return;
    this[STATE].done = true;
    onRejected(err);
  }
}

/**
 * @private
 * @param {Handler} handler
 */
function handle(handler) {
  if (this[STATE].state === State.PENDING) {
    this[STATE].handlers.push(handler);
  } else {
    if (this[STATE].state === State.FULFILLED &&
      typeof handler.onFulfilled === 'function') {

      handler.onFulfilled(value);
    }
    if (this[STATE].state === State.REJECTED &&
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
  constructor(...args) {
    this[STATE] = {
      state: Status.PENDING,
      done: false,
      value: null,
      handlers: [],
    };

    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#Properties
     */
    this.length = args.length;

    const [fn] = args;
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
    });
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
    if (state === State.PENDING) {
      const { state } = this[STATE];
      return `Promise { <state>: "${state}" }`;
    }

    if (state === State.FULFILLED) {
      const { state, value } = this[STATE];
      return `Promise { <state>: "${state}", <value>: ${value} }`;
    }

    if (state === State.REJECTED) {
      const { state, value: reason } = this[STATE];
      return `Promise { <state>: "${state}", <reason>: ${reason} }`;
    }
  }
}

export default Promise;
