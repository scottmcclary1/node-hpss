"use strict";

//os
var fs = require('fs');
var spawn = require('child_process').spawn;
var EventEmitter = require("events").EventEmitter;

//contrib
var split = require('split');
var through = require('through2');

//mine
var hpss = require('./app').hpss;

function simplecmd(cmd, opts, cb, linecb) {
    //start with empty env (if not set by user)
    if(opts.env == undefined) opts.env = {};
    //copy all htpss.env to opts.env (if not set yet)
    if(hpss.env) {
        for(var k in hpss.env) {
            if(opts.env[k] === undefined) opts.env[k] = hpss.env[k];
        }
    }
    //copy all process.env to opts.env (if not set yet)
    for(var k in process.env) {
        if(opts.env[k] === undefined) opts.env[k] = process.env[k];
    }

    if(hpss.behind_firewall) {
        cmd = 'firewall -on; '+cmd;
    } else {
        cmd = 'firewall -off; '+cmd;
    }

    var lines = [];
    var header = [];
    var skipped = 0;
    var reached_limit = false;
    var p = spawn('hsi', [cmd], opts);
    var err = null;
    //setup a line parser
    p.stderr.pipe(split()).pipe(through(function(buf, _, next){
        var line = buf.toString();
        if(header.length < 2) {
            //what should I do with header info? it looks like
            //Username: hayashis  UID: 740536  Acct: 740536(740536) Copies: 1 Firewall: off [hsi.5.0.1.p1 Wed Dec 31 14:56:17 EST 2014]
            //A: firewall mode set ON, I/O mode set to extended (parallel=off), autoscheduling currently set to OFF
            header.push(line);
        } else {
            //skip first few lines specified by opts.offset
            if(opts.offset && opts.offset > skipped) {
                skipped++;
            } else {
                //console.log(line);
                lines.push(line);
                if(linecb) linecb(line);

                //terminate if it reaches the number of lines requested by limit
                if(opts.limit && opts.limit == lines.length) {       
                    p.kill('SIGTERM');
                    reached_limit = true;
                    cb(null, lines, reached_limit); 
                }
            }
        }
        next();
    }));
    p.on('close', function(code, signal) {
        //console.log("hsi finished");
        //console.log(code);
        //console.log(signal);
        if(!reached_limit) {
            if(err) return cb(err, lines);
            if(code != 0) return cb({code: code, signal: signal, err: err}, lines);
            cb(null, lines);
        }
    });
    p.on('error', function(_err) {
        //like cwd set to a wrong path or such..
        console.log("hsi command failed:"+cmd); 
        console.dir(err);
        console.dir(opts);
        //'close' will still fire so defer for that event and pass err through it
        err = _err;
    });
}

function parse_mode(p) {
    //drwx------ 
    function tf(c) {
        if(c == '-') return false;
        return true;
    }
    //TODO - need to handle sticky bits?
    return {
        directory: tf(p[0]),
        ur: tf(p[1]),
        uw: tf(p[2]),
        ux: tf(p[3]),
        gr: tf(p[4]),
        gw: tf(p[5]),
        gx: tf(p[6]),
        or: tf(p[7]),
        ow: tf(p[8]),
        ox: tf(p[9])
    }
}

function parse_entry(out) {
    var p = out.lastIndexOf("/");
    if(p === -1) return out;
    return out.substr(p+1);
}

function parse_lsout(out) {
    var tokens = out.split(/(\s+)/);
    if(out[0] == "d") {
        //drwx------    2 hayashis  hpss                  740536                512 Aug 10 20:55 subdir
        //directory
        return {
            directory: (tokens[0][0] == 'd'?true:false),
            mode: tokens[0], //parse_mode(tokens[0]),
            links: parseInt(tokens[2]),
            owner: tokens[4],
            group: tokens[6],
            cos: tokens[8],
            size: parseInt(tokens[10]),
            date: new Date(tokens[12]+" "+tokens[14]+" "+tokens[16]),
            entry: parse_entry(tokens.splice(18).join("")),
            _raw: out,
            //_tokens: tokens 
        }
    } else {
        //-rw-------    1 hayashis  hpss          1       740536 DISK           572 Aug 10 20:55 package.json
        //file
        return {
            directory: (tokens[0][0] == 'd'?true:false),
            mode: tokens[0], //parse_mode(tokens[0]),
            links: parseInt(tokens[2]),
            owner: tokens[4],
            group: tokens[6],
            cos: tokens[8],
            acct: tokens[10],
            where: tokens[12],
            size: parseInt(tokens[14]),
            date: new Date(tokens[16]+" "+tokens[18]+" "+tokens[20]),
            entry: parse_entry(tokens.splice(22).join("")),
            _raw: out,
            //_tokens: tokens 
        }
    }
}

/*
function isFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}
*/

exports.ls = function(path, opts, cb) {
    //make opts optional
    if(typeof(opts) === 'function' && cb == undefined) {
        cb = opts;
        opts = {};
    }
    simplecmd('ls -UN \"'+path+'\"', opts, function(err, lines, reached_limit) {
        if(err) {
            //hsi/ls return codes (??)
            //64: missing?
            cb(err, lines);
        } else {
            var files = [];
            //lines = lines.splice(2);
            lines.forEach(function(line) {
                if(line == '') return; //last line?
                //files.push(line.split(" ")); 
                files.push(parse_lsout(line));
            });
            if(reached_limit) {
                files.push({next: opts.offset + opts.limit});
            }
            cb(null, files);
        }
    });
}

