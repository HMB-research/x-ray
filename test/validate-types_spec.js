/**
 * Tests for lib/validate-types.js
 */

/* global describe, it */

const assert = require('assert')
const validateTypes = require('../lib/validate-types')

describe('validate-types', function () {
  describe('validateType()', function () {
    it('should validate string selectors', function () {
      const result = validateTypes.validateType('title')
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.type, 'string')
      assert.strictEqual(result.error, null)
    })

    it('should validate function selectors', function () {
      const fn = function () {}
      const result = validateTypes.validateType(fn)
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.type, 'function')
      assert.strictEqual(result.error, null)
    })

    it('should validate RegExp selectors', function () {
      const regexp = /test/
      const result = validateTypes.validateType(regexp)
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.type, 'regexp')
      assert.strictEqual(result.error, null)
    })

    it('should validate null selectors', function () {
      const result = validateTypes.validateType(null)
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.type, 'null')
      assert.strictEqual(result.error, null)
    })

    it('should validate undefined selectors', function () {
      const result = validateTypes.validateType(undefined)
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.type, 'undefined')
      assert.strictEqual(result.error, null)
    })

    it('should validate array string selectors', function () {
      const result = validateTypes.validateType(['li'])
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.type, 'array-string')
      assert.strictEqual(result.error, null)
    })

    it('should validate array object selectors', function () {
      const result = validateTypes.validateType([{ title: 'h1' }])
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.type, 'array-object')
      assert.strictEqual(result.error, null)
    })

    it('should validate object selectors', function () {
      const result = validateTypes.validateType({ title: 'h1', link: 'a@href' })
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.type, 'object')
      assert.strictEqual(result.error, null)
    })

    it('should validate nested object selectors', function () {
      const result = validateTypes.validateType({
        title: 'h1',
        meta: {
          author: '.author',
          date: '.date'
        }
      })
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.type, 'object')
      assert.strictEqual(result.error, null)
    })

    it('should reject empty arrays', function () {
      const result = validateTypes.validateType([])
      assert.strictEqual(result.valid, false)
      assert.strictEqual(result.type, 'array')
      assert.ok(result.error.includes('Empty array'))
    })

    it('should reject empty objects', function () {
      const result = validateTypes.validateType({})
      assert.strictEqual(result.valid, false)
      assert.strictEqual(result.type, 'object')
      assert.ok(result.error.includes('Empty object'))
    })

    it('should reject unsupported types', function () {
      const result = validateTypes.validateType(123)
      assert.strictEqual(result.valid, false)
      assert.strictEqual(result.type, 'number')
      assert.ok(result.error.includes('Unsupported selector type'))
    })

    it('should reject invalid array types', function () {
      const result = validateTypes.validateType([123])
      assert.strictEqual(result.valid, false)
      assert.strictEqual(result.type, 'array')
      assert.ok(result.error.includes('Invalid array selector'))
    })

    it('should include path in error messages', function () {
      const result = validateTypes.validateType(123, 'foo.bar')
      assert.ok(result.error.includes('foo.bar'))
    })

    it('should validate nested arrays in objects', function () {
      const result = validateTypes.validateType({
        articles: [{ title: 'h2', link: 'a@href' }]
      })
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.type, 'object')
    })

    it('should reject invalid nested types', function () {
      const result = validateTypes.validateType({
        invalid: 123
      })
      assert.strictEqual(result.valid, false)
      assert.ok(result.error.includes('invalid'))
    })
  })

  describe('assertValidType()', function () {
    it('should not throw for valid types', function () {
      assert.doesNotThrow(function () {
        validateTypes.assertValidType('title')
      })
    })

    it('should throw TypeError for invalid types', function () {
      assert.throws(function () {
        validateTypes.assertValidType(123)
      }, TypeError)
    })

    it('should include error details in thrown error', function () {
      try {
        validateTypes.assertValidType(123, 'test.path')
        assert.fail('Should have thrown')
      } catch (err) {
        assert.ok(err instanceof TypeError)
        assert.ok(err.message.includes('test.path'))
        assert.strictEqual(err.path, 'test.path')
        assert.strictEqual(err.receivedType, 'number')
      }
    })
  })

  describe('getTypeName()', function () {
    it('should return type name for string', function () {
      assert.strictEqual(validateTypes.getTypeName('test'), 'string')
    })

    it('should return type name for function', function () {
      assert.strictEqual(validateTypes.getTypeName(function () {}), 'function')
    })

    it('should return type name for regexp', function () {
      assert.strictEqual(validateTypes.getTypeName(/test/), 'regexp')
    })

    it('should return type name for array string', function () {
      assert.strictEqual(validateTypes.getTypeName(['li']), 'array-string')
    })

    it('should return type name for array object', function () {
      assert.strictEqual(validateTypes.getTypeName([{ title: 'h1' }]), 'array-object')
    })

    it('should return type name for object', function () {
      assert.strictEqual(validateTypes.getTypeName({ title: 'h1' }), 'object')
    })

    it('should return type name for null', function () {
      assert.strictEqual(validateTypes.getTypeName(null), 'null')
    })

    it('should return type name for undefined', function () {
      assert.strictEqual(validateTypes.getTypeName(undefined), 'undefined')
    })
  })

  describe('isValidType()', function () {
    it('should return true for valid types', function () {
      assert.strictEqual(validateTypes.isValidType('test'), true)
      assert.strictEqual(validateTypes.isValidType(function () {}), true)
      assert.strictEqual(validateTypes.isValidType(/test/), true)
      assert.strictEqual(validateTypes.isValidType(['li']), true)
      assert.strictEqual(validateTypes.isValidType([{ title: 'h1' }]), true)
      assert.strictEqual(validateTypes.isValidType({ title: 'h1' }), true)
      assert.strictEqual(validateTypes.isValidType(null), true)
      assert.strictEqual(validateTypes.isValidType(undefined), true)
    })

    it('should return false for invalid types', function () {
      assert.strictEqual(validateTypes.isValidType(123), false)
      assert.strictEqual(validateTypes.isValidType(true), false)
      assert.strictEqual(validateTypes.isValidType([]), false)
      assert.strictEqual(validateTypes.isValidType({}), false)
    })
  })

  describe('custom types', function () {
    it('should validate custom types with validator', function () {
      const customTypes = {
        mytype: {
          validator: function (v) {
            return typeof v === 'number'
          }
        }
      }

      const result = validateTypes.validateType(123, '', { customTypes })
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.type, 'custom:mytype')
    })

    it('should prioritize built-in types over custom types', function () {
      const customTypes = {
        mytype: {
          validator: function (v) {
            return typeof v === 'string'
          }
        }
      }

      const result = validateTypes.validateType('test', '', { customTypes })
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.type, 'string') // Built-in type wins
    })
  })
})
