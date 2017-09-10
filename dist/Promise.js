'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * `Promise`状态机状态枚举类
 * @private
 * @readonly
 * @enum {number}
 */
var Status = Object.freeze({
  PENDING: 0,
  FULFILLED: 1,
  REJECT: 2
});

/**
 * `Promise`状态对应标志
 * @private
 * @readonly
 * @const
 */
var STATE = Symbol('state');

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
 * 获取值的`then`方法
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
 * 确保`Promise`状态只扭转一次
 * @private
 * @param {Function} fn
 * @param {Function} onFulfilled
 * @param {Function} onRejected
 */
function doResolve(fn, onFulfilled, onRejected) {
  var _this = this;

  if (this[STATE].done === false) return;
  try {
    fn(function (value) {
      if (done) return;
      _this[STATE].done = true;
      onFulfilled(value);
    }, function (reason) {
      if (done) return;
      _this[STATE].done = true;
      onRejected(reason);
    });
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
    if (this[STATE].state === State.FULFILLED && typeof handler.onFulfilled === 'function') {

      handler.onFulfilled(value);
    }
    if (this[STATE].state === State.REJECTED && typeof handler.onReject === 'function') {

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
  setTimeout(function () {
    var handler = new Handler(onFulfilled, onRejected);
    handle(handler);
  }, 0);
}

/**
 * 对`Promise`的值操作类
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
    var _Object$definePropert;

    _classCallCheck(this, Promise);

    var state = Object.seal({
      state: Status.PENDING,
      done: false,
      value: null,
      handlers: []
    });

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    Object.defineProperties(this, (_Object$definePropert = {}, _defineProperty(_Object$definePropert, STATE, {
      value: state,
      configurable: false,
      enumerable: false,
      writable: false
    }), _defineProperty(_Object$definePropert, 'length', {
      value: args.length,
      configurable: false,
      writable: false
    }), _Object$definePropert));

    var fn = args[0];

    doResolve(fn, _resolve, reject);
  }

  /**
   * 获取一组`Promise`全部到达时的`Promise`实例
   * @static
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
   */


  _createClass(Promise, [{
    key: 'then',


    /**
     * 绑定完成或者失败操作
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
     * 绑定拒绝处理操作
     * @public
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch
     */

  }, {
    key: 'catch',
    value: function _catch(onRejected) {
      return this.then(undefined, onRejected);
    }

    /**
     * 序列化`Promise`实例
     * @public
     */

  }, {
    key: 'toString',
    value: function toString() {
      if (state === State.PENDING) {
        var _state = this[STATE].state;

        return 'Promise { <state>: "' + _state + '" }';
      }

      if (state === State.FULFILLED) {
        var _STATE = this[STATE],
            _state2 = _STATE.state,
            _value = _STATE.value;

        return 'Promise { <state>: "' + _state2 + '", <value>: ' + _value + ' }';
      }

      if (state === State.REJECTED) {
        var _STATE2 = this[STATE],
            _state3 = _STATE2.state,
            reason = _STATE2.value;

        return 'Promise { <state>: "' + _state3 + '", <reason>: ' + reason + ' }';
      }
    }
  }], [{
    key: 'all',
    value: function all(iterable) {
      return new Promise(function (resolve, reject) {
        var valueArray = [].concat(_toConsumableArray(iterable));
        var allResult = { result: [], length: 0 };
        valueArray.forEach(function (value, index) {
          var promise = resolve(value);
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
     * 获取一组`Promise`实例最先完成`Promise`数值
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
     * 获取对应值的完成`Promise`实例
     * @static
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve
     */

  }, {
    key: 'resolve',
    value: function resolve(result) {
      return _resolve(result);
    }

    /**
     * 获取对应原因的失败`Promise`实例
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