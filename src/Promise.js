const Status = {
  PENDING: 0,
  FULFILLED: 1,
  REJECT: 2,
};

/**
 * `Promise`的`es6`实现版本
 * @see https://www.promisejs.org/
 * @class
 */
class Promise {
  constructor() {
    this.state = Status.PENDING;
    this.value = null;
    this.handlers = [];
  }

  /**
   * @static
   */
  static fulfill(result) {
    this.state = Status.FULFILLED;
    this.value = result;
  }

  /**
   * @static
   */
  static reject(error) {
    this.state = Status.REJECT;
    this.value = error;
  }

  /**
   * @static
   */
  static resolve(result) {
    try {
    } catch (e) {

    }
  }
}

export default Promise;
