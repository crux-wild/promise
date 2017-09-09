const Status = {
  PENDING: 0,
  FULFILLED: 1,
  REJECT: 2,
};

/**
 * @private
 * @function
 */
function fulfill(result) {
  this.state = Status.FULFILLED;
  this.value = result;
}

/**
 * @private
 * @function
 */
function reject(error) {
  this.state = Status.REJECT;
  this.value = error;
}

/**
 * @private
 * @function
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
 * @function
 */
function getThen(value) {
}

/**
 * `Promise`的`es6`实现版本
 *
 * @see https://www.promisejs.org/
 * @public
 * @class
 */
class Promise {
  constructor(fn) {
    this.state = Status.PENDING;
    this.value = null;
    this.handlers = [];
  }
}

export default Promise;
