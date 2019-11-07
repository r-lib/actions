'use strict'

const fs = require("fs")
const os = require("os")

/**
 * Get OS release info from the node os module and augment that with information
 * from '/etc/os-release', '/usr/lib/os-release', or '/etc/alpine-release'. The
 * information in that file is distribution-dependent. If not Linux return only
 * the node os module info.
 *
 * @returns info {object} via Promise | callback | return value
 *
 * the file property in the info object will be filled in with one of:
 *   - undefined, if not Linux
 *   - the file path (above) used
 *   - an Error instance if no file could be read
 */
function linuxOsInfo (opts) {
  let outputData = {
    type: os.type(),
    platform: os.platform(),
    hostname: os.hostname(),
    arch: os.arch(),
    release: os.release(),
    file: undefined,
  }

  let mode = 'promise'
  opts = opts || {}



  const list = Array.isArray(opts.list) ? opts.list : defaultList

  if (typeof opts.mode === 'function') {
    mode = 'callback'
  } else if (opts.mode === 'sync') {
    mode = 'sync'
  }

  if (os.type() !== 'Linux') {
    if (mode === 'promise') {
      return Promise.resolve(outputData)
    } else if (mode === 'callback') {
      return opts.mode(null, outputData)
    } else {
      return outputData
    }
  }

  if (mode === 'sync') {
    return synchronousRead()
  } else {
    // return a Promise that can be ignored if caller expects a callback
    return new Promise(asynchronousRead)
  }

  // loop through the file list synchronously
  function synchronousRead () {
    for (let i = 0; i < list.length; i++) {
      let data
      try {
        data = fs.readFileSync(list[i].path, 'utf8')
        list[i].parser(data, outputData)
        outputData.file = list[i].path
        return outputData
      } catch (e) {
        // accumulate errors?
      }
    }
    outputData.file = new Error('linux-os-info - no file found')
    return outputData
  }

  // loop through the file list on completion of async reads
  function asynchronousRead (resolve, reject) {
    let i = 0

    function tryRead () {
      if (i >= list.length) {
        const e = new Error('linux-os-info - no file found')
        outputData.file = e
        mode === 'promise' ? resolve(outputData) : opts.mode(null, outputData)
      } else {
        // try to read the file.
        let file = list[i].path
        fs.readFile(file, 'utf8', (err, data) => {
          if (err) {
            i += 1
            tryRead()
          } else {
            list[i].parser(data, outputData)
            outputData.file = file
            mode === 'promise' ? resolve(outputData) : opts.mode(null, outputData)
          }
        })
      }
    }

    tryRead()
  }
}

//
// the default list of files to try to read and their parsers.
// in theory this can be replaced, especially for testing purposes.
// but it's not documented at this time unless one is reading this.
//
const defaultList = [
  {path: '/etc/os-release', parser: etcOsRelease},
  {path: '/usr/lib/os-release', parser: usrLibOsRelease},
  {path: '/etc/alpine-release', parser: etcAlpineRelease}
]

//
// helper functions to parse file data
//

function etcOsRelease(data, outputData) {
  addOsReleaseToOutputData(data, outputData)
}

function usrLibOsRelease(data, outputData) {
  addOsReleaseToOutputData(data, outputData)
}

// the alpine-release file only contains the version string
// so fill in the basics based on that.
function etcAlpineRelease(data, outputData) {
  outputData.name = 'Alpine'
  outputData.id = 'alpine'
  outputData.version = data
  outputData.version_id = data
}

function addOsReleaseToOutputData(data, outputData) {
  const lines = data.split('\n')

  lines.forEach(line => {
    let index = line.indexOf('=')
    // only look at lines with at least a one character key
    if (index >= 1) {
      // lowercase key and remove quotes on value
      let key = line.slice(0, index).toLowerCase()
      let value = line.slice(index + 1).replace(/"/g, '')

      Object.defineProperty(outputData, key, {
        value: value,
        writable: true,
        enumerable: true,
        configurable: true
      })
    }
  });
}

module.exports = linuxOsInfo

//
// a tiny bit of testing
//
if (require.main === module) {

  console.log('testing synchronous')
  console.log('synchronous:', linuxOsInfo({mode: 'sync'}))

  console.log('testing promise')
  linuxOsInfo()
    .then(r => console.log('promise:', r))
    .catch(e => console.log('promise error:', e))

  console.log('testing callback')
  linuxOsInfo({mode: function (err, data) {console.log('callback:', data)}})
}
