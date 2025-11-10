# TypeScript Examples for X-Ray

This directory contains TypeScript examples demonstrating type-safe usage of the X-Ray web scraping library.

## Files

- **basic.ts** - Basic TypeScript usage including interfaces, type inference, and simple scraping patterns
- **advanced.ts** - Advanced features including custom types, pagination, streams, and composition
- **tsconfig.json** - TypeScript configuration for the examples

## Running the Examples

### Prerequisites

Install dependencies:

```bash
npm install
```

### Compile TypeScript

```bash
# From the examples/typescript directory
npx tsc

# Or from the project root
npx tsc -p examples/typescript
```

### Run Compiled Examples

```bash
# Run basic examples
node dist/basic.js

# Run advanced examples
node dist/advanced.js
```

### Run with ts-node

Alternatively, use `ts-node` to run examples directly:

```bash
# Install ts-node if not already installed
npm install -g ts-node

# Run examples
ts-node basic.ts
ts-node advanced.ts
```

## What's Demonstrated

### basic.ts

1. **Type-safe scraping** with explicit interfaces
2. **Optional fields** using `null` and `undefined`
3. **Nested object extraction** with type safety
4. **RegExp selectors** with proper typing
5. **Promise-based API** usage

### advanced.ts

1. **Custom filters** with type-safe configuration
2. **Crawler settings** (concurrency, throttle, timeout, delay)
3. **Pagination** with typed abort validators
4. **Custom type handlers** for specialized extraction
5. **Streams** with TypeScript
6. **Composition** with nested crawling
7. **Error handling** patterns
8. **Strict mode** for development
9. **Generic scrapers** for reusable functions
10. **File writing** with type safety

## Type Definitions

X-Ray includes comprehensive TypeScript definitions that provide:

- **Full API type coverage** for all methods and options
- **Type inference** for selectors and results
- **Generic types** for flexible usage
- **IntelliSense support** in editors like VS Code

## Common Patterns

### Defining Data Structures

```typescript
interface Article {
  title: string
  author: string
  date: string
  tags: string[]
}
```

### Type-Safe Scraping

```typescript
const articles: Article[] = await xray(url, '.article', [{
  title: 'h2',
  author: '.author',
  date: 'time@datetime',
  tags: ['.tag']
}])
```

### Custom Type Handlers

```typescript
class MyType {
  constructor(public selector: string) {}
}

xray.type('mytype',
  (value, $, scope, filters, callback) => {
    // Handler implementation
  },
  (value) => value instanceof MyType
)
```

### Error Handling

```typescript
try {
  const data = await xray(url, selector)
  // Process data
} catch (err) {
  if (err instanceof TypeError) {
    // Handle type errors
  }
  // Handle other errors
}
```

## Additional Resources

- [Main Documentation](../../Readme.md)
- [Selector Types Guide](../../docs/selector-types.md)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## Tips

1. **Enable strict mode** during development to catch type errors early
2. **Define interfaces** for all scraped data structures
3. **Use type inference** when the types are obvious
4. **Handle errors** with proper TypeScript types
5. **Leverage IntelliSense** in your editor for API discovery
