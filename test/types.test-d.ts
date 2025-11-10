/**
 * TypeScript type tests for @hmb-research/x-ray
 * These tests verify that the type definitions work correctly
 * Run with: tsc --noEmit test/types.test-d.ts
 */

import XRay = require('..');

// Test: Creating an instance
const xray = XRay();
const xrayWithFilters = XRay({
  filters: {
    trim: (value: string) => value.trim(),
    uppercase: (value: string) => value.toUpperCase()
  }
});

// Test: String selector
const stringNode = xray('http://example.com', 'title');
stringNode((err, result) => {
  if (err) {
    console.error(err);
  } else {
    const title: string = result; // result should be string
  }
});

// Test: Object selector
interface Article {
  title: string;
  author: string;
  date: string;
}

const objectNode = xray('http://example.com', {
  title: 'h1',
  author: '.author',
  date: '.date'
});

objectNode((err, result) => {
  if (!err && result) {
    const title: string = result.title;
    const author: string = result.author;
    const date: string = result.date;
  }
});

// Test: Array selector
const arrayNode = xray('http://example.com', '.articles', [{
  title: 'h2',
  link: 'a@href'
}]);

arrayNode((err, result) => {
  if (!err && result) {
    result.forEach(article => {
      const title: string = article.title;
      const link: string = article.link;
    });
  }
});

// Test: Nested selectors
const nestedNode = xray('http://example.com', {
  articles: xray('.article', [{
    title: 'h2',
    meta: {
      author: '.author',
      date: '.date'
    }
  }])
});

// Test: Promise support
async function testPromise() {
  const result = await xray('http://example.com', 'title');
  const title: string = result;
}

// Test: Stream support
const streamNode = xray('http://example.com', [{title: 'h1'}]);
const stream = streamNode.stream();
stream.on('data', (data) => {
  console.log(data);
});

// Test: Pagination
const paginatedNode = xray('http://example.com', '.items', [{
  title: 'h2'
}])
  .paginate('.next@href')
  .limit(5);

paginatedNode((err, results) => {
  if (!err && results) {
    const items: Array<{title: string}> = results;
  }
});

// Test: Abort validator
const abortNode = xray('http://example.com', [{title: 'h2'}])
  .paginate('.next@href')
  .abort((result, nextUrl) => {
    return result.length > 10;
  });

// Test: Crawler configuration
xray
  .concurrency(5)
  .throttle(1000)
  .timeout(10000)
  .delay(500)
  .limit(10);

// Test: Custom driver
xray.driver((context, callback) => {
  callback(null, {
    status: 200,
    body: '<html></html>'
  });
});

// Test: Scope selector
const scopedNode = xray('http://example.com', '.container', {
  title: 'h1',
  content: 'p'
});

// Test: Function selector
const functionNode = xray('http://example.com', {
  custom: ($, callback) => {
    callback(null, 'custom value');
  }
});

// Test: RegExp selector (new feature)
const regexpNode = xray('http://example.com', {
  price: /\$(\d+\.\d{2})/
});

regexpNode((err, result) => {
  if (!err && result) {
    const price: string | null = result.price;
  }
});

// Test: Optional fields with null/undefined (new feature)
const optionalNode = xray('http://example.com', {
  title: 'h1',
  subtitle: null, // optional field
  description: undefined // optional field
});

optionalNode((err, result) => {
  if (!err && result) {
    const title: string = result.title;
    const subtitle: any = result.subtitle;
    const description: any = result.description;
  }
});

// Test: Write to file
const writeNode = xray('http://example.com', [{title: 'h1'}]);
const writeStream = writeNode.write('/tmp/output.json');
writeStream.on('finish', () => {
  console.log('Write complete');
});

// Test: Chaining
xray('http://example.com', '.container', {
  title: 'h1'
})
  .paginate('.next@href')
  .limit(10)
  .abort((result, url) => result.title === 'End')
  .then(result => console.log(result))
  .catch(err => console.error(err));

// Export to avoid "not a module" error
export {};
