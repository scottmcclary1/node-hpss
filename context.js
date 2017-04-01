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
    if(opt && opt.username) this.env.HPSS_PRINCIPAL = opt.username;
    if(opt && opt.keytab) {
        this.keytab = tmp.fileSync();
        var len = fs.writeSync(this.keytab.fd, opt.keytab, 0, opt.keytab.length); //need to set length or writeSync won't write anything..
        this.env.HPSS_AUTH_METHOD = "keytab";
        this.env.HPSS_KEYTAB_PATH = this.keytab.name;
        if(app.hpss.debug) console.log("storing keytab in", this.keytab.name);
    }
    /*
    if(app.hpss.debug) {
        console.log("creating context");
        console.dir(this.env);
    }
    */
}
context.prototype.ls = function(path, opts, cb) {
    //make opts optional
    if(typeof(opts) === 'function' && cb == undefined) {
        cb = opts;
        opts = {};
    }
    var prev_env = app.hpss.env;
    app.hpss.env = this.env;
    app.hsi.ls(path, opts, function(err, out) {
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
context.prototype.version = function(opts, cb) {
    //make opts optional
    if(typeof(opts) === 'function' && cb == undefined) {
        cb = opts;
        opts = {};
    }
    var prev_env = app.hpss.env;
    app.hpss.env = this.env;
    app.hsi.version(function(err, out) {
        app.hpss.env = prev_env; //restore
        cb(err, out);
    });
}
context.prototype.rmdir = function(path, opts, cb) {
    //make opts optional
    if(typeof(opts) === 'function' && cb == undefined) {
        cb = opts;
        opts = {};
    }
    var prev_env = app.hpss.env;
    app.hpss.env = this.env;
    app.hsi.rmdir(path, opts, function(err, out) {
        app.hpss.env = prev_env; //restore
        cb(err, out);
    });
}
context.prototype.rm = function(path, opts, cb) {
    //make opts optional
    if(typeof(opts) === 'function' && cb == undefined) {
        cb = opts;
        opts = {};
    }
    var prev_env = app.hpss.env;
    app.hpss.env = this.env;
    app.hsi.rm(path, opts, function(err, out) {
        app.hpss.env = prev_env; //restore
        cb(err, out);
    });
}
context.prototype.touch = function(path, opts, cb) {
    //make opts optional
    if(typeof(opts) === 'function' && cb == undefined) {
        cb = opts;
        opts = {};
    }
    var prev_env = app.hpss.env;
    app.hpss.env = this.env;
    app.hsi.touch(path, opts, function(err, out) {
        app.hpss.env = prev_env; //restore
        cb(err, out);
    });
}
context.prototype.mkdir = function(path, opts, cb) {
    //make opts optional
    if(typeof(opts) === 'function' && cb == undefined) {
        cb = opts;
        opts = {};
    }
    var prev_env = app.hpss.env;
    app.hpss.env = this.env;
    app.hsi.mkdir(path, opts, function(err, out) {
        app.hpss.env = prev_env; //restore
        cb(err, out);
    });
}
//TODO add opts
context.prototype.get = function(hpsspath, localdest, cb, progress_cb) {
    var prev_env = app.hpss.env;
    app.hpss.env = this.env;
    app.hsi.get(hpsspath, localdest, function(err, out) {
        app.hpss.env = prev_env; //restore
        cb(err, out);
    }, progress_cb);
}
//TODO add opts
context.prototype.put = function(localpath, hpsspath, cb, progress_cb) {
    var prev_env = app.hpss.env;
    app.hpss.env = this.env;
    app.hsi.put(localpath, hpsspath, function(err, out) {
        app.hpss.env = prev_env; //restore
        cb(err, out);
    }, progress_cb);
}

context.prototype.clean = function() {
    if(this.keytab) {
        if(app.hpss.debug) console.log("removing", this.keytab.name);
        this.keytab.removeCallback();
    }
}

module.exports = context;
