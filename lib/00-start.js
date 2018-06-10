"use strict";

(function(){
if(typeof module != "undefined"){
  module.exports = (...x)=>module.exports.init(...x)
  module.exports.init = init;
}else{
  init();
}
function init(options){

options = options || {};

if(typeof require != "undefined"){
  if(typeof protocolLoadFallbackHandler == "undefined")
    require("protocolloadfallbackhandler")(options);
}

var WebTorrent = self.WebTorrent || require("webtorrent");
var webtorrent = options.webtorrent || self.webtorrent || new WebTorrent();

// See ~~-end.js for the end of the function that wraps everything
