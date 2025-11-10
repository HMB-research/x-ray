/**
 * Tests for new selector types (RegExp, null/undefined, custom types)
 */

/* global describe, it */

const assert = require('assert')
const Xray = require('..')

describe('Selector Types', function () {
  describe('RegExp selectors', function () {
    it('should extract text matching a regular expression', function (done) {
      const html = '<div>Price: $19.99</div>'
      const xray = Xray()
      const x = xray(html, {
        price: /\$(\d+\.\d{2})/
      })

      x(function (err, result) {
        if (err) return done(err)
        assert.strictEqual(result.price, '19.99')
        done()
      })
    })

    it('should return null if pattern does not match', function (done) {
      const html = '<div>No price here</div>'
      const xray = Xray()
      const x = xray(html, {
        price: /\$(\d+\.\d{2})/
      })

      x(function (err, result) {
        if (err) return done(err)
        assert.strictEqual(result.price, null)
        done()
      })
    })

    it('should return full match if no capture group', function (done) {
      const html = '<div>Email: test@example.com</div>'
      const xray = Xray()
      const x = xray(html, {
        email: /\w+@\w+\.\w+/
      })

      x(function (err, result) {
        if (err) return done(err)
        assert.strictEqual(result.email, 'test@example.com')
        done()
      })
    })

    it('should work with complex patterns', function (done) {
      const html = '<div>Order #ABC-123-XYZ</div>'
      const xray = Xray()
      const x = xray(html, {
        orderId: /Order #([A-Z0-9-]+)/
      })

      x(function (err, result) {
        if (err) return done(err)
        assert.strictEqual(result.orderId, 'ABC-123-XYZ')
        done()
      })
    })
  })

  describe('null/undefined selectors', function () {
    it('should return null for null selector', function (done) {
      const html = '<div><h1>Title</h1></div>'
      const xray = Xray()
      const x = xray(html, {
        title: 'h1',
        optional: null
      })

      x(function (err, result) {
        if (err) return done(err)
        assert.strictEqual(result.title, 'Title')
        assert.strictEqual(result.optional, null)
        done()
      })
    })

    it('should return null for undefined selector', function (done) {
      const html = '<div><h1>Title</h1></div>'
      const xray = Xray()
      const x = xray(html, {
        title: 'h1',
        optional: undefined
      })

      x(function (err, result) {
        if (err) return done(err)
        assert.strictEqual(result.title, 'Title')
        assert.strictEqual(result.optional, null)
        done()
      })
    })

    it('should allow optional fields in nested objects', function (done) {
      const html = '<div><article><h2>Article 1</h2></article></div>'
      const xray = Xray()
      const x = xray(html, {
        articles: xray('article', [{
          title: 'h2',
          subtitle: null,
          description: undefined
        }])
      })

      x(function (err, result) {
        if (err) return done(err)
        assert.strictEqual(result.articles.length, 1)
        assert.strictEqual(result.articles[0].title, 'Article 1')
        assert.strictEqual(result.articles[0].subtitle, null)
        assert.strictEqual(result.articles[0].description, null)
        done()
      })
    })
  })

  describe('custom type handlers', function () {
    it('should register and use custom type handlers', function (done) {
      const html = '<div>42</div>'
      const xray = Xray()

      // Custom type that extracts numbers
      const NumberType = function (selector) {
        this.selector = selector
      }

      xray.type('number', function (value, $, scope, filters, callback) {
        const text = $.text()
        const num = parseInt(text, 10)
        callback(null, isNaN(num) ? null : num)
      }, function (value) {
        return value instanceof NumberType
      })

      const x = xray(html, {
        count: new NumberType()
      })

      x(function (err, result) {
        if (err) return done(err)
        assert.strictEqual(result.count, 42)
        done()
      })
    })

    it('should allow multiple custom type handlers', function (done) {
      const html = '<div>Hello World</div>'
      const xray = Xray()

      const UppercaseType = function () {}
      const LowercaseType = function () {}

      xray.type('uppercase', function (value, $, scope, filters, callback) {
        callback(null, $.text().toUpperCase())
      }, function (value) {
        return value instanceof UppercaseType
      })

      xray.type('lowercase', function (value, $, scope, filters, callback) {
        callback(null, $.text().toLowerCase())
      }, function (value) {
        return value instanceof LowercaseType
      })

      const x = xray(html, {
        upper: new UppercaseType(),
        lower: new LowercaseType()
      })

      x(function (err, result) {
        if (err) return done(err)
        assert.strictEqual(result.upper, 'HELLO WORLD')
        assert.strictEqual(result.lower, 'hello world')
        done()
      })
    })

    it('should retrieve registered type handler', function () {
      const xray = Xray()
      const handler = function () {}

      xray.type('test', handler, function () { return false })

      const retrieved = xray.type('test')
      assert.strictEqual(retrieved, handler)
    })

    it('should return undefined for non-existent type', function () {
      const xray = Xray()
      const retrieved = xray.type('nonexistent')
      assert.strictEqual(retrieved, undefined)
    })
  })

  describe('strict mode', function () {
    it('should throw error for invalid types in strict mode', function (done) {
      const html = '<div>Test</div>'
      const xray = Xray({ strict: true })
      const x = xray(html, {
        invalid: 123 // Invalid type
      })

      x(function (err, result) {
        assert.ok(err)
        assert.ok(err instanceof TypeError)
        assert.ok(err.message.includes('Unsupported selector type'))
        done()
      })
    })

    it('should not throw error for valid types in strict mode', function (done) {
      const html = '<div><h1>Title</h1></div>'
      const xray = Xray({ strict: true })
      const x = xray(html, {
        title: 'h1',
        pattern: /test/,
        optional: null
      })

      x(function (err, result) {
        if (err) return done(err)
        assert.strictEqual(result.title, 'Title')
        done()
      })
    })

    it('should validate nested objects in strict mode', function (done) {
      const html = '<div></div>'
      const xray = Xray({ strict: true })
      const x = xray(html, {
        nested: {
          invalid: 123
        }
      })

      x(function (err, result) {
        assert.ok(err)
        assert.ok(err instanceof TypeError)
        done()
      })
    })
  })

  describe('mixed selector types', function () {
    it('should handle multiple selector types in one object', function (done) {
      const html = `
        <div>
          <h1>My Article</h1>
          <p class="author">John Doe</p>
          <p>Price: $29.99</p>
          <a href="/link">Read more</a>
        </div>
      `
      const xray = Xray()
      const x = xray(html, {
        title: 'h1', // String selector
        author: '.author', // String selector
        price: /\$(\d+\.\d{2})/, // RegExp selector
        link: 'a@href', // String selector with attribute
        optional: null, // null selector
        tags: ['a'] // Array selector
      })

      x(function (err, result) {
        if (err) return done(err)
        assert.strictEqual(result.title, 'My Article')
        assert.strictEqual(result.author, 'John Doe')
        assert.strictEqual(result.price, '29.99')
        assert.strictEqual(result.link, '/link')
        assert.strictEqual(result.optional, null)
        assert.ok(Array.isArray(result.tags))
        done()
      })
    })

    it('should handle nested mixed types', function (done) {
      const html = `
        <div class="item">
          <h2>Item 1</h2>
          <span class="price">$19.99</span>
        </div>
      `
      const xray = Xray()
      const x = xray(html, '.item', [{
        title: 'h2',
        priceText: '.price',
        priceNumber: /\$(\d+\.\d{2})/,
        metadata: {
          available: null,
          tags: undefined
        }
      }])

      x(function (err, result) {
        if (err) return done(err)
        assert.strictEqual(result.length, 1)
        assert.strictEqual(result[0].title, 'Item 1')
        assert.strictEqual(result[0].priceText, '$19.99')
        assert.strictEqual(result[0].priceNumber, '19.99')
        assert.strictEqual(result[0].metadata.available, null)
        assert.strictEqual(result[0].metadata.tags, null)
        done()
      })
    })
  })
})
