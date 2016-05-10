var hsi = require("../app.js").hsi;

hsi.ls('isos/na', function(err, files) {
    console.log(err);
    console.dir(files);
});

