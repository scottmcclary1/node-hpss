# node-hpss
hpss hsi/htar interface for nodejs.

Currently, only hsi command is supported (htar is still TODO). 

## Installation

```
npm install hpss
```

## Sample Use

### mkdir

Create a directory in HPSS

```
var fs = require("fs");
var hpss = require("hpss");
var context = new hpss.context({
    username: "hayashis",
    keytab: fs.readFileSync("/home/hayashis/.ssh/soichi-hsi.keytab")
});
context.mkdir('some/path/in/hpss', function(err) {
    if(err) throw err;
});

```

### rmdir

Remove an empty directory in HPSS

```
context.rmdir('some/path/in/hpss', function(err) {
    if(err) throw err;
});

```

Trying to remove a non-empty directory (or non-accessible directory) will return err.code: 64. Removing non-existing directory is no-op and results in null err.

### touch

```
context.touch('some/path/in/hpss/filename', function(err) {
    if(err) throw err;
});

```

### rm

Remove a file from HPSS

```
context.rm('some/path/in/hpss/filename', function(err) {
    if(err) throw err;
});

```

Trying to remove non-existing will result in err.code:72

### ls

```
context.ls('some/path/in/hpss', function(err, files) {
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
See test/test.js for error handling

### put

1st argument for hsi.put is the local file path, and 2nd is the remote (hpss) path. It needs to contain the file path (some.tar.gz) on remote path
Otherwise hsi will somehow not send any file..

```
context.put('/usr/local/some.tar.gz', '/hpss/path/some.tar.gz', function(err) {
    if(err) throw err;
}, function(progress) {
    console.dir(progress);
});
```

You can receive progress report via the 2nd callback function you provide (optional). I've throttled down the frequency of hsi.put progress message to 1 in every 3 seconds (1 second for hsi.get) since hsi.put progress reports requies hsi.ls call on the remote file.

```
{ progress: 0.4205854166191833,
  total_size: 508599432,
  transferred_size: 213909504,
  elapsed_time: 5251 }
{ progress: 0.8494176061132526,
  total_size: 508599432,
  transferred_size: 432013312,
  elapsed_time: 10274 }
{ progress: 1,
  total_size: 508599432,
  transferred_size: 508599432,
  elapsed_time: 12279 }
```

See test/test.js for error handling

### get

1st argument for hsi.get is the remote hpss path, and 2nd argument is the local directory name (not path - unlike hsi.put) 

```
context.get('hpss/path/some.tar.gz', '/usr/local/tmp', function(err) {
    if(err) throw err;
}, function(progress) {
    console.dir(progress);
});
```

You can receive progress report via the 2nd callback function you provide (optional)

```
{ progress: 0.4205854166191833,
  total_size: 508599432,
  transferred_size: 213909504,
  elapsed_time: 5251 }
{ progress: 0.8494176061132526,
  total_size: 508599432,
  transferred_size: 432013312,
  elapsed_time: 10274 }
{ progress: 1,
  total_size: 508599432,
  transferred_size: 508599432,
  elapsed_time: 12279 }
```

See test/test.js for error handling

## References

For a bit more detail on hsi/htar commands see https://www.olcf.ornl.gov/kb_articles/transferring-data-with-hsi-and-htar/

## TODO

I haven't implemented commands for htar yet.  htar doesn't seems to allow access through firewall-ed environment. Unlike hsi where I can specify "firewall -on" on the command line, I can't find an equivalent flag for htar. My dev/prod environment are behind firewall currently, so I can't develop (and it will be useless in prod) until I can find a way to go around this problem
