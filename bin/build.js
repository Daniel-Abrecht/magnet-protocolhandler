#!/usr/bin/env node

var uglify = require("uglify-es");

process.chdir(__dirname+"/../dist");

var FastSourcemapConcat = require("fast-sourcemap-concat");
var fastSourcemapConcat = new FastSourcemapConcat({
  outputFile: "magnet-protocolhandler.js"
});

var dir = '../lib/';

var fs = require('fs');
var files = fs.readdirSync(dir).filter(x=>/\.js/.test(x)).sort();
for( let file of files )
  fastSourcemapConcat.addFile(dir+file);

fastSourcemapConcat.end().then(()=>{
  var result = uglify.minify({
    "magnet-protocolhandler.js": fs.readFileSync("magnet-protocolhandler.js", "utf8")
  }, {
    sourceMap: {
      content: fs.readFileSync("magnet-protocolhandler.map", "utf8"),
      filename: "magnet-protocolhandler.min.js",
      url: "magnet-protocolhandler.min.map"
    }
  });
  fs.writeFileSync("magnet-protocolhandler.min.js",result.code);
  fs.writeFileSync("magnet-protocolhandler.min.map",result.map);
});
