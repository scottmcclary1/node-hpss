'use strict';

//node
var fs = require('fs');

//contrib
var tmp = require('tmp');

//mine
var app = require('./app');

//add session capability to hsi/htar
//{username: hayashis, keytab: __binary__}
function context(opt) {
    this.env = {};
    if(opt.username) this.env.HPSS_PRINCIPAL= opt.username;
    if(opt.keytab) {
        this.keytab = tmp.fileSync();
        var len = fs.writeSync(this.keytab.fd, opt.keytab, 0, opt.keytab.length); //need to set length or writeSync won't write anything..
        this.env.HPSS_AUTH_METHOD = "keytab";
        this.env.HPSS_KEYTAB_PATH = this.keytab.name;
    }
}
context.prototype.ls = function(path, cb) {
    var prev_env = app.hpss.env;
    app.hpss.env = this.env;
    app.hsi.ls(path, function(err, out) {
        app.hpss.env = prev_env; //restore
        cb(err, out);
    });
}
context.prototype.help = function(cb) {
    var prev_env = app.hpss.env;
    app.hpss.env = this.env;
    app.hsi.help(function(err, out) {
        app.hpss.env = prev_env; //restore
        cb(err, out);
    });
}
context.prototype.version = function(cb) {
    var prev_env = app.hpss.env;
    app.hpss.env = this.env;
    app.hsi.version(function(err, out) {
        app.hpss.env = prev_env; //restore
        cb(err, out);
    });
}
context.prototype.rmdir = function(path, cb) {
    var prev_env = app.hpss.env;
    app.hpss.env = this.env;
    app.hsi.rmdir(path, function(err, out) {
        app.hpss.env = prev_env; //restore
        cb(err, out);
    });
}
context.prototype.rm = function(path, cb) {
    var prev_env = app.hpss.env;
    app.hpss.env = this.env;
    app.hsi.rm(path, function(err, out) {
        app.hpss.env = prev_env; //restore
        cb(err, out);
    });
}
context.prototype.touch = function(path, cb) {
    var prev_env = app.hpss.env;
    app.hpss.env = this.env;
    app.hsi.touch(path, function(err, out) {
        app.hpss.env = prev_env; //restore
        cb(err, out);
    });
}
context.prototype.mkdir = function(path, cb) {
    var prev_env = app.hpss.env;
    app.hpss.env = this.env;
    app.hsi.mkdir(path, function(err, out) {
        app.hpss.env = prev_env; //restore
        cb(err, out);
    });
}
context.prototype.get = function(hpsspath, localdest, cb, progress_cb) {
    var prev_env = app.hpss.env;
    app.hpss.env = this.env;
    app.hsi.get(hpsspath, localdest, function(err, out) {
        app.hpss.env = prev_env; //restore
        cb(err, out);
    }, progress_cb);
}
context.prototype.put = function(lcoalpath, hpsspath, cb, progress_cb) {
    var prev_env = app.hpss.env;
    app.hpss.env = this.env;
    app.hsi.put(localpath, hpsspath, function(err, out) {
        app.hpss.env = prev_env; //restore
        cb(err, out);
    }, progress_cb);
}

context.prototype.clean = function() {
    if(this.keytab) this.keytab.removeCallback();
}


module.exports = context;
