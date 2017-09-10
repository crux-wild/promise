/**
 * `Promise`状态机状态枚举类
 * @private
 * @readonly
 * @enum {number}
 */
const Status = Object.freeze({
  PENDING: 0,
  FULFILLED: 1,
  REJECT: 2,
});

/**
 * `Promise`状态对应标志
 * @private
 * @readonly
 * @const
 */
const STATE = Symbol('state');

/**
 * 扭转`Promise`的状态到完成
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
 * 扭转`Promise`的状态到完成
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
 * 扭转`Promise`状态状态到拒绝
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
 * 获取值的`then`方法
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
 * 确保`Promise`状态只扭转一次
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
 * 根据`Promise`状态操作其对应值
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
 * 确保对`Promise`的值的操作是异步完成的
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
 * 对`Promise`的值操作类
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
    Object.defineProperties(this, {
      [STATE]: {
        value: Object.seal({
          state: Status.PENDING,
          done: false,
          value: null,
          handlers: [],
        }),
        configurable: false,
        enumerable: false,
        writable: false,
      },
      length: {
        value: args.length,
        configurable: false,
        writable: false,
      },
    });

    const [fn] = args;
    doResolve(fn, resolve, reject);
  }

  /**
   * 获取一组`Promise`全部到达时的`Promise`实例
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
   * 获取一组`Promise`实例最先完成`Promise`数值
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
   * 获取对应值的完成`Promise`实例
   * @static
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve
   */
  static resolve(result) {
    return resolve(result);
  }

  /**
   * 获取对应原因的失败`Promise`实例
   * @static
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject
   */
  static reject(reason) {
    return new Promise((resolve, reject) => {
      reject(reason);
    });
  }

  /**
   * 绑定完成或者失败操作
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
   * 绑定拒绝处理操作
   * @public
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch
   */
  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  /**
   * 序列化`Promise`实例
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
