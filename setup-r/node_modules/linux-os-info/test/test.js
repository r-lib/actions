const osInfo = require('../index')
const should = require('should')
const os = require('os')
const fs = require('fs')

let osData = {
  type: os.type(),
  platform: os.platform(),
  hostname: os.hostname(),
  arch: os.arch(),
  release: os.release(),
  file: undefined,
}

const paths = ['/etc/os-release', '/usr/lib/os-release', '/etc/alpine-release']

let osRelease
for (let i = 0; i < paths.length; i++) {
  try {
    osRelease = fs.readFileSync(paths[i], 'utf8')
    if (osRelease) {
      osData.file = paths[i]
      break
    }
  } catch (e) {
    console.log('could not read', paths[i])
  }
}
let expected

if (osData.file === '/etc/alpine-release') {
  osData.name = 'Alpine'
  osData.id = 'alpine'
  osData.version = osRelease
  osData.version_id = osRelease
  expected = osData
} else {
  let lines = osRelease.split('\n')

  // use different logic to determine the KV pairs
  let osKVPairs = {}
  lines.forEach(line => {
    let m = line.match(/(.+)=("{0,1})(.*)\2/)
    if (m) {
      osKVPairs[m[1].toLowerCase()] = m[3]
    }
  })
  expected = Object.assign({}, osData, osKVPairs)
}

//
// run the tests
//
describe('linux-os-info', function () {
  it('should work by returning a promise', function (done) {
    let p = osInfo()
    p.should.be.instanceOf(Promise)

    p.then(info => {
      compare(info, expected)
      done()
    }).catch(e => {
      throw e
      done()
    })
  })

  it('should work with a callback', function (done) {
    osInfo({mode: function (err, info) {
      compare(info, expected)
      done()
    }})
  })

  it('should work synchronously', function () {
    let info = osInfo({mode: 'sync'})
    compare(info, expected)
  })

  it('should return os info when no release file is found', function () {
    let info = osInfo({mode: 'sync', list: []})
    let e = new Error('linux-os-info - no file found')
    let expected = Object.assign({}, osData, {file: e})
    compare(info, expected)

    osInfo({mode: function (err, info) {
      compare(info, expected)
    }, list: []})

    osInfo({list: []}).then(info => {
      compare(info, expected)
    })
  })

  describe('OS-specific tests', function () {
    let info = osInfo({synchronous: true})

    // ubuntu 18.04
    test = info.version_codename === 'bionic' ? it : it.skip
    test('should handle a quoted value for bionic beaver', function () {
      info.pretty_name.should.equal('Ubuntu 18.04 LTS')
    })
    test('should handle an unquoted value for bionic beaver', function () {
      info.id.should.equal('ubuntu')
    })

    // ubuntu 17.10
    test = info.version_codename === 'artful' ? it : it.skip
    test('should handle a quoted value for artful aardvark', function () {
      info.pretty_name.should.equal('Ubuntu 17.10')
    })

  })

  function compare (info, expected) {
    let iKeys = Object.keys(info)
    let eKeys = Object.keys(expected)

    iKeys.forEach(key => {
      expected.should.have.property(key, info[key])
    })

    iKeys.length.should.equal(eKeys.length)
  }

  function test (condition) {
    return condition ? it : it.skip
  }

})


