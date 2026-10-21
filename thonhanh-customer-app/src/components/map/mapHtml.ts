import { MAP_HEAD } from './assets';

/**
 * Trang HTML bản đồ dùng chung cho điện thoại (WebView) và web (iframe), giao tiếp 2 chiều bằng postMessage.
 *
 * Nền bản đồ (miễn phí, không cần API key):
 *   1. MapLibre GL + OpenFreeMap (vector, nét, đẹp)  — mặc định
 *   2. Leaflet + OpenStreetMap (ảnh raster)           — tự chuyển sang khi máy không có WebGL
 *                                                       hoặc không tải được OpenFreeMap trong vài giây
 * Thư viện được nhúng sẵn trong app (không phụ thuộc CDN); chỉ dữ liệu nền bản đồ cần Internet.
 */

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  kind: 'worker' | 'customer' | 'pin';
  /** Vòng sóng lan toả quanh vị trí thợ khi đang bật nhận đơn */
  pulse?: boolean;
};

export type MapPadding = { top?: number; bottom?: number; left?: number; right?: number };

export type MapData = {
  markers: MapMarker[];
  /** Vòng bán kính nhận việc */
  circle?: { lat: number; lng: number; radiusKm: number } | null;
  /** Nối 2 điểm đầu bằng nét đứt (thợ -> khách) */
  line?: boolean;
  /** Căn khung nhìn vừa các điểm. Đổi fitKey để căn lại (VD bấm nút "về vị trí của tôi") */
  fit?: boolean;
  fitKey?: string | number;
  zoom?: number;
  /** Chừa chỗ cho các lớp giao diện đè lên bản đồ (thanh trên, bảng dưới) khi căn khung nhìn */
  padding?: MapPadding;
  /** Cho phép kéo/zoom (mặc định có) */
  interactive?: boolean;
  /** Phần đáy bản đồ bị giao diện khác che (px): đẩy dòng ghi công bản đồ lên trên để luôn đọc được */
  chromeBottom?: number;
  /** Bề rộng (px) góc dưới bên trái có nút đè lên bản đồ: dòng ghi công bản đồ tự xuống dòng để không chồng lên nút */
  chromeLeft?: number;
};

export const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
export const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const BOLT =
  '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="#FFC21A" d="M13.2 2 4.8 13.4h6l-1.2 8.6 8.6-11.6h-6.1z"/></svg>';
const HOUSE =
  '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="#fff" d="M12 3 2.5 11h2.7v9h5.3v-5.6h3v5.6h5.3v-9h2.7z"/></svg>';

