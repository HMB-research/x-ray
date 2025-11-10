'use strict'

const objectAssign = require('./lib/util').objectAssign
const streamToPromise = require('./lib/promisify')
const compact = require('./lib/util').compact
const isArray = require('./lib/util').isArray
const absolutes = require('./lib/absolutes')
const streamHelper = require('./lib/stream')
const isUrl = require('./lib/util').isUrl
const Crawler = require('@hmb-research/x-ray-crawler')
const resolve = require('./lib/resolve')
const root = require('./lib/util').root
const params = require('./lib/params')
const debug = require('debug')('x-ray')
const cheerio = require('cheerio')
const enstore = require('enstore')
const walk = require('./lib/walk')
const fs = require('fs')
const validateTypes = require('./lib/validate-types')

const CONST = {
  CRAWLER_METHODS: ['concurrency', 'throttle', 'timeout', 'driver', 'delay', 'limit', 'abort'],
  INIT_STATE: {
    stream: false,
    concurrency: Infinity,
    paginate: false,
    limit: Infinity,
    abort: false
  }
}

function Xray (options) {
  const crawler = Crawler()
  options = options || {}
  const filters = options.filters || {}
  const customTypes = {} // Storage for custom type handlers
  const strictMode = options.strict || false // Enable strict type validation

  function xray (source, scope, selector) {
    const args = params(source, scope, selector)
    selector = args.selector
    source = args.source
    scope = args.context

    const state = objectAssign({}, CONST.INIT_STATE)
    const store = enstore()
    let pages = []
    let stream

    const walkHTML = WalkHTML(xray, selector, scope, filters, customTypes, strictMode)
    const request = Request(crawler)

    function node (source2, fn) {
      if (arguments.length === 1) {
        fn = source2
      } else {
        source = source2
      }

      debug('params: %j', {
        source,
        scope,
        selector
      })

      if (isUrl(source)) {
        debug('starting at: %s', source)
        request(source, function (err, html) {
          if (err) return next(err)
          const $ = load(html, source)
          walkHTML($, next)
        })
      } else if (scope && ~scope.indexOf('@')) {
        debug('resolving to a url: %s', scope)
        const url = resolve(source, false, scope, filters)

        // ensure that a@href is a URL
        if (!isUrl(url)) {
          debug('%s is not a url. Skipping!', url)
          return walkHTML(load(''), next)
        }

        debug('resolved "%s" to a %s', scope, url)
        request(url, function (err, html) {
          if (err) return next(err)
          const $ = load(html, url)
          walkHTML($, next)
        })
      } else if (source) {
        const $ = load(source)
        walkHTML($, next)
      } else {
        debug('%s is not a url or html. Skipping!', source)
        return walkHTML(load(''), next)
      }

      function next (err, obj, $) {
        if (err) return fn(err)
        const paginate = state.paginate
        const limit = --state.limit

        // create the stream
        if (!stream) {
          if (paginate) stream = streamHelper.array(state.stream)
          else stream = streamHelper.object(state.stream)
        }

        if (paginate) {
          if (isArray(obj)) {
            pages = pages.concat(obj)
          } else {
            pages.push(obj)
          }

          if (limit <= 0) {
            debug('reached limit, ending')
            stream(obj, true)
            return fn(null, pages)
          }

          const url = resolve($, false, paginate, filters)
          debug('paginate(%j) => %j', paginate, url)

          if (!isUrl(url)) {
            debug('%j is not a url, finishing up', url)
            stream(obj, true)
            return fn(null, pages)
          }

          if (state.abort && state.abort(obj, url)) {
            debug('abort check passed, ending')
            stream(obj, true)
            return fn(null, pages)
          }

          stream(obj)

          // debug
          debug('paginating %j', url)
          isFinite(limit) && debug('%s page(s) left to crawl', limit)

          request(url, function (err, html) {
            if (err) return next(err)
            const $ = load(html, url)
            walkHTML($, next)
          })
        } else {
          stream(obj, true)
          fn(null, obj)
        }
      }

      return node
    }

    node.abort = function (validator) {
      if (!arguments.length) return state.abort
      state.abort = validator
      return node
    }

    node.paginate = function (paginate) {
      if (!arguments.length) return state.paginate
      state.paginate = paginate
      return node
    }

    node.limit = function (limit) {
      if (!arguments.length) return state.limit
      state.limit = limit
      return node
    }

    node.stream = function () {
      state.stream = store.createWriteStream()
      const rs = store.createReadStream()
      streamHelper.waitCb(rs, node)
      return rs
    }

    node.write = function (path) {
      if (!arguments.length) return node.stream()
      state.stream = fs.createWriteStream(path)
      streamHelper.waitCb(state.stream, node)
      return state.stream
    }

    node.then = function (resHandler, errHandler) {
      return streamToPromise(node.stream()).then(resHandler, errHandler)
    }

    return node
  }

  CONST.CRAWLER_METHODS.forEach(function (method) {
    xray[method] = function () {
      if (!arguments.length) return crawler[method]()
      crawler[method].apply(crawler, arguments)
      return this
    }
  })

  /**
   * Register or get a custom type handler
   * @param {string} name - The name of the custom type
   * @param {Function} handler - The handler function (optional for getter)
   * @param {Function} validator - Optional validator function to identify this type
   * @returns {*} The xray instance (setter) or the handler (getter)
   */
  xray.type = function (name, handler, validator) {
    if (arguments.length === 1) {
      // Getter
      return customTypes[name] ? customTypes[name].handler : undefined
    }
    // Setter
    customTypes[name] = {
      handler,
      validator: validator || null
    }
    return xray
  }

  return xray
}

