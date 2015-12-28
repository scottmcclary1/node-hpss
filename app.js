'use strict';

//hpss globals
var hpss = {
    behind_firewall: false,
    env: null
};
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
