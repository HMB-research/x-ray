// TypeScript definitions for @hmb-research/x-ray
// Project: https://github.com/HMB-research/x-ray
// Definitions by: Claude AI

/// <reference types="node" />

import { Stream } from 'stream';
import * as cheerio from 'cheerio';

declare namespace XRay {
  /**
   * Cheerio instance used by x-ray
   */
  type CheerioInstance = cheerio.CheerioAPI;

  /**
   * Base selector types supported by x-ray
   */
  type StringSelector = string;
  type FunctionSelector = (
    $: CheerioInstance,
    callback: (err: Error | null, result?: any) => void
  ) => void;
  type ArrayStringSelector = [StringSelector];
  type ArrayObjectSelector<T = any> = [ObjectSelector<T>];
  type RegExpSelector = RegExp;

  /**
   * Object selector with nested selectors
   */
  type ObjectSelector<T = any> = {
    [K in keyof T]:
      | StringSelector
      | FunctionSelector
      | ArrayStringSelector
      | ArrayObjectSelector<T[K]>
      | ObjectSelector<T[K]>
      | RegExpSelector
      | null
      | undefined;
  };

  /**
   * All supported selector types
   */
  type Selector<T = any> =
    | StringSelector
    | FunctionSelector
    | ArrayStringSelector
    | ArrayObjectSelector<T>
    | ObjectSelector<T>
    | RegExpSelector
    | null
    | undefined;

  /**
   * Filter function for transforming extracted values
   */
  type Filter = (value: string) => string;

  /**
   * Filters object mapping filter names to filter functions
   */
  type Filters = {
    [name: string]: Filter;
  };

  /**
   * Driver function for custom HTTP requests
   */
  type Driver = (
    context: DriverContext,
    callback: (err: Error | null, response?: DriverResponse) => void
  ) => void;

  /**
   * Context passed to driver function
   */
  interface DriverContext {
    url: string;
    [key: string]: any;
  }

  /**
   * Response from driver function
   */
  interface DriverResponse {
    status: number;
    body: string;
    [key: string]: any;
  }

  /**
   * Abort validator function for pagination
   */
  type AbortValidator = (result: any, nextUrl: string) => boolean;

  /**
   * Custom type handler function
   */
  type TypeHandler = (
    value: any,
    $: CheerioInstance,
    scope: string | undefined,
    filters: Filters,
    callback: (err: Error | null, result?: any) => void
  ) => void;

  /**
   * X-Ray options
   */
  interface Options {
    /**
     * Custom filters for transforming extracted values
     */
    filters?: Filters;
  }

  /**
   * X-Ray instance with crawler configuration methods
   */
  interface Instance {
    /**
     * Create a new x-ray node for scraping
     * @param source - URL or HTML string to scrape
     * @param selector - Selector to extract data
     */
    <T = any>(source: string, selector: Selector<T>): Node<T>;

    /**
     * Create a new x-ray node for scraping with scope
     * @param source - URL or HTML string to scrape
     * @param scope - Scope selector to narrow down the context
     * @param selector - Selector to extract data
     */
    <T = any>(source: string, scope: string, selector: Selector<T>): Node<T>;

    /**
     * Create a new x-ray node for scraping (used for composition)
     * @param scope - Scope selector
     * @param selector - Selector to extract data
     */
    <T = any>(scope: string, selector: Selector<T>): Node<T>;

    /**
     * Set or get the concurrency limit for parallel requests
     * @param value - Number of concurrent requests (default: Infinity)
     */
    concurrency(value: number): Instance;
    concurrency(): number;

    /**
     * Set or get the throttle delay between requests in milliseconds
     * @param value - Delay in milliseconds
     */
    throttle(value: number): Instance;
    throttle(): number;

    /**
     * Set or get the timeout for requests in milliseconds
     * @param value - Timeout in milliseconds
     */
    timeout(value: number): Instance;
    timeout(): number;

    /**
     * Set or get the custom driver for making HTTP requests
     * @param fn - Custom driver function
     */
    driver(fn: Driver): Instance;
    driver(): Driver;

    /**
     * Set or get the delay between requests in milliseconds
     * @param value - Delay in milliseconds
     */
    delay(value: number): Instance;
    delay(): number;

    /**
     * Set or get the limit for pagination
     * @param value - Maximum number of pages to crawl
     */
    limit(value: number): Instance;
    limit(): number;

    /**
     * Set or get the abort validator for pagination
     * @param validator - Function to determine when to stop pagination
     */
    abort(validator: AbortValidator): Instance;
    abort(): AbortValidator;

    /**
     * Register a custom type handler
     * @param name - Name of the custom type
     * @param handler - Handler function
     */
    type?(name: string, handler: TypeHandler): Instance;

    /**
     * Get registered type handler
     * @param name - Name of the custom type
     */
    type?(name: string): TypeHandler | undefined;
  }

  /**
   * X-Ray node for executing scraping operations
   */
  interface Node<T = any> {
    /**
     * Execute the scraping operation
     * @param callback - Callback function with results
     */
    (callback: (err: Error | null, result?: T) => void): Node<T>;

    /**
     * Execute with a different source
     * @param source - URL or HTML string to scrape
     * @param callback - Callback function with results
     */
    (source: string, callback: (err: Error | null, result?: T) => void): Node<T>;

    /**
     * Set or get the pagination selector
     * @param selector - Selector for the next page URL
     */
    paginate(selector: string): Node<T[]>;
    paginate(): string | false;

    /**
     * Set or get the limit for pagination
     * @param value - Maximum number of pages to crawl
     */
    limit(value: number): Node<T>;
    limit(): number;

    /**
     * Set or get the abort validator for pagination
     * @param validator - Function to determine when to stop pagination
     */
    abort(validator: AbortValidator): Node<T>;
    abort(): AbortValidator | false;

    /**
     * Return a readable stream of results
     */
    stream(): Stream;

    /**
     * Write results to a file and return the write stream
     * @param path - File path to write to
     */
    write(path: string): Stream;

    /**
     * Return results as a Promise
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2>;
  }

  /**
   * Type inference helpers
   */
  type InferSelectorType<S> = S extends StringSelector
    ? string
    : S extends ArrayStringSelector
    ? string[]
    : S extends ArrayObjectSelector<infer T>
    ? T[]
    : S extends ObjectSelector<infer T>
    ? T
    : S extends FunctionSelector
    ? any
    : S extends RegExpSelector
    ? string | null
    : any;
}

/**
 * Create a new X-Ray instance
 * @param options - Configuration options
 */
declare function XRay(options?: XRay.Options): XRay.Instance;

export = XRay;