export function mapHtml(): string {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<meta name="referrer" content="strict-origin-when-cross-origin"/>
${MAP_HEAD}
<style>
  html,body,#map{height:100%;margin:0;padding:0;background:#E9EDF2;font-family:-apple-system,Roboto,"Segoe UI",sans-serif;overflow:hidden}
  .tn-m{position:relative;box-sizing:border-box;display:flex;align-items:center;justify-content:center}
  .tn-worker{width:38px;height:38px;border-radius:50%;background:#0B1F3A;border:3px solid #fff;box-shadow:0 3px 10px rgba(11,31,58,.45);z-index:3}
  .tn-worker .ring{position:absolute;left:50%;top:50%;width:38px;height:38px;margin:-19px 0 0 -19px;border-radius:50%;
    background:rgba(255,194,26,.35);animation:tnPulse 2.2s ease-out infinite;z-index:-1}
  .tn-worker .ring.r2{animation-delay:1.1s}
  @keyframes tnPulse{0%{transform:scale(1);opacity:.9}100%{transform:scale(3.4);opacity:0}}
  .tn-customer{width:36px;height:36px}
  .tn-customer .shape{position:absolute;inset:0;box-sizing:border-box;display:flex;align-items:center;justify-content:center;
    border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#E5484D;border:3px solid #fff;box-shadow:0 3px 10px rgba(229,72,77,.45)}
  .tn-customer .shape svg{transform:rotate(45deg)}
  .tn-pin{width:22px;height:22px;border-radius:50%;background:#fff;border:6px solid #0B1F3A;box-shadow:0 2px 8px rgba(11,31,58,.4)}
  .tn-err{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#5B6B82;font-size:14px;text-align:center;padding:16px}
  .maplibregl-ctrl-attrib,.leaflet-control-attribution{font-size:9px!important;background:rgba(255,255,255,.75)!important;
    max-width:calc(100vw - var(--tn-cl,0px) - 20px);box-sizing:border-box;white-space:normal}
  .maplibregl-ctrl-bottom-left,.maplibregl-ctrl-bottom-right{z-index:1;bottom:var(--tn-cb,0px)!important}
  .leaflet-bottom{bottom:var(--tn-cb,0px)!important}
  .leaflet-container{background:#E9EDF2}
</style>
</head><body><div id="map"></div>
<script>
(function(){
  var STYLE=${JSON.stringify(OPENFREEMAP_STYLE)}, OSM=${JSON.stringify(OSM_TILES)};
  var HANOI=[21.0285,105.8542];
  var ICON={worker:${JSON.stringify(BOLT)},customer:${JSON.stringify(HOUSE)},pin:''};
  function send(msg){
    try{
      if(window.ReactNativeWebView){ window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
      else if(window.parent && window.parent!==window){ window.parent.postMessage({__tnmap:true,payload:msg},'*'); }
    }catch(e){}
  }
  function el(m){
    var d=document.createElement('div'); d.className='tn-m tn-'+m.kind;
    d.innerHTML=m.kind==='customer'?'<div class="shape">'+ICON.customer+'</div>':(ICON[m.kind]||'');
    if(m.kind==='worker' && m.pulse){ d.insertAdjacentHTML('afterbegin','<span class="ring"></span><span class="ring r2"></span>'); }
    return d;
  }
  function circlePts(lat,lng,km){
    var pts=[],i,a,k=Math.cos(lat*Math.PI/180);
    for(i=0;i<=72;i++){ a=i/72*2*Math.PI; pts.push([lng+km*Math.cos(a)/(111.32*k), lat+km*Math.sin(a)/110.574]); }
    return pts;
  }
  function boundsOf(d){
    var pts=(d.markers||[]).map(function(m){return [m.lat,m.lng]});
    if(d.circle){ circlePts(d.circle.lat,d.circle.lng,d.circle.radiusKm).forEach(function(p){pts.push([p[1],p[0]])}); }
    return pts;
  }
  function pad(d){ var p=d.padding||{}; return {top:(p.top||0)+24,bottom:(p.bottom||0)+24,left:(p.left||0)+24,right:(p.right||0)+24}; }
  function hasWebGL(){ try{ var c=document.createElement('canvas'); return !!(window.WebGLRenderingContext&&(c.getContext('webgl2')||c.getContext('webgl'))); }catch(e){ return false; } }

  // ---------- MapLibre + OpenFreeMap ----------
  function MapLibreEngine(onFail){
    var self=this, ready=false, dead=false, gotStyle=false, markers=[];
    var map=new maplibregl.Map({container:'map',style:STYLE,center:[HANOI[1],HANOI[0]],zoom:13,attributionControl:false,
      dragRotate:false,pitchWithRotate:false,touchPitch:false,fadeDuration:150});
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.AttributionControl({compact:true}),'bottom-right');
    function fail(){ if(ready||dead) return; dead=true; clearTimeout(timer); try{map.remove()}catch(e){} onFail(); }
    var timer=setTimeout(fail,8000);
    map.on('styledata',function(){ gotStyle=true; });
    map.on('error',function(){ if(!gotStyle) fail(); });
    map.on('load',function(){
      if(dead) return; ready=true; clearTimeout(timer);
      var empty={type:'FeatureCollection',features:[]};
      ['tn-circle','tn-line'].forEach(function(id){ map.addSource(id,{type:'geojson',data:empty}); });
      map.addLayer({id:'tn-circle-fill',type:'fill',source:'tn-circle',paint:{'fill-color':'#0B1F3A','fill-opacity':0.06}});
      map.addLayer({id:'tn-circle-line',type:'line',source:'tn-circle',paint:{'line-color':'#0B1F3A','line-width':1.6,'line-opacity':0.55,'line-dasharray':[3,2]}});
      map.addLayer({id:'tn-line',type:'line',source:'tn-line',layout:{'line-cap':'round'},paint:{'line-color':'#0B1F3A','line-width':4,'line-dasharray':[1,1.6]}});
      map.on('click',function(e){ send({type:'click',lat:e.lngLat.lat,lng:e.lngLat.lng}); });
      send({type:'ready',engine:'maplibre'});
      if(self.pending){ var p=self.pending; self.pending=null; self.set(p.d,p.refit); }
    });
    this.set=function(d,refit){
      if(!ready){ self.pending={d:d,refit:refit||(self.pending&&self.pending.refit)}; return; }
      markers.forEach(function(m){m.remove()}); markers=[];
      (d.markers||[]).forEach(function(m){
        markers.push(new maplibregl.Marker({element:el(m),anchor:'center',offset:m.kind==='customer'?[0,-25]:[0,0]})
          .setLngLat([m.lng,m.lat]).addTo(map));
      });
      map.getSource('tn-circle').setData(d.circle?{type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[circlePts(d.circle.lat,d.circle.lng,d.circle.radiusKm)]}}:{type:'FeatureCollection',features:[]});
      var ms=d.markers||[];
      map.getSource('tn-line').setData(d.line&&ms.length>=2?{type:'Feature',properties:{},geometry:{type:'LineString',coordinates:[[ms[0].lng,ms[0].lat],[ms[1].lng,ms[1].lat]]}}:{type:'FeatureCollection',features:[]});
      if(d.interactive===false){ map.dragPan.disable(); map.scrollZoom.disable(); map.touchZoomRotate.disable(); map.doubleClickZoom.disable(); }
      else { map.dragPan.enable(); map.scrollZoom.enable(); map.touchZoomRotate.enable(); map.touchZoomRotate.disableRotation(); map.doubleClickZoom.enable(); }
      if(refit) self.fit(d);
    };
    this.fit=function(d){
      if(!ready) return;
      map.resize();
      var pts=boundsOf(d);
      if(!pts.length) return;
      if(pts.length===1){ map.easeTo({center:[pts[0][1],pts[0][0]],zoom:d.zoom||15,padding:pad(d),duration:500}); return; }
      var b=new maplibregl.LngLatBounds();
      pts.forEach(function(p){ b.extend([p[1],p[0]]); });
      map.fitBounds(b,{padding:pad(d),maxZoom:16,duration:500});
    };
    this.resize=function(){ if(ready) map.resize(); };
  }

  // ---------- Leaflet + OpenStreetMap (dự phòng) ----------
  function LeafletEngine(){
    var self=this;
    var map=L.map('map',{zoomControl:false,attributionControl:true}).setView(HANOI,13);
    L.tileLayer(OSM,{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
    var layer=L.layerGroup().addTo(map);
    map.on('click',function(e){ send({type:'click',lat:e.latlng.lat,lng:e.latlng.lng}); });
    this.set=function(d,refit){
      layer.clearLayers();
      if(d.circle){ L.circle([d.circle.lat,d.circle.lng],{radius:d.circle.radiusKm*1000,color:'#0B1F3A',weight:1.5,opacity:.55,dashArray:'6 4',fillColor:'#0B1F3A',fillOpacity:.06}).addTo(layer); }
      var ms=d.markers||[];
      if(d.line&&ms.length>=2){ L.polyline([[ms[0].lat,ms[0].lng],[ms[1].lat,ms[1].lng]],{color:'#0B1F3A',weight:4,dashArray:'2 8',lineCap:'round'}).addTo(layer); }
      ms.forEach(function(m){
        var s=m.kind==='pin'?22:m.kind==='customer'?36:38;
        var icon=L.divIcon({className:'',iconSize:[s,s],iconAnchor:m.kind==='customer'?[18,43]:[s/2,s/2],html:el(m).outerHTML});
        L.marker([m.lat,m.lng],{icon:icon,keyboard:false}).addTo(layer);
      });
      if(d.interactive===false){ map.dragging.disable(); map.scrollWheelZoom.disable(); map.touchZoom.disable(); map.doubleClickZoom.disable(); }
      else { map.dragging.enable(); map.scrollWheelZoom.enable(); map.touchZoom.enable(); map.doubleClickZoom.enable(); }
      if(refit) self.fit(d);
    };
    this.fit=function(d){
      map.invalidateSize();
      var pts=boundsOf(d), p=pad(d);
      if(!pts.length) return;
      if(pts.length===1){ map.setView(pts[0],d.zoom||15); return; }
      map.fitBounds(pts,{paddingTopLeft:[p.left,p.top],paddingBottomRight:[p.right,p.bottom],maxZoom:16});
    };
    this.resize=function(){ map.invalidateSize(); };
    setTimeout(function(){ send({type:'ready',engine:'leaflet'}); },0);
  }

  var engine=null, last=null, lastKey;
  function useLeaflet(){
    document.getElementById('map').innerHTML='';
    if(typeof L==='undefined'){ document.body.insertAdjacentHTML('beforeend','<div class="tn-err">Không hiển thị được bản đồ.</div>'); send({type:'error'}); return; }
    engine=new LeafletEngine();
    if(last) engine.set(last,true);
  }
  if(typeof maplibregl!=='undefined' && hasWebGL()){
    try{ engine=new MapLibreEngine(useLeaflet); }catch(e){ useLeaflet(); }
  } else { useLeaflet(); }

  window.__setData=function(d){
    var key=d.fitKey===undefined?'':String(d.fitKey);
    var refit=!!d.fit && (last===null || key!==lastKey);
    last=d; lastKey=key;
    document.documentElement.style.setProperty('--tn-cb',(d.chromeBottom||0)+'px');
    document.documentElement.style.setProperty('--tn-cl',(d.chromeLeft||0)+'px');
    if(engine) engine.set(d,refit);
  };
  var rt=null;
  window.addEventListener('resize',function(){ clearTimeout(rt); rt=setTimeout(function(){ if(engine){ engine.resize(); if(last&&last.fit) engine.fit(last); } },150); });
  function onMsg(ev){
    var d=ev.data;
    if(typeof d==='string'){ try{ d=JSON.parse(d); }catch(e){ return; } }
    if(d && d.__tnmap_set){ window.__setData(d.data); }
  }
  window.addEventListener('message',onMsg);
  document.addEventListener('message',onMsg);
})();
</script>
</body></html>`;
}
