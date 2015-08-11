# node-hpss
hpss / hsi interface for nodejs

## Installation

```
npm install node-hpss
```

## Sample Use

### hsi.ls

```
var hsi = require("hpss").hsi;

hsi.ls('some/path/in/hpss', function(err, files) {
    console.dir(files);
});

```

files will contain list of files / directories. I might change the mode / owner / group etc.. into a single fs.Stats object in the future version..

```
[ { mode:
     { directory: false,
       ur: true,
       uw: true,
       ux: false,
       gr: false,
       gw: false,
       gx: false,
       or: false,
       ow: false,
       ox: false },
    links: 1,
    owner: 'hayashis',
    group: 'hpss',
    cos: '3',
    acct: '740536',
    where: 'DISK',
    size: 7591690240,
    date: Sun May 20 2001 09:07:00 GMT+0000 (UTC),
    entry: 'CentOS-7-x86_64-Everything-1503-01.iso',
    _raw: '-rw-------    1 hayashis  hpss          3       740536 DISK    7591690240 May 20 09:07 isos/CentOS-7-x86_64-Everything-1503-01.iso' },
  { mode:
     { directory: true,
       ur: true,
       uw: true,
       ux: true,
       gr: false,
       gw: false,
       gx: false,
       or: false,
       ow: false,
       ox: false },
    links: 2,
    owner: 'hayashis',
    group: 'hpss',
    cos: '740536',
    size: 512,
    date: Fri Aug 10 2001 20:55:00 GMT+0000 (UTC),
    entry: 'subdir',
    _raw: 'drwx------    2 hayashis  hpss                  740536                512 Aug 10 20:55 isos/subdir' },
  { mode:
     { directory: false,
       ur: true,
       uw: true,
       ux: false,
       gr: false,
       gw: false,
       gx: false,
       or: false,
       ow: false,
       ox: false },
    links: 1,
    owner: 'hayashis',
    group: 'hpss',
    cos: '3',
    acct: '740536',
    where: 'DISK',
    size: 1044381696,
    date: Sun May 20 2001 09:06:00 GMT+0000 (UTC),
    entry: 'ubuntu-14.04.2-desktop-amd64.iso',
    _raw: '-rw-------    1 hayashis  hpss          3       740536 DISK    1044381696 May 20 09:06 isos/ubuntu-14.04.2-desktop-amd64.iso' } ]
```

## References

For a bit more detail on hsi/htar commands see https://www.olcf.ornl.gov/kb_articles/transferring-data-with-hsi-and-htar/
