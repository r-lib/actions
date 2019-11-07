linux-os-info
=================

Get OS release info from the node `os` module and, for Linux releases, from the `'/etc/os-release'`, `/usr/lib/os-release`, or `/etc/alpine-release` file. If none of those files exists it returns only the node `os` module info (platform, hostname, release, and arch)

### Highlights
* Lightweight without any dependencies (only native Node modules)
* Synchronous, callback, or promise - choose how you want to use it.


## Installation

    npm install --save linux-os-info

## Usage

```
const osInfo = require('linux-os-info')

// the example presumes running some flavor of linux.

// synchronous - use an options argument with {mode: 'sync'}
var result = osInfo({mode: 'sync'})
console.log(`You are using ${result.pretty_name} on a ${result.arch} machine`)

// asynchronous - pass a function as the mode
osInfo({mode: function (err, result) {
  console.log(`You are using ${result.pretty_name} on a ${result.arch} machine`)
}})

// promise - no arguments or no mode specified
osInfo()
  .then(result => {
    console.log(`You are using ${result.pretty_name} on a ${result.arch} machine`)
  })
  .catch(err => console.error(`Error reading OS release info: ${err}`))

```
On my machine all three versions output:
```
You are using Ubuntu 18.04 LTS on a x64 machine
```

The API completely changed from version 1. The single, optional argument is an options object.

v1: `osInfo({synchronous: true})`
v2: `osInfo({mode: 'sync'})`

v1: `osInfo(function (err, data) {...})`
v2: `osInfo({mode: function (err, data) (...)})`

v2 *NEVER* returns errors (unless there is an internal error). The data object returned now has a file property which holds the file that was read (one of those in the list above). If no file was read it holds an instance of `Error`. Because node's `os` information is always returned the file data is considered optional.


#### Sample outputs

These example outputs are courtesy of Samuel Carreira. His (linux-release-info)[https://github.com/samuelcarreira/linux-release-info] combined with my wanting a synchronous version were the inspiration for this package.

v2 note: the `file` property is not shown in these examples.

**Linux**
```
{ type: 'Linux',
  platform: 'linux',
  hostname: 'VirtualBoxLINUX',
  arch: 'x64',
  release: '4.13.0-32-generic',
  name: 'Ubuntu',
  version: '17.10 (Artful Aardvark)',
  id: 'ubuntu',
  id_like: 'debian',
  pretty_name: 'Ubuntu 17.10',
  version_id: '17.10',
  home_url: 'https://www.ubuntu.com/',
  support_url: 'https://help.ubuntu.com/',
  bug_report_url: 'https://bugs.launchpad.net/ubuntu/',
  privacy_policy_url: 'https://www.ubuntu.com/legal/terms-and-policies/privacy-policy',
  version_codename: 'artful',
  ubuntu_codename: 'artful' }
```
**Linux (Raspberry Pi)**
```
{ type: 'Linux',
  platform: 'linux',
  hostname: 'raspberrypi',
  arch: 'arm',
  release: '4.9.59-v7+',
  pretty_name: 'Raspbian GNU/Linux 9 (stretch)',
  name: 'Raspbian GNU/Linux',
  version_id: '9',
  version: '9 (stretch)',
  id: 'raspbian',
  id_like: 'debian',
  home_url: 'http://www.raspbian.org/',
  support_url: 'http://www.raspbian.org/RaspbianForums',
  bug_report_url: 'http://www.raspbian.org/RaspbianBugs' }
```
**Linux (Fedora)**
```
{ type: 'Linux',
  platform: 'linux',
  hostname: 'localhost-live',
  arch: 'x64',
  release: '4.13.9-300.fc27.x86_64',
  name: 'Fedora',
  version: '27 (Workstation Edition)',
  id: 'fedora',
  version_id: '27',
  pretty_name: 'Fedora 27 (Workstation Edition)',
  ansi_color: '0;34',
  cpe_name: 'cpe:/o:fedoraproject:fedora:27',
  home_url: 'https://fedoraproject.org/',
  support_url: 'https://fedoraproject.org/wiki/Communicating_and_getting_help',
  bug_report_url: 'https://bugzilla.redhat.com/',
  redhat_bugzilla_product: 'Fedora',
  redhat_bugzilla_product_version: '27',
  redhat_support_product: 'Fedora',
  redhat_support_product_version: '27',
  privacy_policy_url: 'https://fedoraproject.org/wiki/Legal:PrivacyPolicy',
  variant: 'Workstation Edition',
  variant_id: 'workstation' }
```
**Windows**
```
{ type: 'Windows_NT',
  platform: 'win32',
  hostname: 'MYPC',
  arch: 'x64',
  release: '10.0.16299' }
```
**macOS**
```
{ type: 'Darwin',
  platform: 'darwin',
  hostname: 'Macbook-Air.home',
  arch: 'x64',
  release: '16.0.0' }
```

#### Windows and Macs?
If you want info about Windows or Mac releases, you can try the following modules from sindresorhus:
https://www.npmjs.com/package/win-release
or
https://www.npmjs.com/package/macos-release


## License
Licensed under MIT
