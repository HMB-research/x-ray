# X-Ray Selector Types

This document provides a comprehensive guide to all selector types supported by X-Ray.

## Table of Contents

- [Overview](#overview)
- [String Selectors](#string-selectors)
- [Function Selectors](#function-selectors)
- [Array Selectors](#array-selectors)
- [Object Selectors](#object-selectors)
- [RegExp Selectors](#regexp-selectors)
- [Optional Fields (null/undefined)](#optional-fields-nullundefined)
- [Custom Type Handlers](#custom-type-handlers)
- [Type Validation](#type-validation)
- [TypeScript Support](#typescript-support)
- [Best Practices](#best-practices)

## Overview

X-Ray's type system allows you to extract data from HTML documents using different selector patterns. Each type is designed for specific use cases and can be combined to create complex data extraction schemas.

### Supported Types

| Type | Description | Example |
|------|-------------|---------|
| String | CSS selector with optional attribute extraction | `'h1'`, `'a@href'` |
| Function | Custom extraction logic or nested x-ray | `function($, cb) {...}` |
| Array | Extract multiple elements | `['li']`, `[{title: 'h2'}]` |
| Object | Extract structured data | `{title: 'h1', link: 'a@href'}` |
| RegExp | Pattern-based extraction | `/\$(\d+\.\d{2})/` |
| null/undefined | Optional field placeholder | `null`, `undefined` |
| Custom | User-defined type handlers | Registered via `x.type()` |

## String Selectors

The most fundamental selector type. Uses CSS-like syntax with enhanced attribute extraction.

### Basic Usage

```js
const xray = Xray()

xray('http://example.com', {
  // Extract text content
  title: 'h1',
  heading: '.main-heading',

  // Extract attributes
  link: 'a@href',
  image: 'img@src',
  altText: 'img@alt',

  // Extract innerHTML
  content: '.article@html',

  // Complex selectors
  author: 'article .author-info .name',
  publishDate: 'time[datetime]@datetime'
})
```

### Syntax

```
selector[@attribute]
```

- `selector`: Any valid CSS selector
- `@attribute`: Optional attribute name to extract (default: text content)
- Special attribute `@html` extracts innerHTML

### Examples

```js
// Text content (default)
'title'                    // → "Page Title"
'.description'             // → "This is a description"

// Attributes
'a@href'                   // → "/page"
'img@src'                  // → "image.jpg"
'link@rel'                 // → "stylesheet"

// innerHTML
'.content@html'            // → "<p>HTML content</p>"

// Complex selectors
'article > header > h1'    // → "Article Title"
'.post:first-child .title' // → "First Post"
'[data-id="123"]'          // → "Element with data-id"
```

## Function Selectors

Use functions for custom extraction logic or to compose nested x-ray instances.

### Basic Usage

```js
xray('http://example.com', {
  // Custom extraction
  uppercase: function($, callback) {
    const text = $('h1').text().toUpperCase()
    callback(null, text)
  },

  // Error handling
  validated: function($, callback) {
    const value = $('.value').text()
    if (!value) {
      return callback(new Error('Value not found'))
    }
    callback(null, value)
  }
})
```

### Nested X-Ray Instances

Function selectors are commonly used for crawling to other pages:

```js
xray('http://example.com', {
  articles: xray('.article-link@href', [{
    title: 'h1',
    content: '.article-body',
    author: '.author-name'
  }])
})
```

### Signature

```js
function(cheerioInstance, callback) {
  // cheerioInstance: Cheerio object for the current context
  // callback: (error, result) => void
}
```

### Examples

```js
// Extract and transform
custom: function($, callback) {
  const price = $('.price').text()
  const numeric = parseFloat(price.replace(/[^0-9.]/g, ''))
  callback(null, numeric)
}

// Conditional extraction
status: function($, callback) {
  const inStock = $('.in-stock').length > 0
  callback(null, inStock ? 'available' : 'out of stock')
}

// Aggregate data
summary: function($, callback) {
  const items = []
  $('.item').each(function() {
    items.push($(this).text())
  })
  callback(null, items.join(', '))
}
```

## Array Selectors

Extract multiple elements into arrays. Supports both arrays of strings and arrays of objects.

### Array of Strings

Extract multiple text values or attributes:

```js
xray('http://example.com', {
  // Extract all matching elements
  links: ['a@href'],
  images: ['img@src'],
  headings: ['h2'],
  tags: ['.tag'],
})
```

**Result:**
```js
{
  links: ['/page1', '/page2', '/page3'],
  images: ['img1.jpg', 'img2.jpg'],
  headings: ['Heading 1', 'Heading 2'],
  tags: ['tag1', 'tag2', 'tag3']
}
```

### Array of Objects

Extract structured data from multiple elements:

```js
xray('http://example.com', '.article', [{
  title: 'h2',
  author: '.author',
  date: 'time@datetime',
  link: 'a@href',
  tags: ['.tag']
}])
```

**Result:**
```js
[
  {
    title: 'First Article',
    author: 'John Doe',
    date: '2025-01-01',
    link: '/article-1',
    tags: ['tech', 'news']
  },
  {
    title: 'Second Article',
    author: 'Jane Smith',
    date: '2025-01-02',
    link: '/article-2',
    tags: ['business']
  }
]
```

### Nested Arrays

Arrays can be nested within objects:

```js
xray('http://example.com', {
  articles: [{
    title: 'h2',
    comments: [{
      author: '.comment-author',
      text: '.comment-text'
    }]
  }]
})
```

## Object Selectors

Extract structured data into objects. Objects can contain any combination of selector types.

### Basic Usage

```js
xray('http://example.com', {
  title: 'h1',
  metadata: {
    author: '.author',
    date: 'time@datetime',
    category: '.category'
  },
  content: '.article-body@html',
  tags: ['.tag']
})
```

### Nested Objects

Objects can be deeply nested:

```js
xray('http://example.com', {
  article: {
    header: {
      title: 'h1',
      subtitle: 'h2',
      author: {
        name: '.author-name',
        bio: '.author-bio',
        avatar: '.author-img@src'
      }
    },
    body: {
      content: '.content@html',
      images: ['img@src']
    },
    footer: {
      tags: ['.tag'],
      shareCount: '.share-count'
    }
  }
})
```

## RegExp Selectors

Extract data using regular expressions. Ideal for extracting specific patterns from text.

### Basic Usage

```js
xray('http://example.com', {
  // Extract with capture group
  price: /\$(\d+\.\d{2})/,           // "$19.99" → "19.99"

  // Extract without capture group
  email: /\w+@\w+\.\w+/,             // "test@example.com" → "test@example.com"

  // Complex patterns
  orderId: /Order #([A-Z0-9-]+)/,   // "Order #ABC-123" → "ABC-123"
  phone: /\((\d{3})\)\s*(\d{3}-\d{4})/, // "(555) 123-4567" → "555"
})
```

### Behavior

- Returns the **first capture group** if present
- Returns the **full match** if no capture groups
- Returns `null` if no match found

### Examples

```js
// Currency extraction
price: /\$(\d+\.\d{2})/
// "Price: $29.99" → "29.99"

// Email extraction
email: /[\w.]+@[\w.]+\.\w+/
// "Contact: user@example.com" → "user@example.com"

// ID extraction
productId: /Product ID: ([A-Z0-9]+)/
// "Product ID: XYZ123" → "XYZ123"

// Percentage extraction
discount: /(\d+)% off/
// "Save 25% off" → "25"

// Date extraction
date: /(\d{4}-\d{2}-\d{2})/
// "Published on 2025-01-15" → "2025-01-15"

// Multiple number extraction (returns first capture group only)
measurement: /(\d+)x(\d+)x(\d+)/
// "Dimensions: 10x20x30 cm" → "10"
```

### No Match Handling

```js
xray('<div>No price here</div>', {
  price: /\$(\d+\.\d{2})/
})(function(err, result) {
  console.log(result.price) // null
})
```

## Optional Fields (null/undefined)

Define optional fields that consistently return `null`, useful for maintaining schema consistency.

### Basic Usage

```js
xray('http://example.com', {
  // Required fields
  title: 'h1',
  author: '.author',

  // Optional fields
  subtitle: null,
  description: undefined,
  coverImage: null
})
```

**Result:**
```js
{
  title: 'Article Title',
  author: 'John Doe',
  subtitle: null,
  description: null,
  coverImage: null
}
```

### Use Cases

#### Schema Consistency

Ensure all objects have the same structure:

```js
xray('http://example.com', '.product', [{
  name: 'h2',
  price: '.price',
  salePrice: null,  // Not all products have sale price
  rating: '.rating',
  reviewCount: null // Not all have reviews
}])
```

#### API Compatibility

Maintain backward compatibility when adding fields:

```js
// Version 1 schema
{ title: 'h1', content: '.content' }

// Version 2 schema (with optional new field)
{
  title: 'h1',
  content: '.content',
  newField: null  // Optional in v2, null by default
}
```

## Custom Type Handlers

Register custom type handlers for specialized extraction logic.

### Registering a Handler

```js
const xray = Xray()

xray.type(name, handler, validator)
```

**Parameters:**
- `name` (string): Name of the custom type
- `handler` (function): Extraction function
- `validator` (function): Function to identify values of this type

### Handler Signature

```js
function handler(value, $, scope, filters, callback) {
  // value: The selector value
  // $: Cheerio instance
  // scope: Current scope selector
  // filters: Available filters
  // callback: (error, result) => void
}
```

### Validator Signature

```js
function validator(value) {
  // Return true if value should be handled by this type
  return value instanceof MyCustomType
}
```

### Example: Number Type

```js
const xray = Xray()

// Define the type marker
function NumberType(selector) {
  this.selector = selector
}

// Register the handler
xray.type('number',
  // Handler
  function(value, $, scope, filters, callback) {
    const text = $(value.selector).text()
    const num = parseFloat(text.replace(/[^0-9.-]/g, ''))
    callback(null, isNaN(num) ? null : num)
  },
  // Validator
  function(value) {
    return value instanceof NumberType
  }
)

// Use the custom type
xray('http://example.com', {
  price: new NumberType('.price'),
  quantity: new NumberType('.qty')
})
```

### Example: Date Type

```js
function DateType(selector, format) {
  this.selector = selector
  this.format = format || 'ISO'
}

xray.type('date',
  function(value, $, scope, filters, callback) {
    const text = $(value.selector).text()
    const date = new Date(text)

    if (isNaN(date.getTime())) {
      return callback(null, null)
    }

    const result = value.format === 'ISO'
      ? date.toISOString()
      : date.toString()

    callback(null, result)
  },
  function(value) {
    return value instanceof DateType
  }
)

// Usage
xray('http://example.com', {
  publishedAt: new DateType('time[datetime]@datetime', 'ISO'),
  updatedAt: new DateType('.update-date')
})
```

### Retrieving a Handler

```js
const handler = xray.type('number')
console.log(handler) // Returns the handler function or undefined
```

## Type Validation

X-Ray provides runtime type validation to catch errors during development.

### Strict Mode

Enable strict type validation:

```js
const xray = Xray({ strict: true })

xray('http://example.com', {
  title: 'h1',
  invalid: 123  // ❌ Throws TypeError
})
```

**Error:**
```
TypeError: Unsupported selector type at "selector.invalid". Got number, expected string, function, array, object, RegExp, null, or undefined.
```

### Validation API

The validation module is also available for standalone use:

```js
const validateTypes = require('@hmb-research/x-ray/lib/validate-types')

// Check if a type is valid
const isValid = validateTypes.isValidType(['li'])
console.log(isValid) // true

// Get type name
const typeName = validateTypes.getTypeName(['li'])
console.log(typeName) // 'array-string'

// Validate and get detailed result
const result = validateTypes.validateType(123)
console.log(result)
// {
//   valid: false,
//   type: 'number',
//   error: 'Unsupported selector type...'
// }

// Assert valid type (throws on invalid)
validateTypes.assertValidType('h1') // OK
validateTypes.assertValidType(123)  // Throws TypeError
```

## TypeScript Support

X-Ray includes comprehensive TypeScript definitions.

### Basic Usage

```typescript
import XRay = require('@hmb-research/x-ray')

const xray = XRay()

interface Article {
  title: string
  author: string
  date: string
}

const articles = await xray('http://example.com', '.article', [{
  title: 'h2',
  author: '.author',
  date: 'time@datetime'
}])

// articles is typed as Article[]
```

### Type Inference

```typescript
// Selector types are inferred
const result = await xray('http://example.com', {
  title: 'h1',              // string
  links: ['a@href'],        // string[]
  price: /\$(\d+\.\d{2})/,  // string | null
  optional: null            // any
})
```

### Custom Types

```typescript
import XRay = require('@hmb-research/x-ray')

const xray = XRay({
  filters: {
    uppercase: (value: string) => value.toUpperCase(),
    trim: (value: string) => value.trim()
  }
})

// Crawler configuration is type-safe
xray
  .concurrency(5)
  .timeout(30000)
  .delay(1000)
```

### Advanced Types

```typescript
import XRay = require('@hmb-research/x-ray')

type DeepArticle = {
  header: {
    title: string
    author: {
      name: string
      bio: string
    }
  }
  content: string
  tags: string[]
}

const xray = XRay()
const result: DeepArticle = await xray('url', {
  header: {
    title: 'h1',
    author: {
      name: '.author-name',
      bio: '.author-bio'
    }
  },
  content: '.content',
  tags: ['.tag']
})
```

## Best Practices

### 1. Choose the Right Type

```js
// ✅ Good: Use string selectors for simple extraction
{ title: 'h1' }

// ❌ Bad: Unnecessary function selector
{ title: function($, cb) { cb(null, $('h1').text()) } }

// ✅ Good: Use RegExp for pattern matching
{ price: /\$(\d+\.\d{2})/ }

// ❌ Bad: Complex string manipulation in function
{ price: function($, cb) {
    const text = $('.price').text()
    const match = text.match(/\$(\d+\.\d{2})/)
    cb(null, match ? match[1] : null)
  }
}
```

### 2. Use Optional Fields for Schema Consistency

```js
// ✅ Good: Consistent schema
[{
  title: 'h2',
  subtitle: null,  // Might not exist
  author: '.author'
}]

// ❌ Bad: Inconsistent object shapes
[{
  title: 'h2',
  author: '.author'
  // subtitle sometimes exists, sometimes doesn't
}]
```

### 3. Prefer Arrays for Collections

```js
// ✅ Good: Extract all items
{ tags: ['.tag'] }

// ❌ Bad: Only gets first item
{ tags: '.tag' }
```

### 4. Use Custom Types for Reusable Logic

```js
// ✅ Good: Reusable custom type
function PriceType(selector) { this.selector = selector }
xray.type('price', priceHandler, priceValidator)

{
  retailPrice: new PriceType('.retail'),
  salePrice: new PriceType('.sale')
}

// ❌ Bad: Duplicated logic
{
  retailPrice: function($, cb) { /* price logic */ },
  salePrice: function($, cb) { /* same price logic */ }
}
```

### 5. Enable Strict Mode During Development

```js
// Development
const xray = Xray({ strict: process.env.NODE_ENV === 'development' })

// This catches type errors early
xray('url', {
  title: 'h1',
  invalid: 123  // Caught during development
})
```

### 6. Type Your Schemas with TypeScript

```typescript
// ✅ Good: Type-safe schema
interface Product {
  name: string
  price: string
  inStock: boolean
}

const products: Product[] = await xray('url', '.product', [{
  name: 'h2',
  price: '.price',
  inStock: function($, cb) { cb(null, $('.in-stock').length > 0) }
}])

// TypeScript ensures the result matches Product[]
```

### 7. Handle Errors in Function Selectors

```js
// ✅ Good: Error handling
{
  data: function($, callback) {
    try {
      const value = $('.selector').text()
      if (!value) {
        return callback(new Error('Required field missing'))
      }
      callback(null, value)
    } catch (err) {
      callback(err)
    }
  }
}

// ❌ Bad: No error handling
{
  data: function($, callback) {
    callback(null, $('.selector').text())
  }
}
```

## Summary

X-Ray's type system provides flexibility and power for web scraping:

- **String selectors** for simple CSS-based extraction
- **Function selectors** for custom logic and nested crawling
- **Array selectors** for collections
- **Object selectors** for structured data
- **RegExp selectors** for pattern-based extraction
- **Optional fields** for schema consistency
- **Custom types** for reusable extraction logic
- **TypeScript support** for type safety

Choose the appropriate type for each use case to write clean, maintainable scraping code.