function Request (crawler) {
  return function request (url, fn) {
    debug('fetching %s', url)
    crawler(url, function (err, ctx) {
      if (err) return fn(err)
      debug('got response for %s with status code: %s', url, ctx.status)
      return fn(null, ctx.body)
    })
  }
}

function load (html, url) {
  html = html || ''
  let $ = html.html ? html : cheerio.load(html, { decodeEntities: false })
  if (url) $ = absolutes(url, $)
  return $
}

function WalkHTML (xray, selector, scope, filters, customTypes, strictMode) {
  return function walkHTML ($, fn) {
    // Validate selector in strict mode
    if (strictMode) {
      try {
        validateTypes.assertValidType(selector, 'selector', { customTypes })
      } catch (err) {
        return fn(err)
      }
    }

    walk(selector, function (v, k, next) {
      // Handle null/undefined (optional fields)
      if (v === null || v === undefined) {
        return next(null, null)
      }

      // Handle string selector
      if (typeof v === 'string') {
        const value = resolve($, root(scope), v, filters)
        return next(null, value)
      }

      // Handle function selector
      if (typeof v === 'function') {
        return v($, function (err, obj) {
          if (err) return next(err)
          return next(null, obj)
        })
      }

      // Handle RegExp selector
      if (v instanceof RegExp) {
        // Extract text from current cheerio context
        // $ could be the whole document or a scoped selection
        let text = ''
        if ($.root) {
          // Full cheerio instance
          text = $.root().text()
        } else if ($.text) {
          // Scoped selection (e.g., from array iteration)
          text = $.text()
        } else {
          text = String($)
        }
        debug('RegExp selector: pattern=%s, text=%s', v, text)
        const match = text.match(v)
        const result = match ? (match[1] !== undefined ? match[1] : match[0]) : null
        debug('RegExp result: %s', result)
        return next(null, result)
      }

      // Handle custom types (check before arrays and objects)
      if (customTypes && typeof customTypes === 'object') {
        for (const typeName in customTypes) {
          const typeConfig = customTypes[typeName]
          if (typeConfig.validator && typeConfig.validator(v)) {
            return typeConfig.handler(v, $, scope, filters, next)
          }
        }
      }

      // Handle array selector
      if (isArray(v)) {
        if (typeof v[0] === 'string') {
          return next(null, resolve($, root(scope), v, filters))
        } else if (typeof v[0] === 'object') {
          const $scope = $.find ? $.find(scope) : $(scope)
          let pending = $scope.length
          const out = []

          // Handle the empty result set (thanks @jenbennings!)
          if (!pending) return next(null, out)

          return $scope.each(function (i, el) {
            const $innerscope = $scope.eq(i)
            const node = xray(scope, v[0])
            node($innerscope, function (err, obj) {
              if (err) return next(err)
              out[i] = obj
              if (!--pending) {
                return next(null, compact(out))
              }
            })
          })
        }
      }

      // Unknown type - log warning in debug mode, skip in normal mode
      if (strictMode) {
        const validation = validateTypes.validateType(v, k, { customTypes })
        if (!validation.valid) {
          return next(new TypeError(validation.error))
        }
      }

      debug('unknown selector type for "%s": %s', k, typeof v)
      return next()
    }, function (err, obj) {
      if (err) return fn(err)
      fn(null, obj, $)
    })
  }
}

module.exports = Xray
