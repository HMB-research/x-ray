/**
 * Module Dependencies
 */

const isObject = require('./util').isObject
const Batch = require('batch')

/**
 * Walk
 */

module.exports = walk

/**
 * Walk recursively, providing
 * callbacks for each step.
 *
 * @param {Mixed} value
 * @param {Function} fn
 * @param {Function} done
 * @param {String} key (private)
 */

function walk (value, fn, done, key) {
  const batch = Batch()
  let out

  // Check if it's a plain object (not RegExp, not a class instance, not a function)
  // Only walk through plain objects' properties
  const isPlainObject = isObject(value) &&
    !(value instanceof RegExp) &&
    typeof value !== 'function' &&
    (value.constructor === Object || value.constructor === undefined)

  if (isPlainObject) {
    out = {}
    Object.keys(value).forEach(function (k) {
      const v = value[k]
      batch.push(function (next) {
        walk(v, fn, function (err, value) {
          if (err) return next(err)
          // ignore undefined values
          if (undefined !== value && value !== '') {
            out[k] = value
          }
          next()
        }, k)
      })
    })
  } else {
    out = null
    batch.push(function (next) {
      fn(value, key, function (err, v) {
        if (err) return next(err)
        out = v
        next()
      })
    })
  }

  batch.end(function (err) {
    if (err) return done(err)
    return done(null, out)
  })
}
