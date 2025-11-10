/**
 * Module: validate-types
 * Validates selector types and provides helpful error messages
 */

'use strict'

const isArray = require('./util').isArray

/**
 * Validation options
 */
const defaultOptions = {
  strict: false, // Enable strict mode for development
  customTypes: {} // Custom type handlers
}

/**
 * Validates a selector type
 * @param {*} value - The selector value to validate
 * @param {string} path - The path to the value (for error messages)
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, type: string, error: string }
 */
function validateType (value, path, options) {
  options = Object.assign({}, defaultOptions, options)
  path = path || 'selector'

  // null and undefined are valid (optional fields)
  if (value === null) {
    return { valid: true, type: 'null', error: null }
  }
  if (value === undefined) {
    return { valid: true, type: 'undefined', error: null }
  }

  // String selector
  if (typeof value === 'string') {
    return { valid: true, type: 'string', error: null }
  }

  // Function selector
  if (typeof value === 'function') {
    return { valid: true, type: 'function', error: null }
  }

  // RegExp selector
  if (value instanceof RegExp) {
    return { valid: true, type: 'regexp', error: null }
  }

  // Array selector
  if (isArray(value)) {
    if (value.length === 0) {
      return {
        valid: false,
        type: 'array',
        error: `Empty array selector at "${path}". Arrays must contain at least one element.`
      }
    }

    const firstElement = value[0]

    // Array of strings
    if (typeof firstElement === 'string') {
      return { valid: true, type: 'array-string', error: null }
    }

    // Array of objects
    if (typeof firstElement === 'object' && firstElement !== null && !isArray(firstElement)) {
      // Validate nested object
      const nestedValidation = validateObject(firstElement, `${path}[0]`, options)
      if (!nestedValidation.valid) {
        return nestedValidation
      }
      return { valid: true, type: 'array-object', error: null }
    }

    // Invalid array type
    return {
      valid: false,
      type: 'array',
      error: `Invalid array selector at "${path}". Arrays must contain either a string or an object, got ${typeof firstElement}.`
    }
  }

  // Object selector
  if (typeof value === 'object' && value !== null) {
    return validateObject(value, path, options)
  }

  // Check custom types
  if (options.customTypes && typeof options.customTypes === 'object') {
    for (const typeName in options.customTypes) {
      const handler = options.customTypes[typeName]
      if (handler && handler.validator && handler.validator(value)) {
        return { valid: true, type: `custom:${typeName}`, error: null }
      }
    }
  }

  // Unsupported type
  return {
    valid: false,
    type: typeof value,
    error: `Unsupported selector type at "${path}". Got ${typeof value}, expected string, function, array, object, RegExp, null, or undefined.`
  }
}

/**
 * Validates an object selector
 * @param {Object} obj - The object to validate
 * @param {string} path - The path to the object (for error messages)
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, type: string, error: string }
 */
function validateObject (obj, path, options) {
  const keys = Object.keys(obj)

  if (keys.length === 0) {
    return {
      valid: false,
      type: 'object',
      error: `Empty object selector at "${path}". Objects must contain at least one property.`
    }
  }

  // Validate each property
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const value = obj[key]
    const propertyPath = `${path}.${key}`
    const validation = validateType(value, propertyPath, options)

    if (!validation.valid) {
      return validation
    }
  }

  return { valid: true, type: 'object', error: null }
}

/**
 * Validates a selector and throws an error if invalid
 * @param {*} value - The selector value to validate
 * @param {string} path - The path to the value (for error messages)
 * @param {Object} options - Validation options
 * @throws {TypeError} If the selector is invalid
 */
function assertValidType (value, path, options) {
  const validation = validateType(value, path, options)
  if (!validation.valid) {
    const error = new TypeError(validation.error)
    error.path = path
    error.receivedType = validation.type
    throw error
  }
}

/**
 * Gets the type name of a selector
 * @param {*} value - The selector value
 * @param {Object} options - Validation options
 * @returns {string} The type name
 */
function getTypeName (value, options) {
  const validation = validateType(value, '', options)
  return validation.type
}

/**
 * Checks if a value is a valid selector type
 * @param {*} value - The value to check
 * @param {Object} options - Validation options
 * @returns {boolean} True if valid, false otherwise
 */
function isValidType (value, options) {
  const validation = validateType(value, '', options)
  return validation.valid
}

module.exports = {
  validateType,
  assertValidType,
  getTypeName,
  isValidType,
  validateObject
}
