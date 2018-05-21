"use strict";

if(!self.webtorrent)
  self.webtorrent = new WebTorrent();

function addOrGetTorrent(uri,callback){
  var torrent = webtorrent.get(uri);
  if(torrent){
    torrent.on("ready",()=>callback(torrent));
  }else{
    webtorrent.add(uri,callback);
  }
}

protocolLoadFallbackHandler.setHandler("magnet",{
  getSelection(torrent,uri){
    var params = uri.match(/\?.*$/)[0].substr(1).split('&').map(x=>x.match(/^([^=]*)=(.*)$/).slice(1));
    var sos = params.filter(x=>x[0]=='so');
    var so = null;
    if(sos.length){
      so = [];
      for( let x of sos.map(x=>x[1]) )
        so = so.concat(x);
      so = so.join(',');
    }
    if(!so){
      return Array.from(new Uint32Array(torrent.files.length)).map((x,i)=>i.toString());
    }else{
      return parseRange(so).filter(i=>i<torrent.files.length);
    }
  },
  makeVirtualURI(uri){
    return new Promise((resolve,reject)=>{
      addOrGetTorrent(uri,torrent=>{
        var so = this.getSelection(torrent,uri);
        console.log(so,uri,torrent);
        if( so.length != 1 ){
          reject(new Error("More or less than one file selected or selection out of range. Use &so= to select a speciffic file."));
          return;
        }
        var file = torrent.files[so[0]];
        file.getBlobURL((x,bloburl)=>resolve(bloburl));
      });
    });
  },
/*  fetch(uri, options){ // TODO: still incomplete
    return new Promise((resolve,reject)=>{
      addOrGetTorrent(uri,torrent=>{
        var so = this.getSelection(torrent,uri);
        if( so.length != 1 ){
          reject(new Error("More or less than one file selected or selection out of range. Use &so= to select a speciffic file."));
          return;
        }
        var file = torrent.files[so[0]];
        var headers = {}; // TODO: Set Content-Type
        resolve(new Response(readStreamToReadableStream(file.createReadStream()),headers));
      });
    });
  },*/
  renderTo(element,uri){
    return new Promise((resolve,reject)=>{
      addOrGetTorrent(uri,torrent=>{
        var so = this.getSelection(torrent,uri);
        console.log(so,uri,torrent);
        if(so.length<1){
          reject(new Error("No files selected"));
          return;
        }
        if(so.length == 1){
          resolve(torrent.files[so[0]].renderTo(element));
          return;
        }else{
          // TODO
          reject("Not yet implemented. Specify a file using &so=123 for now.");
          return;
        }
      });
    });
  }
});
