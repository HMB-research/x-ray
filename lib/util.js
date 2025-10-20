'use strict'

const has = Object.prototype.hasOwnProperty
const objectAssign = require('object-assign')
const isObject = require('isobject')
const isUrl = require('is-url')
const isArray = Array.isArray

/**
 * Get the root, if there is one.
 *
 * @param {Mixed}
 * @return {Boolean|String}
 */
function root (selector) {
  return (typeof selector === 'string' || isArray(selector)) &&
  !~selector.indexOf('@') &&
  !isUrl(selector) &&
  selector
}

/**
 * Compact an array,
 * removing empty objects
 *
 * @param {Array} arr
 * @return {Array}
 */
function compact (arr) {
  return arr.filter(function (val) {
    if (!val) return false
    if (val.length !== undefined) return val.length !== 0
    for (const key in val) if (has.call(val, key)) return true
    return false
  })
}

/**
 * Check if the string is HTML
 */
function isHTML (str) {
  str = (str || '').toString().trim()
  return str[0] === '<' && str[str.length - 1] === '>'
}

module.exports = {
  root,
  isUrl,
  isArray,
  isHTML,
  compact,
  isObject,
  objectAssign
}
