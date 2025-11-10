![x-ray](https://cldup.com/fMBbTcVtwB.png)

[![NPM Version](https://img.shields.io/npm/v/@hmb-research/x-ray.svg?style=flat-square)](https://www.npmjs.org/package/@hmb-research/x-ray)
[![CI Status](https://img.shields.io/github/actions/workflow/status/HMB-research/x-ray/ci.yml?branch=master&style=flat-square&label=CI)](https://github.com/HMB-research/x-ray/actions/workflows/ci.yml)
[![NPM Downloads](https://img.shields.io/npm/dm/@hmb-research/x-ray.svg?style=flat-square)](https://www.npmjs.org/package/@hmb-research/x-ray)
[![Node Version](https://img.shields.io/node/v/@hmb-research/x-ray.svg?style=flat-square)](https://www.npmjs.org/package/@hmb-research/x-ray)
[![GitHub Issues](https://img.shields.io/github/issues/HMB-research/x-ray.svg?style=flat-square)](https://github.com/HMB-research/x-ray/issues)
[![License](https://img.shields.io/npm/l/@hmb-research/x-ray.svg?style=flat-square)](https://github.com/HMB-research/x-ray/blob/master/LICENSE)

```js
var Xray = require('@hmb-research/x-ray')
var x = Xray()

x('https://blog.ycombinator.com/', '.post', [
  {
    title: 'h1 a',
    link: '.article-title@href'
  }
])
  .paginate('.nav-previous a@href')
  .limit(3)
  .write('results.json')
```

## Installation

```
npm install @hmb-research/x-ray
```

## Features

- **Flexible schema:** Supports strings, arrays, arrays of objects, and nested object structures. The schema is not tied to the structure of the page you're scraping, allowing you to pull the data in the structure of your choosing.

- **Composable:** The API is entirely composable, giving you great flexibility in how you scrape each page.

- **Pagination support:** Paginate through websites, scraping each page. X-ray also supports a request `delay` and a pagination `limit`. Scraped pages can be streamed to a file, so if there's an error on one page, you won't lose what you've already scraped.

- **Crawler support:** Start on one page and move to the next easily. The flow is predictable, following
  a breadth-first crawl through each of the pages.

- **Responsible:** X-ray has support for concurrency, throttles, delays, timeouts and limits to help you scrape any page responsibly.

- **Pluggable drivers:** Swap in different scrapers depending on your needs. Currently supports HTTP and [PhantomJS driver](http://github.com/lapwinglabs/x-ray-phantom) drivers. In the future, I'd like to see a Tor driver for requesting pages through the Tor network.

## Selector API

### xray(url, selector)(fn)

Scrape the `url` for the following `selector`, returning an object in the callback `fn`.
The `selector` takes an enhanced jQuery-like string that is also able to select on attributes. The syntax for selecting on attributes is `selector@attribute`. If you do not supply an attribute, the default is selecting the `innerText`.

Here are a few examples:

- Scrape a single tag

```js
xray('http://google.com', 'title')(function(err, title) {
  console.log(title) // Google
})
```

- Scrape a single class

```js
xray('http://reddit.com', '.content')(fn)
```

- Scrape an attribute

```js
xray('http://techcrunch.com', 'img.logo@src')(fn)
```

- Scrape `innerHTML`

```js
xray('http://news.ycombinator.com', 'body@html')(fn)
```

### xray(url, scope, selector)

You can also supply a `scope` to each `selector`. In jQuery, this would look something like this: `$(scope).find(selector)`.

### xray(html, scope, selector)

Instead of a url, you can also supply raw HTML and all the same semantics apply.

```js
var html = '<body><h2>Pear</h2></body>'
x(html, 'body', 'h2')(function(err, header) {
  header // => Pear
})
```

## API

### xray.driver(driver)

Specify a `driver` to make requests through. Available drivers include:

- [request](https://github.com/Crazometer/request-x-ray) - A simple driver built around request. Use this to set headers, cookies or http methods.
- [phantom](https://github.com/lapwinglabs/x-ray-phantom) - A high-level browser automation library. Use this to render pages or when elements need to be interacted with, or when elements are created dynamically using javascript (e.g.: Ajax-calls).

### xray.stream()

Returns Readable Stream of the data. This makes it easy to build APIs around x-ray. Here's an example with Express:

```js
var app = require('express')()
var x = require('x-ray')()

app.get('/', function(req, res) {
  var stream = x('http://google.com', 'title').stream()
  stream.pipe(res)
})
```

### xray.write([path])

Stream the results to a `path`.

If no path is provided, then the behavior is the same as [.stream()](#xraystream).

### xray.then(cb)

Constructs a `Promise` object and invoke its `then` function with a callback `cb`. Be sure to invoke `then()` at the last step of xray method chaining, since the other methods are not promisified.

```js
x('https://dribbble.com', 'li.group', [
  {
    title: '.dribbble-img strong',
    image: '.dribbble-img [data-src]@data-src'
  }
])
  .paginate('.next_page@href')
  .limit(3)
  .then(function(res) {
    console.log(res[0]) // prints first result
  })
  .catch(function(err) {
    console.log(err) // handle error in promise
  })
```

### xray.paginate(selector)

Select a `url` from a `selector` and visit that page.

### xray.limit(n)

Limit the amount of pagination to `n` requests.

### xray.abort(validator)

Abort pagination if `validator` function returns `true`.
The `validator` function receives two arguments:

- `result`: The scrape result object for the current page.
- `nextUrl`: The URL of the next page to scrape.

### xray.delay(from, [to])

Delay the next request between `from` and `to` milliseconds.
If only `from` is specified, delay exactly `from` milliseconds.
```js
var x = Xray().delay('1s', '10s')
```

### xray.concurrency(n)

Set the request concurrency to `n`. Defaults to `Infinity`.
```js
var x = Xray().concurrency(2)
```

### xray.throttle(n, ms)

Throttle the requests to `n` requests per `ms` milliseconds.
```js
var x = Xray().throttle(2, '1s')
```

### xray.timeout (ms)

Specify a timeout of `ms` milliseconds for each request.
```js
var x = Xray().timeout(30)
```

## Collections

X-ray also has support for selecting collections of tags. While `x('ul', 'li')` will only select the first list item in an unordered list, `x('ul', ['li'])` will select all of them.

Additionally, X-ray supports "collections of collections" allowing you to smartly select all list items in all lists with a command like this: `x(['ul'], ['li'])`.

## Selector Types

X-ray supports multiple selector types to handle different data extraction needs. Each type provides unique capabilities for structuring and extracting data.

### String Selectors

The most common selector type. Uses CSS-like syntax with support for attribute extraction using `@`.

```js
x('http://example.com', {
  title: 'h1',                    // Extract text content
  link: 'a@href',                 // Extract href attribute
  html: '.content@html',          // Extract innerHTML
  image: 'img.logo@src'           // Extract src attribute
})
```

### Function Selectors

Use functions for advanced extraction logic or to compose nested x-ray instances.

```js
x('http://example.com', {
  // Custom extraction logic
  custom: function($, callback) {
    const value = $('.selector').text().toUpperCase()
    callback(null, value)
  },

  // Nested x-ray instance (crawling)
  details: x('.link@href', {
    title: 'h1',
    description: 'p'
  })
})
```

### Array Selectors

Extract multiple elements into an array.

```js
// Array of strings
x('http://example.com', {
  links: ['a@href']  // Returns array of all href attributes
})

// Array of objects
x('http://example.com', '.items', [{
  title: 'h2',
  price: '.price',
  link: 'a@href'
}])
```

### RegExp Selectors

Extract data using regular expressions with capture groups.

```js
x('http://example.com', {
  price: /\$(\d+\.\d{2})/,        // Extracts "19.99" from "$19.99"
  email: /[\w.]+@[\w.]+\.\w+/,    // Extracts email address
  orderId: /Order #([A-Z0-9-]+)/  // Extracts order ID from text
})
```

RegExp selectors return the first capture group if present, otherwise the full match. Returns `null` if no match is found.

### Optional Fields (null/undefined)

Use `null` or `undefined` to define optional fields that always return `null`.

```js
x('http://example.com', {
  title: 'h1',           // Required field
  subtitle: null,        // Optional field (always null)
  description: undefined // Optional field (always null)
})
```

This is useful for defining a consistent schema where some fields may not always be present.

### Custom Type Handlers

Register custom type handlers for specialized extraction logic.

```js
const x = Xray()

// Define a custom type
function PriceType(selector) {
  this.selector = selector
}

// Register the handler
x.type('price', function(value, $, scope, filters, callback) {
  const text = $(value.selector).text()
  const price = parseFloat(text.replace(/[^0-9.]/g, ''))
  callback(null, isNaN(price) ? null : price)
}, function(value) {
  return value instanceof PriceType
})

// Use the custom type
x('http://example.com', {
  price: new PriceType('.price')
})(function(err, result) {
  console.log(result.price) // Returns numeric price
})
```

### Strict Mode

Enable strict type validation during development to catch selector type errors:

```js
const x = Xray({ strict: true })

x('http://example.com', {
  title: 'h1',
  invalid: 123  // Throws TypeError in strict mode
})
```

### TypeScript Support

X-ray now includes TypeScript definitions for type-safe scraping:

```typescript
import XRay = require('@hmb-research/x-ray')

interface Article {
  title: string
  author: string
  price: string | null
}

const xray = XRay()
const result = await xray('http://example.com', '.article', [{
  title: 'h2',
  author: '.author',
  price: /\$(\d+\.\d{2})/
}])

// result is typed as Article[]
```

## Composition

X-ray becomes more powerful when you start composing instances together. Here are a few possibilities:

### Crawling to another site

```js
var Xray = require('@hmb-research/x-ray')
var x = Xray()

x('http://google.com', {
  main: 'title',
  image: x('#gbar a@href', 'title') // follow link to google images
})(function(err, obj) {
  /*
  {
    main: 'Google',
    image: 'Google Images'
  }
*/
})
```

### Scoping a selection

```js
var Xray = require('@hmb-research/x-ray')
var x = Xray()

x('http://mat.io', {
  title: 'title',
  items: x('.item', [
    {
      title: '.item-content h2',
      description: '.item-content section'
    }
  ])
})(function(err, obj) {
  /*
  {
    title: 'mat.io',
    items: [
      {
        title: 'The 100 Best Children\'s Books of All Time',
        description: 'Relive your childhood with TIME\'s list...'
      }
    ]
  }
*/
})
```

### Filters

Filters can specified when creating a new Xray instance. To apply filters to a value, append them to the selector using `|`.

```js
var Xray = require('@hmb-research/x-ray')
var x = Xray({
  filters: {
    trim: function(value) {
      return typeof value === 'string' ? value.trim() : value
    },
    reverse: function(value) {
      return typeof value === 'string'
        ? value
            .split('')
            .reverse()
            .join('')
        : value
    },
    slice: function(value, start, end) {
      return typeof value === 'string' ? value.slice(start, end) : value
    }
  }
})

x('http://mat.io', {
  title: 'title | trim | reverse | slice:2,3'
})(function(err, obj) {
  /*
  {
    title: 'oi'
  }
*/
})
```

## Examples

- [selector](/examples/selector/index.js): simple string selector
- [collections](/examples/collections/index.js): selects an object
- [arrays](/examples/arrays/index.js): selects an array
- [collections of collections](/examples/collection-of-collections/index.js): selects an array of objects
- [array of arrays](/examples/array-of-arrays/index.js): selects an array of arrays

## In the Wild

- [Levered Returns](http://leveredreturns.com): Uses x-ray to pull together financial data from various unstructured sources around the web.

## Resources

- Video: https://egghead.io/lessons/node-js-intro-to-web-scraping-with-node-and-x-ray

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
