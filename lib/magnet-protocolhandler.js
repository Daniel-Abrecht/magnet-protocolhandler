"use strict";

if(!self.webtorrent)
  self.webtorrent = new WebTorrent();

function addOrGetTorrent(uri,callback){
  var torrent = webtorrent.get(uri);
  if(torrent){
    if(torrent.ready){
      callback(torrent);
    }else{
      torrent.on("ready",()=>callback(torrent));
    }
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
        if( so.length != 1 ){
          reject(new ProtocolLoadFallbackHandlerError("More or less than one file selected or selection out of range. Use &so= to select a speciffic file."));
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
        if(so.length<1){
          reject(new ProtocolLoadFallbackHandlerError("No files selected"));
          return;
        }
        if(so.length == 1){
          torrent.files[so[0]].renderTo(element,(error)=>{
            if(error){
              reject(new ProtocolLoadFallbackHandlerError(error,true));
            }else{
              resolve();
            }
          });
          return;
        }else{
          if( element instanceof HTMLSourceElement
           && element.parentElement
           && element.parentElement instanceof HTMLMediaElement
          ) element = element.parentElement;
          var subtitles = torrent.files.map(
            (x,i)=>[i,x.name.match(/\.([a-zA-Z]{2,3})\.(aqt|gsub|jss|sub|ttxt|pjs|psb|rt|smi|slt|ssf|srt|ssa|ass|usf|idx|vtt)$/)]
          ).filter(x=>x[1]).map(x=>({index:x[0],lang:x[1][1],ext:x[1][2]}));
          var medias = torrent.files.map(
            (x,i)=>[i,x.name.match(/\.(mp4|m4v|webm|mkv|gifv|ogv|ogg|mov|mpg|mpv|mp2|mpeg|mpe|mp3|m4a|wav|flac)$/)]
          ).filter(x=>x[1]).map(x=>x[0]);
          if(!medias.length){
            reject(new ProtocolLoadFallbackHandlerError("No media source found"));
            return;
          }
          if(element instanceof HTMLMediaElement){
            for( let track of element.querySelectorAll("track") ){
              if(track.src != uri)
                continue;
              track.parentElement.removeChild(track);
            }
          }
          for( let subtitle of subtitles ){
            let track = document.createElement("track");
            element.appendChild(track);
            track.srclang = subtitle.lang;
            track.label = subtitle.lang;
            track.src = uri.replace(/(&|\?)so(=[^&]*)?/g,'')+'&so='+subtitle.index;
          }
          element.$sourcelock = true;
          resolve(Promise.resolve(torrent.files[medias[0]].renderTo(element)).then(
            ()=>{element.$sourcelock=false;},
            e=>{element.$sourcelock=false; throw e;}
          ));
        }
      });
    });
  }
});
