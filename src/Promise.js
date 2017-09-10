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
  this.handleers = null;
}

/**
 * @private
 * @param {Error} error
 */
function reject(error) {
  this.state = Status.REJECT;
  this.value = error;
  this.handlers.forEach(handle);
  this.handleers = null;
}

/**
 * @private
 * @param {Any|Promise} result
 */
function resolve(result) {
  try {
    const then = Promise.getThen(result);
    if (then) {
      doResolve(then.bind(result), resolve, reject);
    }
    fulfill(result);
  } catch (err) {
    reject(err);
  }
}

/**
 * @private
 * @param {Promise|Any} value
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
 * @param {Function} fn
 * @param {Function} onFulfilled
 * @param {Function} onRejected
 */
function doResolve(fn, onFulfilled, onRejected) {
  if (this.done === false) return;
  try {
    fn((value) => {
      if (done) return;
      this.done = true;
      onFulfilled(value);
    }, (reason) => {
      if (done) return;
      this.done = true;
      onRejected(reason);
    });
  } catch (err) {
    if (done) return;
    this.done = true;
    onRejected(err);
  }
}

function handle(handler) {
  if (this.state === State.PENDING) {
    handlers.push(handler);
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
    this.state = Status.PENDING;
    this.done = false;
    this.value = null;
    this.handlers = [];
    this.length = 0;

    doResolve(fn, resolve, reject);
  }

  static resolve(value) {
    // @TODO
  }

  static all() {
    // @TODO
  }

  static race() {
    // @TODO
  }

  static reject(reason) {
    // @TODO
  }

  done(onFulfilled, onRejected) {
    setTimeout(() => {
      handle({
        onFulfilled,
        onRejected,
      });
    }, 0);
  }

  then(onFulfilled, onRejected) {
    return new Promise((resolve, reject) => {
      return this.done(
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
        });
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
  }

  catch(onRejected) {
  }
}

export default Promise;
