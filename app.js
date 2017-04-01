'use strict';

//TODO I really don't like the way I set the global.. I think I should expose these variable as conf object directly via export
//hpss globals
var hpss = {
    behind_firewall: false,
    env: null,
    debug: false,
}

exports.init = function(conf) {
    //just copy all conf in..
    for(var key in conf) {
        hpss[key] = conf[key];
    }
}
exports.hpss = hpss;

exports.hsi = require('./hsi');
exports.htar = require('./htar');
exports.context = require('./context');
