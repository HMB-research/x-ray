const isArray = require('./util').isArray

module.exports = {
  /**
   * Streaming array helper
   *
   * @param {Stream} data (optional)
   * @return {Function}
   */
  array: function streamArray (stream) {
    if (!stream) return function () {}
    let first = true

    return function streamArrayInner (data, end) {
      const string = JSON.stringify(data, true, 2)
      const json = isArray(data) ? string.slice(1, -1) : string
      const empty = json.trim() === ''

      if (first && empty && !end) return
      if (first) { stream.write('[\n') }
      if (!first && !empty) { stream.write(',') }

      if (end) {
        stream.end(json + ']')
      } else {
        stream.write(json)
      }

      first = false
    }
  },

  /**
   * Streaming object helper
   *
   * @param {Stream} data (optional)
   * @return {Function}
   */
  object: function streamObject (stream) {
    if (!stream) return function () {}

    return function streamObjectInner (data, end) {
      const json = JSON.stringify(data, true, 2)

      if (end) {
        stream.end(json)
      } else {
        stream.write(json)
      }
    }
  },

  waitCb: function streamCallback (stream, fn) {
    fn(function (err) {
      if (err) stream.emit('error', err)
    })
  }
}
