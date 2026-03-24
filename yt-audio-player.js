(function(){
// Toggle off
var R=document.getElementById('_yr');
if(R){R.remove();var H=document.getElementById('_yhc');if(H)H.remove();return}

// ── Build UI ──
R=document.createElement('div');R.id='_yr';
R.style.cssText='position:fixed;bottom:0;right:0;z-index:2147483647;width:290px;background:#111;border:1px solid #444;font:12px system-ui,sans-serif;color:#ccc;padding:8px;box-shadow:0 4px 20px #000a';
document.body.appendChild(R);

function C(t,s,p,tx){var e=document.createElement(t);if(s)e.style.cssText=s;if(p)p.appendChild(e);if(tx!==void 0)e.textContent=tx;return e}

// URL row
var ur=C('div','display:flex;gap:4px;margin-bottom:6px',R);
var inp=C('input','flex:1;min-width:0;background:#222;border:1px solid #444;padding:5px;color:#ccc;font:11px monospace;outline:0',ur);
var lb=C('b','background:#c22;color:#fff;padding:4px 8px;cursor:pointer;white-space:nowrap',ur,'\u8aad\u8fbc');
var xb=C('b','color:#777;cursor:pointer;padding:0 4px',ur,'\u2715');

// Progress bar
var tb=C('div','display:flex;align-items:center;gap:4px;margin-bottom:6px;font:10px monospace;color:#888',R);
var ta=C('span','',tb,'0:00');
var tk=C('div','flex:1;height:8px;background:#444;cursor:pointer;border-radius:4px;-webkit-tap-highlight-color:transparent',tb);
var tf=C('div','height:100%;background:#e63946;width:0;pointer-events:none;border-radius:4px',tk);
var td=C('span','',tb,'0:00');

// Countdown
var cdBox=C('div','text-align:center;margin-bottom:6px;display:none',R);
var cdTxt=C('div','font:bold 32px monospace;color:#4ade80;letter-spacing:2px',cdBox);

// Controls: ⏪ ◁ ▶ ▷ ⏩ ↻30
var br=C('div','display:flex;justify-content:center;align-items:center;gap:4px;margin-bottom:4px',R);
var bs='background:#222;border:1px solid #444;color:#ccc;cursor:pointer;font-size:14px;-webkit-tap-highlight-color:transparent;';
var bb5=C('button',bs+'padding:4px 8px',br,'\u23ea');
var bb1=C('button',bs+'padding:4px 6px;font-size:11px',br,'\u25c1');
var bp=C('button',bs+'border-color:#c22;padding:4px 14px;font-size:16px',br,'\u25b6\ufe0f');
var bf1=C('button',bs+'padding:4px 6px;font-size:11px',br,'\u25b7');
var bf5=C('button',bs+'padding:4px 8px',br,'\u23e9');
var cdRst=C('button',bs+'padding:4px 6px;font-size:10px;color:#4ade80;border-color:#4ade80',br,'\u21bb30');

// Labels
var lbl=C('div','display:flex;justify-content:center;gap:2px;font:9px monospace;color:#666;margin-bottom:4px',R);
C('span','width:30px;text-align:center',lbl,'-5s');
C('span','width:26px;text-align:center',lbl,'-1s');
C('span','width:42px;text-align:center',lbl,'');
C('span','width:26px;text-align:center',lbl,'+1s');
C('span','width:30px;text-align:center',lbl,'+5s');
C('span','width:30px;text-align:center',lbl,'RST');

// Volume bar
var vr=C('div','display:flex;align-items:center;gap:4px;font:10px monospace;color:#888',R);
var vi=C('span','cursor:pointer;font-size:14px',vr,'\ud83d\udd0a');
var vtk=C('div','flex:1;height:8px;background:#444;cursor:pointer;border-radius:4px;-webkit-tap-highlight-color:transparent',vr);
var vtf=C('div','height:100%;background:#6aa;width:100%;pointer-events:none;border-radius:4px',vtk);
var vtn=C('span','width:22px;text-align:right',vr,'100');

// Hidden YT container
var yc=C('div','position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden',document.body);
yc.id='_yhc';

// ── State ──
var Y=null,ok=0,ti,V=100,pv=100;
var CD_SEC=30;
var cdElapsed=0;
var cdRunning=false;
var cdLastTick=0;

var loc=location.href;
if(/youtube\.com\/watch|youtu\.be\//.test(loc))inp.value=loc;

// ── Close ──
xb.onclick=function(){
  if(Y)try{Y.destroy()}catch(e){}
  if(ti)clearInterval(ti);
  yc.remove();R.remove();
};

// ── URL parser ──
function pU(u){
  var v=null,s=0;
  try{
    var o=new URL(u);
    if(o.hostname.indexOf('youtu.be')>=0)v=o.pathname.slice(1).split('/')[0];
    else v=o.searchParams.get('v');
    var t=o.searchParams.get('t')||o.searchParams.get('start')||'0';
    if(/[hms]/.test(t)){
      s=(+(t.match(/(\d+)h/)||[0,0])[1])*3600
       +(+(t.match(/(\d+)m/)||[0,0])[1])*60
       +(+(t.match(/(\d+)s/)||[0,0])[1]);
    }else s=parseInt(t,10)||0;
  }catch(e){}
  return[v,s];
}

// ── Time formatters ──
function fm(n){
  n=Math.max(0,Math.floor(n));
  var m=Math.floor(n/60),s=n%60;
  return m+':'+(s<10?'0':'')+s;
}

function fmCD(sec){
  var neg=sec<0;
  var abs=Math.abs(sec);
  var n=neg?Math.ceil(abs):Math.floor(abs);
  var m=Math.floor(n/60);
  var s=n%60;
  return(neg?'-':'')+m+':'+(s<10?'0':'')+s;
}

// ── Countdown helpers ──
function getCDElapsed(){
  return cdRunning?cdElapsed+(Date.now()-cdLastTick)/1000:cdElapsed;
}

function updateCDDisplay(){
  var remain=CD_SEC-getCDElapsed();
  cdTxt.textContent=fmCD(remain);
  cdTxt.style.color=remain<0?'#f44':'#4ade80';
}

function resetCD(){
  cdRunning=false;
  cdElapsed=0;
  cdLastTick=0;
  cdTxt.textContent=fmCD(CD_SEC);
  cdTxt.style.color='#4ade80';
  cdBox.style.display='block';
}

// ── YouTube API loader ──
function eA(cb){
  if(window.YT&&window.YT.Player)return cb();
  var e=document.getElementById('_yta');
  if(e){var iv=setInterval(function(){if(window.YT&&window.YT.Player){clearInterval(iv);cb()}},99);return}
  e=document.createElement('script');e.id='_yta';
  e.src='https://www.youtube.com/iframe_api';
  document.head.appendChild(e);
  var o=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=function(){if(o)o();cb()};
}

// ── Volume ──
function sV(n){
  V=Math.max(0,Math.min(100,Math.round(n)));
  vtf.style.width=V+'%';
  vtn.textContent=V;
  vi.textContent=V?V<50?'\ud83d\udd09':'\ud83d\udd0a':'\ud83d\udd07';
  if(Y&&ok)try{Y.setVolume(V)}catch(e){}
}

// ── Load video ──
lb.onclick=function(){
  var u=inp.value.trim();if(!u)return;
  var r=pU(u);if(!r[0])return;
  lb.textContent='\u2026';lb.style.background='#888';
  cdBox.style.display='none';
  cdRunning=false;
  cdElapsed=0;
  cdLastTick=0;

  eA(function(){
    if(Y)try{Y.destroy()}catch(e){}
    Y=null;ok=0;yc.innerHTML='';
    var h=document.createElement('div');yc.appendChild(h);
    Y=new YT.Player(h,{
      height:1,width:1,videoId:r[0],
      playerVars:{autoplay:0,start:r[1],controls:0,disablekb:1,fs:0,rel:0},
      events:{
        onReady:function(e){
          ok=1;
          td.textContent=fm(e.target.getDuration());
          if(r[1])ta.textContent=fm(r[1]);
          lb.textContent='OK';lb.style.background='#2a2';
          try{e.target.setVolume(V)}catch(x){}
          resetCD();
          if(ti)clearInterval(ti);
          ti=setInterval(function(){
            if(!Y||!ok)return;
            try{
              var c=Y.getCurrentTime(),D=Y.getDuration();
              ta.textContent=fm(c);
              if(D)tf.style.width=(c/D*100)+'%';
            }catch(e){}
            if(cdRunning)updateCDDisplay();
          },250);
        },
        onStateChange:function(e){
          bp.textContent=e.data===1?'\u23f8':'\u25b6\ufe0f';
          if(e.data===1&&!cdRunning){
            cdLastTick=Date.now();
            cdRunning=true;
          }
          if(e.data===2&&cdRunning){
            cdElapsed+=(Date.now()-cdLastTick)/1000;
            cdRunning=false;
          }
        },
        onError:function(){
          lb.textContent='\u2716';lb.style.background='#c22';
        }
      }
    });
  });
};

// ── Skip (clamped to video bounds) ──
function doSkip(delta){
  if(!Y||!ok)return;
  try{
    var cur=Y.getCurrentTime();
    var dur=Y.getDuration()||0;
    var target=cur+delta;
    if(target<0)target=0;
    if(dur>0&&target>dur)target=dur;
    var actual=target-cur;
    Y.seekTo(target,true);
    if(actual!==0){
      if(cdRunning){
        cdElapsed+=actual;
        if(cdElapsed<0)cdElapsed=0;
        cdLastTick=Date.now();
      }else{
        cdElapsed+=actual;
        if(cdElapsed<0)cdElapsed=0;
      }
      updateCDDisplay();
    }
  }catch(e){}
}

// ── Event handlers ──
inp.onkeydown=function(e){if(e.key==='Enter')lb.onclick()};
bp.onclick=function(){if(Y&&ok)try{Y.getPlayerState()===1?Y.pauseVideo():Y.playVideo()}catch(e){}};
bb5.onclick=function(){doSkip(-5)};
bb1.onclick=function(){doSkip(-1)};
bf1.onclick=function(){doSkip(1)};
bf5.onclick=function(){doSkip(5)};
cdRst.onclick=function(){resetCD()};
tk.onclick=function(e){
  if(!Y||!ok)return;
  var r=tk.getBoundingClientRect();
  try{Y.seekTo(Y.getDuration()*((e.clientX-r.left)/r.width),true)}catch(x){}
};
vtk.onclick=function(e){
  var r=vtk.getBoundingClientRect();
  sV((e.clientX-r.left)/r.width*100);
};
vi.onclick=function(){if(V){pv=V;sV(0)}else sV(pv||100)};
})();
