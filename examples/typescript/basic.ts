/**
 * Basic TypeScript usage of X-Ray
 * Demonstrates type-safe web scraping
 */

import XRay = require('../../index')

// Define the structure of data we're extracting
interface Article {
  title: string
  link: string
  author: string
  date: string
}

async function scrapeArticles() {
  const xray = XRay()

  // Type-safe scraping with explicit interface
  const articles: Article[] = await xray(
    'https://blog.ycombinator.com/',
    '.post',
    [{
      title: 'h1 a',
      link: '.article-title@href',
      author: '.author-name',
      date: 'time@datetime'
    }]
  )

  console.log('Scraped articles:', articles)
  return articles
}

// Example with optional fields
interface Product {
  name: string
  price: string
  salePrice: string | null
  rating: string
  reviewCount: string | null
}

async function scrapeProducts() {
  const xray = XRay()

  const products: Product[] = await xray(
    'https://example.com/products',
    '.product',
    [{
      name: 'h2',
      price: '.price',
      salePrice: null, // Optional field
      rating: '.rating',
      reviewCount: null // Optional field
    }]
  )

  return products
}

// Example with nested objects
interface BlogPost {
  header: {
    title: string
    subtitle: string
    author: {
      name: string
      bio: string
      avatar: string
    }
  }
  content: string
  tags: string[]
}

async function scrapeNestedData(): Promise<BlogPost> {
  const xray = XRay()

  const post = await xray('https://example.com/blog/post-1', {
    header: {
      title: 'h1',
      subtitle: 'h2',
      author: {
        name: '.author-name',
        bio: '.author-bio',
        avatar: '.author-img@src'
      }
    },
    content: '.post-content@html',
    tags: ['.tag']
  })

  return post
}

// Example with RegExp selectors
interface PriceData {
  product: string
  priceText: string
  priceNumber: string | null
  currency: string | null
}

async function extractPrices(): Promise<PriceData[]> {
  const xray = XRay()

  const prices = await xray('https://example.com/prices', '.item', [{
    product: '.product-name',
    priceText: '.price',
    priceNumber: /\$(\d+\.\d{2})/, // Extract just the number
    currency: /([A-Z]{3})/ // Extract currency code
  }])

  return prices
}

// Main execution
if (require.main === module) {
  scrapeArticles()
    .then(articles => {
      console.log(`Successfully scraped ${articles.length} articles`)
    })
    .catch(err => {
      console.error('Error scraping:', err)
      process.exit(1)
    })
}

export {
  scrapeArticles,
  scrapeProducts,
  scrapeNestedData,
  extractPrices,
  Article,
  Product,
  BlogPost,
  PriceData
}
