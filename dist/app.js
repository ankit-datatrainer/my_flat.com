'use strict';
const photos=[
 ['01','Stairwell','Access','Stairs descending from the property'],['02','Entrance corridor','Access','Patterned doors and entrance corridor'],['03','Security gate','Access','Metal security gate at the entrance'],['04','Wash area','Wash areas','Tiled wash area with taps and blue floor tiles'],['05','Interior door','Access','Patterned interior door'],['06','Connecting passage','Access','Tiled passage beside the stairs'],['07','Wash station','Wash areas','Washbasin, utility door and window'],['08','Indoor staircase','Access','Permanent staircase and metal railing'],['09','Wash area · upper view','Wash areas','Upper wash-area view with towel rail and light'],['10','Utility door','Wash areas','Utility door and surrounding wall tiles'],['11','Kitchen · wide view','Kitchen','Kitchen counter, wall shelf and tiled walls'],['12','Room · corner view','Rooms','Tiled room corner with a fixed pink shelf'],['13','Room · recessed shelves','Rooms','Turquoise room and built-in wall niches'],['14','Room · blue cupboard','Rooms','Room view showing a blue metal cupboard'],['15','Alcove · view one','Rooms','Tiled alcove with a green wall shelf'],['16','Alcove · view two','Rooms','Another angle of the tiled alcove'],['17','Alcove · view three','Rooms','Wider upper view of the same tiled alcove'],['18','Kitchen sink','Kitchen','Stainless-steel sink and green stone counter'],['19','Interior connections','Access','Interior doorways looking towards the gate'],['20','Kitchen counter','Kitchen','Green counter, backsplash and fixed gas meter']
].map(([id,title,category,alt])=>({id,title,category,alt}));
const chapters=[
 {id:'02',name:'Entrance',title:'A welcome <br><em>of your own.</em>',description:'The entrance, patterned doors and metal security gate. Your first look inside.'},
 {id:'13',name:'The room',title:'Room for <br><em>your everyday.</em>',description:'Turquoise walls, floral tile details and recessed shelves. Explore the room from several angles in the gallery.'},
 {id:'11',name:'Kitchen',title:'Small rituals. <br><em>Every day.</em>',description:'A stone counter and wall shelf form the kitchen space. Take a closer look at the sink and worktop in the gallery.'},
 {id:'07',name:'Wash station',title:'The practical <br><em>little details.</em>',description:'A compact washbasin beside the utility door. See the original photographs for the current paintwork condition.'},
 {id:'04',name:'Wash area',title:'A closer look <br><em>at the essentials.</em>',description:'A tiled wash area with wall taps, a towel rail and blue floor tiles.'},
 {id:'08',name:'Access',title:'Up to your <br><em>first floor.</em>',description:'View the staircase and access areas, then arrange a visit to experience the flat in person.'}
];
const $=s=>document.querySelector(s);const media=matchMedia('(prefers-reduced-motion: reduce)');let calm=media.matches;let active=0;let target=0;let current=0;let raf=0;let pointerX=0;let pointerY=0;let tourVisible=false;
const tour=$('#tour'), world=$('#spatial-world');
world.innerHTML=chapters.map((c,i)=>`<button class="space-panel" data-index="${i}" aria-label="Open ${c.name} photograph" tabindex="${i===0?0:-1}"><span class="panel-edge"></span><img src="assets/${c.id}.webp" alt="${photos.find(p=>p.id===c.id).alt}" width="750" height="1000" ${i?'loading="lazy"':''}><span class="panel-label"><span>0${i+1} / ${c.name.toUpperCase()}</span><span>EXPAND ↗</span></span></button>`).join('');
const panels=[...world.children];const nav=$('#chapter-nav');nav.innerHTML=chapters.map((c,i)=>`<button data-index="${i}" ${i===0?'aria-current="step"':''}><span>0${i+1}</span>${c.name}</button>`).join('');
function setChapter(index){if(active===index&&$('#chapter-title').dataset.ready)return;active=index;const c=chapters[index];$('#chapter-title').innerHTML=c.title;$('#chapter-title').dataset.ready='true';$('#chapter-number').textContent=`0${index+1} / 06`;$('#chapter-description').textContent=c.description;[...nav.children].forEach((b,i)=>{if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});panels.forEach((p,i)=>{p.tabIndex=i===index?0:-1;p.setAttribute('aria-hidden',i===index?'false':'true');});$('#previous-room').disabled=index===0;$('#next-room').disabled=index===5;}
function paintScene(){
 raf=0;
 current=calm?target:current+(target-current)*.075;
 if(Math.abs(target-current)<.0005)current=target;
 setChapter(Math.max(0,Math.min(5,Math.round(current))));
 const mobile=innerWidth<701;
 panels.forEach((p,i)=>{
  const d=i-current;
  const opacity=d<0?Math.max(0,1+d*2):Math.max(0,1-Math.max(0,d-.16)*.8);
  if(calm){p.style.transform='none';p.style.opacity=i===active?'1':'0';}
  else {
   const x=d*(mobile?235:340),z=-d*(mobile?690:1050),angle=-8-d*32+pointerX*5;
   p.style.transform=`translate3d(${x}px,${Math.abs(d)*-32+pointerY*9}px,${z}px) rotateY(${angle}deg) rotateX(${2-pointerY*3}deg)`;
   p.style.opacity=opacity;
  }
  p.style.pointerEvents=i===active?'auto':'none';
  p.style.visibility=Math.abs(d)>1.6||(!calm&&opacity===0)?'hidden':'visible';
 });
 $('#tour-progress').style.transform=`scaleX(${target/5})`;
 if(current!==target)raf=requestAnimationFrame(paintScene);
}
function schedule(){if(!raf)raf=requestAnimationFrame(paintScene);}
function updateScroll(){const r=tour.getBoundingClientRect();const travel=tour.offsetHeight-innerHeight;target=Math.max(0,Math.min(5,(-r.top/Math.max(1,travel))*5));if(tourVisible)schedule();document.body.classList.toggle('scrolled',scrollY>80);}
function goChapter(index){index=Math.max(0,Math.min(5,index));const top=tour.getBoundingClientRect().top+scrollY;const travel=tour.offsetHeight-innerHeight;window.scrollTo({top:top+index/5*travel+1,behavior:calm?'instant':'smooth'});}
function applyMotion(){document.body.classList.toggle('calm',calm);$('#motion-toggle').textContent=calm?'Motion off':'Motion on';$('#motion-toggle').setAttribute('aria-pressed',String(calm));updateScroll();schedule();}
$('#motion-toggle').addEventListener('click',()=>{calm=!calm;applyMotion();});media.addEventListener('change',e=>{calm=e.matches;applyMotion();});
nav.addEventListener('click',e=>{const b=e.target.closest('button');if(b)goChapter(+b.dataset.index);});$('#previous-room').onclick=()=>goChapter(active-1);$('#next-room').onclick=()=>goChapter(active+1);
$('#spatial-stage').addEventListener('pointermove',e=>{if(e.pointerType==='touch'||calm)return;const r=e.currentTarget.getBoundingClientRect();pointerX=(e.clientX-r.left)/r.width-.5;pointerY=(e.clientY-r.top)/r.height-.5;schedule();});$('#spatial-stage').addEventListener('pointerleave',()=>{pointerX=pointerY=0;schedule();});
new IntersectionObserver(entries=>{tourVisible=entries[0].isIntersecting;if(tourVisible)updateScroll();},{rootMargin:'100px'}).observe(tour);addEventListener('scroll',updateScroll,{passive:true});addEventListener('resize',updateScroll,{passive:true});
let filter='All spaces';let originals=false;let viewerIndex=0;let viewerList=photos;const dialog=$('#photo-dialog');const filters=['All spaces','Rooms','Kitchen','Wash areas','Access'];$('#gallery-filters').innerHTML=filters.map((f,i)=>`<button aria-pressed="${i===0}" data-filter="${f}">${f}</button>`).join('');
function renderGallery(){const list=photos.filter(p=>filter==='All spaces'||p.category===filter);$('#gallery-grid').innerHTML=list.map((p,i)=>`<button class="gallery-item depth-card" data-photo="${p.id}" aria-label="View ${p.title}"><div class="gallery-image"><img src="assets/${p.id}${originals?'-original':'-thumb'}.webp" alt="${p.alt}${originals?', original photograph during paintwork':', cleaned preview'}" width="420" height="560" loading="lazy"><span class="photo-expand">↗</span><span class="photo-category">${p.category}</span></div><span class="gallery-title"><span>${p.title}</span><span>${p.id}</span></span></button>`).join('');bindDepth();}
$('#gallery-filters').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;filter=b.dataset.filter;[...e.currentTarget.children].forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderGallery();});$('#gallery-originals').onchange=e=>{originals=e.target.checked;renderGallery();};
function updateViewer(){const p=viewerList[viewerIndex];const orig=$('#viewer-original').checked;$('#viewer-image').src=`assets/${p.id}${orig?'-original':''}.webp`;$('#viewer-image').alt=p.alt+(orig?', original photograph during paintwork':', AI-cleaned preview');$('#viewer-title').textContent=p.title;$('#viewer-counter').textContent=`${String(viewerIndex+1).padStart(2,'0')} / ${String(viewerList.length).padStart(2,'0')}`;$('#viewer-disclosure').textContent=orig?'Original photograph · During paintwork':'AI-cleaned preview · Compare with the original';}
function openViewer(id,list=photos){viewerList=list;viewerIndex=Math.max(0,list.findIndex(p=>p.id===id));$('#viewer-original').checked=originals;updateViewer();dialog.showModal();document.body.classList.add('viewer-open');}
function closeViewer(){dialog.close();}
dialog.addEventListener('close',()=>document.body.classList.remove('viewer-open'));$('#close-viewer').onclick=closeViewer;$('#viewer-original').onchange=updateViewer;$('#previous-photo').onclick=()=>{viewerIndex=(viewerIndex-1+viewerList.length)%viewerList.length;updateViewer();};$('#next-photo').onclick=()=>{viewerIndex=(viewerIndex+1)%viewerList.length;updateViewer();};dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){$('#next-photo').click();e.preventDefault();}if(e.key==='ArrowLeft'){$('#previous-photo').click();e.preventDefault();}});dialog.addEventListener('click',e=>{if(e.target===dialog)closeViewer();});
$('#gallery-grid').addEventListener('click',e=>{const b=e.target.closest('[data-photo]');if(b)openViewer(b.dataset.photo,photos.filter(p=>filter==='All spaces'||p.category===filter));});world.addEventListener('click',e=>{const b=e.target.closest('[data-index]');if(b)openViewer(chapters[+b.dataset.index].id);});$('#open-tour-photo').onclick=()=>openViewer(chapters[active].id);
let touchStart=null;$('#viewer-image').addEventListener('touchstart',e=>{touchStart=e.touches[0].clientX;},{passive:true});$('#viewer-image').addEventListener('touchend',e=>{if(touchStart===null)return;const dx=e.changedTouches[0].clientX-touchStart;if(Math.abs(dx)>55)$(dx<0?'#next-photo':'#previous-photo').click();touchStart=null;},{passive:true});
function bindDepth(){document.querySelectorAll('.depth-card:not([data-bound])').forEach(card=>{card.dataset.bound='true';card.addEventListener('pointermove',e=>{if(calm||e.pointerType==='touch')return;const r=card.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform=`perspective(900px) rotateY(${x*7}deg) rotateX(${-y*7}deg) translateZ(8px)`;});card.addEventListener('pointerleave',()=>{card.style.transform='';});});}
setChapter(0);renderGallery();applyMotion();
