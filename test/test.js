var expect    = require("chai").expect;
var hpss = require("../app.js");
var hsi = hpss.hsi;

describe("HSI Tests", function() {
    describe("#basic", function() {
        it("version", function(done) {
            hsi.version(function(err, out){
                console.dir(out);
                done();
            });
        });

        it("help", function(done) {
            hsi.help(function(err, lines){
                expect(lines).to.have.length.above(100);
                //console.log(out);
                done();
            });
        });

        it("ls(missing)", function(done) {
            hsi.ls('_missing_', function(err, out){
                expect(err.code).to.equal(64);
                done();
            });
        });
        it("ls(valid)", function(done) {
            hsi.ls('isos', function(err, files){
                expect(err).to.be.a('null');
                expect(files).to.have.length(3);
                console.dir(files);
                done();
            });
        });
    });

    describe("#transfer", function() {
        it("get-wronglocal", function(done) {
            hsi.get('isos/CentOS-7-x86_64-Everything-1503-01.iso', '/usr/local/__noexists__', function(err) {
                expect(err.code).to.equal('ENOENT');  //spawn chould generate error event
                done();a('null');
            });
        });
        it("get-localnonaccessible", function(done) {
            hsi.get('isos/CentOS-7-x86_64-Everything-1503-01.iso', '/root', function(err) {
                expect(err.code).to.equal('EACCES');  //spawn chould generate error event
                done();
            });
        });
        it("get-wrongremote", function(done) {
            hsi.get('isos/__nonexist', '/usr/local/tmp', function(err) {
                expect(err.code).to.be.equal(64); // can't ls before get
                done();
            });
        });
        it("get-small", function(done) {
            //hsi.get('isos/CentOS-7-x86_64-Everything-1503-01.iso', '/usr/local/tmp', function(err) {
            hsi.get('node-v0.10.29-linux-x64.tar.gz', '/usr/local/tmp', function(err) {
                expect(err).to.be.a('null');
                done();
            }, function(progress) {
                console.dir(progress);
            });
        });
        it("get-medium", function(done) {
            this.timeout(30*1000); //30 seconds should be enough
            //hsi.get('isos/CentOS-7-x86_64-Everything-1503-01.iso', '/usr/local/tmp', function(err) {
            hsi.get('test/git.tar.gz', '/usr/local/tmp', function(err) {
                expect(err).to.be.a('null');
                done();
            }, function(progress) {
                console.dir(progress);
            });
        });
        it("get-bigish", function(done) {
            this.timeout(600*1000); //5 minutes should be enough
            hsi.get('isos/CentOS-7-x86_64-Everything-1503-01.iso', '/usr/local/tmp', function(err) {
                expect(err).to.be.a('null');
                done();
            }, function(progress) {
                console.dir(progress);
            });
        });
    });

    describe("#lastly", function() {
        /*
        it("quit", function(done) {
            hsi.quit(function(code, signal) {
                console.log("quit with code:"+code);
                done();
            });
        });
        */
    });
});
