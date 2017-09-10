'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * `Promise`状态机状态枚举类
 * @private
 * @readonly
 * @enum {number}
 */
var Status = {
  PENDING: 0,
  FULFILLED: 1,
  REJECT: 2
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
function _resolve(result) {
  try {
    var then = getThen(result);
    if (then) {
      doResolve(then.bind(result), _resolve, reject);
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
  var t = typeof value === 'undefined' ? 'undefined' : _typeof(value);
  if (value && (t == 'object' || t == 'function')) {
    var then = value.then;
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
  var _this = this;

  if (this.done === false) return;
  try {
    fn(function (value) {
      if (done) return;
      _this.done = true;
      onFulfilled(value);
    }, function (reason) {
      if (done) return;
      _this.done = true;
      onRejected(reason);
    });
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
    if (this.state === State.FULFILLED && typeof handler.onFulfilled === 'function') {

      handler.onFulfilled(value);
    }
    if (this.state === State.REJECTED && typeof handler.onReject === 'function') {

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
  setTimeout(function () {
    var handler = new Handler(onFulfilled, onRejected);
    handle(handler);
  }, 0);
}

/**
 * @private
 * @class
 */

var Handler = function Handler(onFulfilled, onRejected) {
  _classCallCheck(this, Handler);

  this.onFulfilled = onFulfilled;
  this.onRejected = onRejected;
};

/**
 * `Promise`的`es6`实现版本
 *
 * @see https://www.promisejs.org/
 * @see http://www.ecma-international.org/ecma-262/6.0/#sec-promise-objects/
 *
 * @public
 * @class
 */


var Promise = function () {
  /**
   * @constructor
   */
  function Promise() {
    _classCallCheck(this, Promise);

    // @FIXME 隐藏状态机内部状态
    this.state = Status.PENDING;
    this.done = false;
    this.value = null;
    this.handlers = [];

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    this.length = args.length;

    var fn = args[0];

    doResolve(fn, _resolve, reject);
  }

  /**
   * @static
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
   */


  _createClass(Promise, [{
    key: 'then',


    /**
     * @public
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then
     */
    value: function then(onFulfilled, onRejected) {
      return new Promise(function (resolve, reject) {
        return done(function (result) {
          if (typeof onFulfilled === 'function') {
            try {
              return resolve(onFulFilled(result));
            } catch (err) {
              return reject(err);
            }
          } else {
            return resolve(result);
          }
        }, function (error) {
          if (typeof onRejected === 'function') {
            try {
              return resolve(onRejected(error));
            } catch (err) {
              return reject(err);
            }
          } else {
            return reject(err);
          }
        });
      });
    }

    /**
     * @public
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch
     */

  }, {
    key: 'catch',
    value: function _catch(onRejected) {
      return this.then(undefined, onRejected);
    }

    /**
     * @public
     */

  }, {
    key: 'toString',
    value: function toString() {
      if (state === State.PENDING) {
        var _state = this.state;

        return 'Promise { <state>: "' + _state + '" }';
      }

      if (state === State.FULFILLED) {
        var _state2 = this.state,
            _value = this.value;

        return 'Promise { <state>: "' + _state2 + '", <value>: ' + _value + ' }';
      }

      if (state === State.REJECTED) {
        var _state3 = this.state,
            reason = this.value;

        return 'Promise { <state>: "' + _state3 + '", <reason>: ' + reason + ' }';
      }
    }
  }], [{
    key: 'all',
    value: function all(iterable) {
      return new Promise(function (resolve, reject) {
        var promiseArray = [].concat(_toConsumableArray(iterable));
        var allResult = { result: [], length: 0 };
        promiseArray.forEach(function (promise, index) {
          promise.then(function (value) {
            allResult.length = allResult.length + 1;
            allResult.result[index] = value;
            if (allResult.length === promiseArray.length) {
              resolve(allResult.result);
            }
          }, function (reason) {
            reject(reason);
          });
        });
      });
    }

    /**
     * @static
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race
     */

  }, {
    key: 'race',
    value: function race(iterable) {
      return new Promise(function (resolve, reject) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = iterable[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var promise = _step.value;

            promise.then(function (value) {
              resolve(value);
            }, function (reason) {
              reject(reason);
            });
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      });
    }

    /**
     * @static
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve
     */

  }, {
    key: 'resolve',
    value: function resolve(result) {
      return _resolve(result);
    }

    /**
     * @static
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject
     */

  }, {
    key: 'reject',
    value: function reject(reason) {
      return new Promise(function (resolve, reject) {
        reject(reason);
      });
    }
  }]);

  return Promise;
}();

exports.default = Promise;