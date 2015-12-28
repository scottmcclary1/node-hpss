
//node
var fs = require('fs');

//contrib
var expect = require("chai").expect;

//mine
var hpss = require("../app.js");
var hsi = hpss.hsi;

describe("#context", function() {
    it("ls", function(done) {
        var h = new hpss.context({
            username: "hayashis",   
            keytab: fs.readFileSync("/home/hayashis/.ssh/soichi-hsi.keytab"),
        });
        h.ls('isos', function(err, files){
            expect(err).to.be.a('null');
            expect(files).to.have.length(3);
            console.dir(files);
            done();
        });
        //h.clean();
    });
});
