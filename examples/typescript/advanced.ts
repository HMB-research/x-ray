/**
 * Advanced TypeScript usage of X-Ray
 * Demonstrates custom types, filters, and pagination
 */

import XRay = require('../../index')

// Custom filters with type safety
const xray = XRay({
  filters: {
    trim: (value: string) => value.trim(),
    uppercase: (value: string) => value.toUpperCase(),
    lowercase: (value: string) => value.toLowerCase(),
    slice: (value: string, start: string, end: string) =>
      value.slice(parseInt(start), parseInt(end))
  }
})

// Configure crawler settings (all type-safe)
xray
  .concurrency(5)
  .throttle(2, 1000)
  .timeout(30000)
  .delay(1000, 2000)

// Example 1: Pagination with type safety
interface SearchResult {
  title: string
  url: string
  description: string
}

async function paginatedSearch(query: string): Promise<SearchResult[]> {
  const results = await xray(
    `https://example.com/search?q=${encodeURIComponent(query)}`,
    '.search-result',
    [{
      title: 'h2',
      url: 'a@href',
      description: '.description'
    }]
  )
    .paginate('.next-page@href')
    .limit(5)
    .abort((result: SearchResult[], nextUrl: string) => {
      // Stop if we have enough results
      return result.length >= 50
    })

  return results
}

// Example 2: Custom type handler for numbers
class NumberExtractor {
  constructor(public selector: string) {}
}

xray.type(
  'number',
  function (value, $, scope, filters, callback) {
    const text = $(value.selector).text()
    const num = parseFloat(text.replace(/[^0-9.-]/g, ''))
    callback(null, isNaN(num) ? null : num)
  },
  function (value) {
    return value instanceof NumberExtractor
  }
)

interface ProductWithNumericPrice {
  name: string
  price: number | null
  quantity: number | null
}

async function scrapeWithCustomType(): Promise<ProductWithNumericPrice[]> {
  const products = await xray('https://example.com/products', '.product', [
    {
      name: 'h2',
      price: new NumberExtractor('.price'),
      quantity: new NumberExtractor('.quantity')
    }
  ])

  return products
}

// Example 3: Using streams with TypeScript
import { Readable } from 'stream'

function streamProducts(): Readable {
  return xray('https://example.com/products', '.product', [
    {
      name: 'h2',
      price: '.price'
    }
  ]).stream()
}

// Example 4: Composition with type safety
interface Category {
  name: string
  products: Product[]
}

interface Product {
  name: string
  price: string
  details: ProductDetails
}

interface ProductDetails {
  description: string
  specifications: string[]
  images: string[]
}

async function scrapeWithComposition(): Promise<Category[]> {
  const categories = await xray(
    'https://example.com/categories',
    '.category',
    [
      {
        name: '.category-name',
        products: xray('.product-link@href', [
          {
            name: 'h1',
            price: '.price',
            details: {
              description: '.description',
              specifications: ['.spec'],
              images: ['img@src']
            }
          }
        ])
      }
    ]
  )

  return categories
}

// Example 5: Error handling with TypeScript
async function scrapeWithErrorHandling(url: string): Promise<Article[] | null> {
  try {
    const articles = await xray(url, '.article', [
      {
        title: 'h2',
        content: '.content',
        author: function ($, callback) {
          try {
            const authorName = $('.author').text()
            if (!authorName) {
              return callback(new Error('Author not found'))
            }
            callback(null, authorName)
          } catch (err) {
            callback(err as Error)
          }
        }
      }
    ])

    return articles
  } catch (err) {
    console.error('Scraping error:', err)
    return null
  }
}

interface Article {
  title: string
  content: string
  author: string
}

// Example 6: Using strict mode for development
const strictXray = XRay({ strict: process.env.NODE_ENV === 'development' })

async function scrapeInStrictMode() {
  try {
    const data = await strictXray('https://example.com', {
      title: 'h1',
      validRegex: /pattern/,
      validArray: ['li'],
      // This would throw in strict mode: invalid: 123
    })
    return data
  } catch (err) {
    if (err instanceof TypeError) {
      console.error('Type validation error:', err.message)
    }
    throw err
  }
}

// Example 7: Generic type for reusable scraper functions
async function genericScraper<T>(
  url: string,
  scope: string,
  selector: XRay.Selector<T>
): Promise<T> {
  const xray = XRay()
  return await xray(url, scope, selector)
}

// Usage of generic scraper
interface UserProfile {
  username: string
  bio: string
  followers: string
}

async function scrapeUserProfile(username: string): Promise<UserProfile> {
  return genericScraper<UserProfile>(
    `https://example.com/users/${username}`,
    '.profile',
    {
      username: '.username',
      bio: '.bio',
      followers: '.followers-count'
    }
  )
}

// Example 8: Writing to file with TypeScript
import * as fs from 'fs'
import * as path from 'path'

async function scrapeAndSave(outputPath: string): Promise<void> {
  const xray = XRay()

  await new Promise((resolve, reject) => {
    xray('https://example.com', '.item', [
      {
        name: 'h2',
        value: '.value'
      }
    ])
      .write(outputPath)
      .on('finish', resolve)
      .on('error', reject)
  })

  console.log(`Data saved to ${outputPath}`)
}

// Main execution
if (require.main === module) {
  ;(async () => {
    try {
      console.log('Running advanced TypeScript examples...')

      // Example 1: Pagination
      const searchResults = await paginatedSearch('web scraping')
      console.log(`Found ${searchResults.length} search results`)

      // Example 2: Custom types
      const products = await scrapeWithCustomType()
      console.log(`Scraped ${products.length} products with numeric prices`)

      // Example 3: Streams
      const stream = streamProducts()
      stream.on('data', (data) => console.log('Stream data:', data))

      // Example 4: Save to file
      const outputPath = path.join(__dirname, 'output.json')
      await scrapeAndSave(outputPath)

      console.log('All examples completed successfully')
    } catch (err) {
      console.error('Error running examples:', err)
      process.exit(1)
    }
  })()
}

export {
  paginatedSearch,
  scrapeWithCustomType,
  streamProducts,
  scrapeWithComposition,
  scrapeWithErrorHandling,
  genericScraper,
  scrapeAndSave
}
