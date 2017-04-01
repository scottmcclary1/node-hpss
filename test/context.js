
const fs = require('fs');
const expect = require("chai").expect;

const hpss = require("../app.js");
const hsi = hpss.hsi;

hpss.init({behind_firewall: true, debug: true});

describe("#context", function() {
    var h = new hpss.context({
        username: process.env.HPSS_PRINCIPAL,
        keytab: fs.readFileSync(process.env.HPSS_KEYTAB_PATH),
    });

    it("ls", function(done) {
        h.ls('isos', function(err, files){
            expect(err).to.be.a('null');
            expect(files).to.have.length(5);
            console.dir(files);
            done();
        });
    });

    it("mkdir", function(done) {
        h.mkdir('_test/context/check', {p: true} , function(err, files) {
            expect(err).to.be.a('null');
            done(); 
        });
    });

    it("put-small", function(done) {
        hsi.put('/etc/issue', '_test/context/issue', function(err, lines) {
            console.dir(err);
            expect(err).to.be.a('null');
            done();
        });
    });

    it("get-small", function(done) {
        hsi.get('_test/context/issue', '/tmp', function(err, lines) {
            expect(err).to.be.a('null');
            done();
        }, function(progress) {
            console.dir(progress);
        });
    });

    it("rm small", function(done) {
        hsi.rm('_test/context/issue', function(err, out) {
            expect(err).to.be.a('null');
            done();
        });
    });

    it("rmdir(3)", function(done) {
        h.rmdir('_test/context/check', function(err, files) {
            expect(err).to.be.a('null');
            done(); 
        });
    });
    it("rmdir(2)", function(done) {
        h.rmdir('_test/context', function(err, files) {
            expect(err).to.be.a('null');
            done(); 
        });
    });
    it("rmdir(1)", function(done) {
        h.rmdir('_test', function(err, files) {
            expect(err).to.be.a('null');
            done(); 
        });
    });

    it("put-double-quote", function(done) {
        hsi.put('/etc/issue', 'is"sue', function(err, lines) {
            console.dir(err);
            expect(err).to.be.a('null');
            done();
        });
    });
    it("get-double-quote", function(done) {
        hsi.get('is"sue', "/tmp", function(err, lines) {
            console.dir(err);
            expect(err).to.be.a('null');
            done();
        });
    });
    it("rm-double-quote", function(done) {
        hsi.rm('is"sue', function(err, lines) {
            console.dir(err);
            expect(err).to.be.a('null');
            done();
        });
    });

    it("clean context", function(done) {
        h.clean();
        //make sure keytab is gone
        fs.stat(h.keytab.name, function(err, stats) {
            if(err) done(); 
            else done("keytab remains..");
        });
    });
});