exports.help = function(opts, cb) {
    //make opts optional
    if(typeof(opts) === 'function' && cb == undefined) {
        cb = opts;
        opts = {};
    }
    simplecmd('help', opts, function(err, lines) {
        //var all_lines = lines.join('\n');
        cb(err, lines);
    });
}

exports.version = function(opts, cb) {
    //make opts optional
    if(typeof(opts) === 'function' && cb == undefined) {
        cb = opts;
        opts = {};
    }
    simplecmd('version', opts, function(err, lines) {
        if(err) {
            cb(err, lines);
        } else {
            var props = {};
            lines.forEach(function(line) {
                var pos = line.indexOf(":");
                if(pos !== -1) {
                    var k = line.substr(0, pos);
                    var v = line.substr(pos+2);
                    props[k] = v;
                }
            });
            cb(null, props);
        }
    });
}

exports.rmdir = function(hpsspath, opts, cb) {
    //make opts optional
    if(typeof(opts) === 'function' && cb == undefined) {
        cb = opts;
        opts = {};
    }
    simplecmd('rmdir \"'+hpsspath+'\"', opts, function(err, lines) {
        cb(err, lines);
    });
}

exports.rm = function(hpsspath, opts, cb) {
    //make opts optional
    if(typeof(opts) === 'function' && cb == undefined) {
        cb = opts;
        opts = {};
    }
    simplecmd('rm \"'+hpsspath+'\"', opts, function(err, lines) {
        //console.dir(err);
        //console.dir(lines);
        cb(err, lines);
    });
}

exports.touch = function(hpsspath, opts, cb) {
    //make opts optional
    if(typeof(opts) === 'function' && cb == undefined) {
        cb = opts;
        opts = {};
    }
    simplecmd('touch \"'+hpsspath+'\"', opts, function(err, lines) {
        //console.dir(err);
        //console.dir(lines);
        cb(err, lines);
    });
}

exports.mkdir = function(hpsspath, opts, cb) {
    //make opts optional
    if(typeof(opts) === 'function' && cb == undefined) {
        cb = opts;
        opts = {};
    }
    simplecmd('mkdir \"'+hpsspath+'\"', opts, function(err, lines) {
        cb(err, lines);
    });
}

exports.get = function(hpsspath, localdest, opts, cb, progress_cb) {
    //make opts optional 
    if(typeof(opts) === 'function') {
        progress_cb = cb;
        cb = opts;
        opts = {};
    }
    exports.ls(hpsspath, opts, function(err, files) {
        if(err) {
            return cb(err, files)
        } 
        var file = files[0];
        var start = Date.now();
        var total_size = parseInt(file.size);
        var progress_complete = false;

        function progress() {
            try {
                var stats = fs.statSync(localdest+"/"+file.entry);
                var per = stats.size / total_size;
                progress_cb({/*get: hpsspath,*/ progress: per, total_size: total_size, transferred_size: stats.size, elapsed_time: Date.now() - start});
                if(per == 1) progress_complete = true;
            } catch (e) {
                progress_cb({progress: 0, total_size: total_size, transferred_size: 0, elapsed_time: Date.now() - start});
            }
        }
        var p = null;
        if(progress_cb) p = setInterval(progress, 1000);

        //if localdest is missing, spawn will generate error (TODO - just got get command?)
        if(opts.cwd == undefined) opts.cwd = localdest;
        //TODO should I double-quote escape hpsspath?
        simplecmd('get \"'+hpsspath+'\"', opts, function(err, lines) {
            clearInterval(p);
            if(err) {
                //console.dir(err);
                cb(err, lines);
            } else {
                //success! - lines will contain information like (TODO should I parse?)
                ///hpss/h/a/hayashis/node-v0.10.29-linux-x64.tar.gz: (md5) OK
                //get  'node-v0.10.29-linux-x64.tar.gz' : '/hpss/h/a/hayashis/node-v0.10.29-linux-x64.tar.gz' (2014/07/16 14:56:29 5362980 bytes, 25094.1 KBS )
                
                //we haven't sent progress: 1.0 yet.. let's make another call
                if(progress_cb && !progress_complete) progress();
                cb(null, lines);
            }
        });
    });
}

exports.put = function(localpath, hpsspath, opts, cb, progress_cb) {
    //make opts optional 
    if(typeof(opts) === 'function') {
        progress_cb = cb;
        cb = opts;
        opts = {};
    }

    var start = Date.now();
    var progress_complete = false;

    function progress() {
        exports.ls(hpsspath, opts, function(err, files) {
            if(err) {
                //file may not exist yet on remote... 
                progress_cb({progress: 0, total_size: src.size, transferred_size: 0, elapsed_time: Date.now() - start});
            } else {
                var file = files[0];
                var per = file.size / src.size;
                progress_cb({/*put: localpath,*/ progress: per, total_size: src.size, transferred_size: file.size, elapsed_time: Date.now() - start});
                if(per == 1) progress_complete = true;
            }
        });
    }

    try {
        var src = fs.statSync(localpath); //throws if localsrc doesn't exist
        var p = null;
        if(progress_cb) p = setInterval(progress, 3000); //calling hsi ls every 3 seconds should be enough?
        //TODO shouldn't I double-quote escape localpath/hpsspath?
        simplecmd('put \"'+localpath+'\" : \"'+hpsspath+'\"', opts, function(err, lines) {
            clearInterval(p);
            if(err) {
                cb(err, lines);
            } else {
                //send 1 more progress report before calling it done
                if(progress_cb && !progress_complete) progress_cb({progress: 1, total_size: src.size, transferred_size: src.size, elapsed_time: Date.now() - start});
                cb(null, lines);
            }
        });
    } catch (e) {
        cb(e); //code.ENOENT?
    }
}

