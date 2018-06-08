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
      return Array.from(new Uint32Array(torrent.files.length)).map((x,i)=>i);
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
  renderTo(element,uri){
    function renderToHelper(f,e,c){
      if(e.autoplay)
        e.preload = "auto";
      try {
        return f.renderTo(e,c);
      } catch(e) {
        c(e);
      }
      return;
    }
    return new Promise((resolve,reject)=>{
      addOrGetTorrent(uri,torrent=>{
        var so = this.getSelection(torrent,uri);
        if(so.length<1){
          reject(new ProtocolLoadFallbackHandlerError("No files selected"));
          return;
        }
        if(so.length == 1){
          renderToHelper(torrent.files[so[0]],element,error=>{
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
            (x,i)=>[i,x.name.match(/\.([a-zA-Z]{2,3})\.(aqt|gsub|jss|sub|ttxt|pjs|psb|rt|smi|slt|ssf|srt|ssa|ass|usf|idx|vtt)$/i)]
          ).filter(x=>x[1]).map(x=>({index:x[0],lang:x[1][1],ext:x[1][2]}));
          var medias = torrent.files.map(
            (x,i)=>[i,x.name.match(/\.(mp4|m4v|webm|mkv|gifv|ogv|ogg|mov|mpg|mpv|mp2|mpeg|mpe|mp3|m4a|wav|flac)$/i)]
          ).filter(x=>x[1]).map(x=>x[0]);
          var pictures = torrent.files.map(
            (x,i)=>[x.name.match(/\.(svg|png|jpg|jpeg|gif|bmp)$/i),i,x]
          ).filter(x=>x[1]).map(x=>x.slice(1));
          if(!medias.length){
            reject(new ProtocolLoadFallbackHandlerError("No media source found"));
            return;
          }
          if(element instanceof HTMLMediaElement){
            if(!element.poster && pictures.length){
              let picture = pictures.filter(x=>/poster/i.test(x[1].name))[0] || pictures[0];
              element.poster = uri.replace(/(&|\?)so(=[^&]*)?/g,'')+'&so=' + picture[0];
            }
            for( let track of element.querySelectorAll("track") ){
              if(track.src != uri)
                continue;
              track.parentElement.removeChild(track);
            }
            for( let subtitle of subtitles ){
              let track = document.createElement("track");
              element.appendChild(track);
              track.srclang = subtitle.lang;
              track.label = subtitle.lang;
              track.src = uri.replace(/(&|\?)so(=[^&]*)?/g,'')+'&so='+subtitle.index;
            }
          }
          element.$sourcelock = true;
          renderToHelper(torrent.files[medias[0]],element,error=>{
            element.$sourcelock = false;
            if(error){
              reject(error);
            }else{
              resolve();
            }
          });
        }
      });
    });
  }
});
