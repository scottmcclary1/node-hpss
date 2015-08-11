"use strict";

var fs = require('fs');
var spawn = require('child_process').spawn;
var through = require('through2');
var split = require('split');
var EventEmitter = require("events").EventEmitter;

var firewall = 'on'; //or off (TODO - allow user to set this)

function simplecmd(cmd, opts, cb, linecb) {
    var p = spawn('hsi', ['firewall -'+firewall+'; '+cmd], opts);
    var lines = [];
    var header = [];
  
    //setup a line parser
    p.stderr.pipe(split()).pipe(through(function(buf, _, next){
        var line = buf.toString();
        if(header.length < 2) {
            //what should I do with header info? it looks like
            //Username: hayashis  UID: 740536  Acct: 740536(740536) Copies: 1 Firewall: off [hsi.5.0.1.p1 Wed Dec 31 14:56:17 EST 2014]
            //A: firewall mode set ON, I/O mode set to extended (parallel=off), autoscheduling currently set to OFF
            header.push(line);
        } else {
            lines.push(line);
            if(linecb) linecb(line);
        }
        next();
    }));
    p.on('close', function(code, signal) {
        //console.log("closed with :"+code);
        //console.dir(header);
        if(code == 0) cb(null, lines);
        else cb({code: code, signal: signal}, lines);
    });
    p.on('error', function(err) {
        //like cwd set to a wrong path or such..
        cb(err);
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
            mode: parse_mode(tokens[0]),
            links: parseInt(tokens[2]),
            owner: tokens[4],
            group: tokens[6],
            cos: tokens[8],
            size: parseInt(tokens[10]),
            date: new Date(tokens[12]+" "+tokens[14]+" "+tokens[16]),
            entry: parse_entry(tokens.splice(18).join(" ")),
            _raw: out,
            //_tokens: tokens 
        }
    } else {
        //-rw-------    1 hayashis  hpss          1       740536 DISK           572 Aug 10 20:55 package.json
        //file
        return {
            mode: parse_mode(tokens[0]),
            links: parseInt(tokens[2]),
            owner: tokens[4],
            group: tokens[6],
            cos: tokens[8],
            acct: tokens[10],
            where: tokens[12],
            size: parseInt(tokens[14]),
            date: new Date(tokens[16]+" "+tokens[18]+" "+tokens[20]),
            entry: parse_entry(tokens.splice(22).join(" ")),
            _raw: out,
            //_tokens: tokens 
        }
    }
}

exports.ls = function(path, cb) {
    simplecmd('ls -UN '+path, {}, function(err, lines) {
        console.dir(lines);
        if(err) {
            //hsi/ls return codes (??)
            //64: missing?
            cb(err, lines);
        } else {
            var files = [];
            //lines = lines.splice(2);
            lines.forEach(function(line) {
                if(line == '') return;
                //files.push(line.split(" ")); 
                files.push(parse_lsout(line));
            });
            cb(null, files);
        }
    });
}

exports.help = function(cb) {
    simplecmd('help', {}, function(err, lines) {
        //var all_lines = lines.join('\n');
        cb(err, lines);
    });
}

exports.version = function(cb) {
    simplecmd('version', {}, function(err, lines) {
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

exports.get = function(hpsspath, localdest, cb, progress_cb) {
    exports.ls(hpsspath, function(err, files) {
        if(err) {
            //can't ls - then can't get
            console.dir(files);
            return cb(err)
        } 
        console.dir(files);
        var file = files[0];
        var start = Date.now();
        var total_size = parseInt(file.size);

        function progress() {
            var stats = fs.statSync(localdest+"/"+file.entry);
            var now = Date.now();
            console.log("progress: "+file.size+" "+total_size);
            progress_cb({progress: stats.size / total_size, total_size: total_size, transferred_size: stats.size, elapsed_time: now - start});
        }
        var p = setInterval(progress, 1000);

        simplecmd('get '+hpsspath, {cwd: localdest}, function(err, lines) {
            clearInterval(p);
            if(err) {
                console.dir(err);
                cb(err, lines);
            } else {
                //success!
                //console.dir(lines);
                progress(); //send last progress
                cb(null);
            }
        }, function(line) {
            console.log("get:"+line);
        });

    });
}


