/**
 * 对`Promise`的值操作类
 * @private
 * @class
 */
class Handler {
  /**
   * @constructor
   */
  constructor(onFulfilled, onRejected) {
    Object.defineProperties(this, {
      onFulfilled: {
        value: onFulfilled,
        configurable: false,
        writable: false,
      },
      onRejected: {
        value: onRejected,
        configurable: false,
        writable: false,
      },
    });
  }
}

/**
 * `Promise`状态机状态枚举类
 * @private
 * @readonly
 * @enum {Number}
 */
const State = Object.freeze({
  PENDING: 0,
  FULFILLED: 1,
  REJECT: 2,
});

/**
 * `Promise`状态机标志枚举类
 * @private
 * @readonly
 * @enum {Symbol}
 */
const Sym = Object.freeze({
  STATE: Symbol('state'),
  DONE: Symbol('done'),
  HANDLE: Symbol('handle'),
  REJECT: Symbol('reject'),
  FULFILL: Symbol('fulfill'),
  DO_RESOLVE: Symbol('doResolve'),
  GET_THEN: Symbol('getThen'),
});

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
    const state = Object.seal({
      state: State.PENDING,
      done: false,
      value: null,
      handlers: [],
    });

    Object.defineProperties(this, {
      [Sym.STATE]: {
        value: state,
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

    const {
      [Sym.DO_RESOLVE]: doResolve,
      [Sym.RESOLVE]: resolve,
      [Sym.REJECT]: reject,
    } = this;
    const [fn] = args;
    doResolve.bind(this)(fn, resolve, reject);
  }

  /**
   * 获取值的`then`方法
   * @private
   * @static
   * @param {Any|Promise} value
   * @return {Function|Null}
   */
  static [Sym.GET_THEN](value) {
    const t = typeof value;
    if (value && (t === 'object' || t === 'function')) {
      const then = value.then;
      if (typeof then === 'function') {
        return then;
      }
    }
    return null;
  }

  /**
   * 获取一组`Promise`全部到达时的`Promise`实例
   * @static
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
   */
  static all(iterable) {
    return new Promise((resolve, reject) => {
      const valueArray = [...iterable];
      const allResult = { result: [], length: 0 };
      valueArray.forEach((value, index) => {
        const promise = resolve(value);
        promise.then(
          (result) => {
            allResult.length += 1;
            allResult.result[index] = result;
            if (allResult.length === valueArray.length) {
              resolve(allResult.result);
            }
          },
          (reason) => {
            reject(reason);
          },
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
      const valueArray = [...iterable];
      valueArray.forEach((value) => {
        const promise = resolve(value);
        promise.then(
          (result) => {
            resolve(result);
          },
          (reason) => {
            reject(reason);
          },
        );
      });
    });
  }

  /**
   * 获取对应值的完成`Promise`实例
   * @static
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve
   */
  static resolve(result) {
    return new Promise((resolve, reject) => {
      try {
        const { [Sym.GET_THEN]: getThen } = Promise;
        const then = getThen(result);
        if (then) {
          result.then(resolve, reject);
          return;
        }
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
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
   * 确保对`Promise`的值的操作是异步完成的
   * @private
   * @param {Function} onFulfilled
   * @param {Function} onRejected
   */
  [Sym.DONE](onFulfilled, onRejected) {
    setTimeout(() => {
      const { [Sym.HANDLE]: handle } = this;
      const handler = new Handler(onFulfilled, onRejected);
      handle.bind(this)(handler);
    }, 0);
  }

  /**
   * 根据`Promise`状态操作其对应值
   * @private
   * @param {Handler} handler
   */
  [Sym.HANDLE](handler) {
    if (this[Sym.STATE].state === State.PENDING) {
      this[Sym.STATE].handlers.push(handler);
    } else {
      if (this[Sym.STATE].state === State.FULFILLED &&
        typeof handler.onFulfilled === 'function') {
        handler.onFulfilled(this[Sym.STATE].value);
      }

      if (this[Sym.STATE].state === State.REJECTED &&
        typeof handler.onReject === 'function') {
        handler.onFulfilled(this[Sym.STATE].value);
      }
    }
  }

  /**
   * 确保`Promise`状态只扭转一次
   * @private
   * @param {Function} fn
   * @param {Function} onFulfilled
   * @param {Function} onRejected
   */
  [Sym.DO_RESOLVE](fn, onFulfilled, onRejected) {
    const { done: isDone } = this[Sym.STATE];
    if (isDone) return;
    try {
      fn(
        (value) => {
          if (isDone) return;
          this[Sym.STATE].done = true;
          onFulfilled.bind(this)(value);
        },
        (reason) => {
          if (isDone) return;
          this[Sym.STATE].done = true;
          onRejected.bind(this)(reason);
        },
      );
    } catch (err) {
      if (isDone) return;
      this[Sym.STATE].done = true;
      onRejected.bind(this)(err);
    }
  }

  /**
   * 扭转`Promise`状态状态到拒绝
   * @private
   * @param {Any|Promise} result
   */
  [Sym.RESOLVE](result) {
    try {
      const {
        [Sym.DO_RESOLVE]: doResolve,
        [Sym.FULFILL]: fulfill,
        [Sym.REJECT]: reject,
      } = this;
      const {
        [Sym.GET_THEN]: getThen,
      } = Promise;

      const then = getThen(result);
      if (then) {
        doResolve.bind(this)(
          then.bind(result)(
            fulfill,
            reject,
          ),
        );
        return;
      }
      fulfill.bind(this)(result);
    } catch (err) {
      const { [Sym.REJECT]: reject } = this;
      reject.bind(this)(err);
    }
  }

  /**
   * 扭转`Promise`的状态到完成
   * @private
   * @param {Any} result
   */
  [Sym.FULFILL](result) {
    const { [Sym.HANDLE]: handle } = this;
    this[Sym.STATE].state = State.FULFILLED;
    this[Sym.STATE].value = result;
    this[Sym.STATE].handlers.forEach(handle.bind(this));
    this[Sym.STATE].handlers = null;
  }

  /**
   * 扭转`Promise`的状态到完成
   * @private
   * @param {Error} error
   */
  [Sym.REJECT](error) {
    const { [Sym.HANDLE]: handle } = this;
    this[Sym.STATE].state = State.REJECT;
    this[Sym.STATE].value = error;
    this[Sym.STATE].handlers.forEach(handle.bind(this));
    this[Sym.STATE].handlers = null;
  }

  /**
   * 绑定完成或者失败操作
   * @public
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then
   */
  then(onFulfilled, onRejected) {
    const {
      [Sym.REJECT]: reject,
      [Sym.RESOLVE]: resolve,
    } = Promise;
    const {
      [Sym.DONE]: done,
    } = this;
    return done.bind(this)(
      (result) => {
        if (typeof onFulfilled === 'function') {
          try {
            return resolve(onFulfilled(result));
          } catch (err) {
            return reject(err);
          }
        } else {
          return resolve(result);
        }
      },
      (err) => {
        if (typeof onRejected === 'function') {
          try {
            return resolve(onRejected(err));
          } catch (error) {
            return reject(error);
          }
        } else {
          return reject(err);
        }
      },
    );
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
    const { state } = this[Sym.STATE];
    let serialization;

    if (state === State.PENDING) {
      serialization = 'Promise { <state>: "PENDING" }';
    }

    if (state === State.FULFILLED) {
      const { value } = this[Sym.STATE];
      serialization = `Promise { <state>: "FULFILLED", <value>: ${value} }`;
    }

    if (state === State.REJECTED) {
      const { value: reason } = this[Sym.STATE];
      serialization = `Promise { <state>: "REJECTED", <reason>: ${reason} }`;
    }

    return serialization;
  }
}

export default Promise;
