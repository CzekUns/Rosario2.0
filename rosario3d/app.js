import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js";
import {ringArcPath,archPoint,chooseArchSteps} from "./arc-math.mjs";

// Laboratorio indipendente: 54 grani sull'anello (50 Ave Maria + 4 Padre Nostro),
// medaglia centrale, 5 grani sulla coda (3 Ave Maria + 2 Padre Nostro), crocifisso.
// La medaglia prende il posto del quinto divisore sull'anello: 59 grani totali.
const stage = document.querySelector("#stage");
const gripFrame = document.querySelector("#gripFrame");
const guidePointLeft = document.querySelector("#guidePointLeft");
const gripCount = document.querySelector("#gripCount");
const fallback = document.querySelector("#fallback");
const title = document.querySelector("#selectedTitle");
const details = document.querySelector("#selectedInfo");
const materialButtons = [...document.querySelectorAll("[data-material]")];
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
// Grani piccoli ~9 mm nominali CSS: 34px, non scalabili dall'utente.
const CSS_PX_PER_WORLD = (9 * 96 / 25.4) / (.084 * 2);
const GRAVITY = .0019;
const GRIP_BEADS = 5;
const LEFT_GUIDE_STRENGTH = .09; // secondo punto, più debole della presa destra
const ARC_RISE = .77; // arco alto: più morbido della presa, non un binario rigido
const ARC_PULL = .085;
const ARC_PULL_LATER = .028;
const ARC_TOP_MARGIN = .18;
const GRIP_PITCH = .215;
const SCREEN_INSET = .035;

let scene, camera, renderer, rosary;
let beads = [];
let links = [];
let selected = 17;
let viewWidth = 4, viewHeight = 9;
let materialName = "wood";
let activeMaterial, activeGlowMaterial;
const touches = new Map();
let gripStart = 12;
let guideMoved = 0;
let frameLast = 0;
let frameBounds = null;
let guidePoints = [];
let leftGuidePoint = new THREE.Vector3();
let upperArcIndices = [];
let upperArcTargets = [];
const UP = new THREE.Vector3(0, 1, 0);
const WORLD_Z = new THREE.Vector3(0, 0, 1);
const vA = new THREE.Vector3();
const vB = new THREE.Vector3();
const vC = new THREE.Vector3();
const vD = new THREE.Vector3();
let selectedHalo, selectedLamp;
let frameNumber = 0;

function rndFactory(seed = 711237) {
  return () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
}
function textureOf(type) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const rnd = rndFactory(type === "wood" ? 712 : type === "ivory" ? 895 : 231);
  const palette = type === "wood"
    ? ["#6e341b", "#824523", "#ac6b3b", "#d59c65", "#402015"]
    : type === "ivory"
      ? ["#ece1c9", "#f5eed9", "#e9d9b7", "#c9b59a", "#fff9e7"]
      : ["#1e262d", "#293039", "#3b424a", "#151a20", "#626169"];
  ctx.fillStyle = palette[0];
  ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 780; i++) {
    const y = rnd() * 270 - 7;
    const width = type === "wood" ? 0.3 + rnd() * 2.3 : .2 + rnd() * .9;
    const bend = rnd() * 17;
    ctx.strokeStyle = palette[Math.floor(rnd() * palette.length)];
    ctx.globalAlpha = type === "wood" ? .12 + rnd() * .30 : .04 + rnd() * .13;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(-5, y);
    for (let x = -5; x <= 530; x += 16) {
      ctx.lineTo(x, y + Math.sin(x * (.015 + rnd() * .006) + bend) * (type === "wood" ? 2.9 : 6.5));
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 4500; i++) {
    ctx.fillStyle = rnd() > .53 ? "#ffffff" : "#000000";
    ctx.globalAlpha = rnd() * .045;
    ctx.fillRect(rnd() * 512, rnd() * 256, rnd() * 2 + .3, rnd() * 2 + .3);
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
const textures = {
  wood: textureOf("wood"),
  ivory: textureOf("ivory"),
  onyx: textureOf("onyx"),
};
const gold = new THREE.MeshStandardMaterial({color:0xc6a26b,metalness:.78,roughness:.23});
const lightGold = new THREE.MeshStandardMaterial({color:0xf3d19b,metalness:.65,roughness:.23});
const darkGold = new THREE.MeshStandardMaterial({color:0x5f4832,metalness:.62,roughness:.35});
const rope = new THREE.MeshStandardMaterial({color:0x513621,roughness:.96,metalness:0});
const blue = new THREE.MeshPhysicalMaterial({color:0x21324a,metalness:.25,roughness:.25,clearcoat:.7});
const metal = new THREE.MeshStandardMaterial({color:0xbba98a,metalness:.65,roughness:.33});
const beadGeometry = new THREE.SphereGeometry(1, 24, 16);
const torusGeometry = new THREE.TorusGeometry(1,.14,6,18);
const lineGeometry = new THREE.CylinderGeometry(.012,.012,1,7,1);
const currentVec = new THREE.Vector3();

function makeMaterial(name) {
  return new THREE.MeshPhysicalMaterial({
    map:textures[name], roughness:name === "wood" ? .4 : .31,
    metalness:name === "onyx" ? .12 : .035,
    clearcoat:name === "wood" ? .38 : .75,
    clearcoatRoughness:name === "wood" ? .23 : .16,
    bumpMap:textures[name],bumpScale:name === "wood" ? .011 : .004,
  });
}
function setMaterial(name) {
  if (!textures[name]) return;
  materialName = name;
  try { localStorage.setItem("rosario3d.material", name); } catch {}
  const old = activeMaterial;
  const oldGlow = activeGlowMaterial;
  activeMaterial = makeMaterial(name);
  activeGlowMaterial = activeMaterial.clone();
  activeGlowMaterial.emissive = new THREE.Color(0xe5a955);
  activeGlowMaterial.emissiveIntensity = .55;
  for (const node of beads) {
    if (node.kind === "small" || node.kind === "large") {
      node.surface.material = node.index === selected ? activeGlowMaterial : activeMaterial;
    }
  }
  old?.dispose();
  oldGlow?.dispose();
  for (const b of materialButtons) {
    const active = b.dataset.material === name;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", String(active));
  }
}

function createMedallion() {
  const g = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.SphereGeometry(1,24,18),gold);
  rim.scale.set(.172,.245,.065);
  g.add(rim);
  const core = new THREE.Mesh(new THREE.SphereGeometry(1,24,18),blue);
  core.position.z = .041;
  core.scale.set(.14,.208,.046);
  g.add(core);
  const canvas = document.createElement("canvas");
  canvas.width=128; canvas.height=192;
  const ctx=canvas.getContext("2d");
  ctx.clearRect(0,0,128,192);
  ctx.strokeStyle="#edcc99";ctx.fillStyle="#edcc99";
  ctx.lineWidth=2.5;
  ctx.beginPath();ctx.ellipse(64,96,51,81,0,0,Math.PI*2);ctx.stroke();
  ctx.font="bold 82px Georgia";ctx.textAlign="center";ctx.fillText("M",64,125);
  for(let i=0;i<10;i++){
    const a=i*Math.PI*2/10-Math.PI/2;
    ctx.beginPath();ctx.arc(64+39*Math.cos(a),96+64*Math.sin(a),2,0,Math.PI*2);ctx.fill();
  }
  const decal=new THREE.CanvasTexture(canvas);decal.colorSpace=THREE.SRGBColorSpace;
  const front=new THREE.Mesh(
    new THREE.PlaneGeometry(.255,.395),
    new THREE.MeshBasicMaterial({map:decal,transparent:true,depthWrite:false,side:THREE.DoubleSide})
  );
  front.position.z=.088;
  g.add(front);
  for(const sign of [-1,1]){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.075,.012,8,18),gold);
    ring.scale.set(.66,1,1);
    ring.position.y=sign*.265;
    g.add(ring);
  }
  return g;
}
function createCross() {
  const root=new THREE.Group();
  const shape=new THREE.Shape();
  const x=.115, top=.40, lower=-.37, arm=.245;
  shape.moveTo(-x,top);
  shape.lineTo(x,top);shape.lineTo(x,.10);
  shape.lineTo(arm,.10);shape.lineTo(arm,-.045);
  shape.lineTo(x,-.045);shape.lineTo(x,lower);
  shape.lineTo(-x,lower);shape.lineTo(-x,-.045);
  shape.lineTo(-arm,-.045);shape.lineTo(-arm,.10);
  shape.lineTo(-x,.10);shape.closePath();
  const shapeMesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{
    depth:.07,bevelEnabled:true,bevelThickness:.025,bevelSize:.014,bevelSegments:2,steps:1
  }),gold);
  shapeMesh.position.z=-.045;root.add(shapeMesh);
  const inner=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{
    depth:.015,bevelEnabled:true,bevelSize:.005,bevelThickness:.005,bevelSegments:1
  }),darkGold);
  inner.scale.set(.77,.80,1);
  inner.position.z=.057;root.add(inner);
  const tinyBall=(r,x,y,z,mat=lightGold)=>{
    const ball=new THREE.Mesh(new THREE.SphereGeometry(r,12,9),mat);
    ball.position.set(x,y,z);root.add(ball);return ball;
  };
  const segment=(from,to,r,mat=lightGold)=>{
    const d=new THREE.Vector3().subVectors(to,from);
    const piece=new THREE.Mesh(new THREE.CylinderGeometry(r*.78,r,d.length(),10),mat);
    piece.position.copy(from).addScaledVector(d,.5);
    piece.quaternion.setFromUnitVectors(UP,d.normalize());
    root.add(piece);
  };
  const z=.085;
  tinyBall(.052,0,.18,z);
  segment(new THREE.Vector3(0,.12,z),new THREE.Vector3(0,-.12,z),.038);
  segment(new THREE.Vector3(-.185,.055,z),new THREE.Vector3(.185,.055,z),.023);
  segment(new THREE.Vector3(-.02,-.115,z),new THREE.Vector3(-.052,-.29,z),.026);
  segment(new THREE.Vector3(.02,-.115,z),new THREE.Vector3(.052,-.29,z),.026);
  const loop=new THREE.Mesh(new THREE.TorusGeometry(.055,.015,8,18),gold);
  loop.position.y=.44;root.add(loop);
  return root;
}

function node(kind,p,index,decade=0) {
  const group=new THREE.Group();
  rosary.add(group);
  const point=p.clone();
  const n={index,kind,decade,mesh:group,p:point,old:point.clone(),rest:point.clone(),grabbedBy:new Set(),target:null,ringMeshes:[]};
  if(kind==="small"||kind==="large") {
    const size=kind==="large"?.135:.084;
    n.radius=size;
    const surface=new THREE.Mesh(beadGeometry,activeMaterial);
    surface.scale.setScalar(size);
    surface.userData.beadIndex=index;
    group.add(surface); n.surface=surface;
    if(kind==="large") {
      for(const polarity of [-1,1]) {
        const collar=new THREE.Mesh(torusGeometry,gold);
        collar.scale.set(.051,.051,.051);
        collar.position.set(0,polarity*size*.91,0);
        collar.quaternion.setFromUnitVectors(WORLD_Z,UP);
        group.add(collar);n.ringMeshes.push(collar);
      }
    } else {
      const detail=new THREE.Mesh(new THREE.TorusGeometry(.026,.009,5,12),darkGold);
      detail.position.y=.075;
      detail.rotation.x=Math.PI/2;
      group.add(detail);
      n.ringMeshes.push(detail);
    }
  } else if(kind==="medal") {
    n.radius=.235;
    group.add(createMedallion());
  } else if(kind==="cross") {
    n.radius=.42;
    group.add(createCross());
  }
  group.position.copy(point);
  beads.push(n);
  return n;
}
function connect(a,b) {
  const mesh=new THREE.Mesh(lineGeometry,rope);
  rosary.add(mesh);
  links.push({a,b,mesh,restLength:Math.max(
    a.rest.distanceTo(b.rest),(a.radius||.1)+(b.radius||.1)+.017
  )});
}
function ellipseCurve() {
  const samples=1400,cumulative=[0],points=[];
  const rx=1.40,ry=1.88,cy=1.14;
  for(let i=0;i<=samples;i++){
    const theta=-Math.PI/2 + i/samples*Math.PI*2;
    points.push(new THREE.Vector3(rx*Math.cos(theta),cy+ry*Math.sin(theta),.012*Math.sin(theta*4)));
    if(i>0)cumulative.push(cumulative[i-1]+points[i].distanceTo(points[i-1]));
  }
  const total=cumulative.at(-1);
  return (fraction)=>{
    const distance=fraction*total;
    let lo=0,hi=samples;
    while(lo<hi){const mid=(lo+hi)>>1;if(cumulative[mid]<distance)lo=mid+1;else hi=mid;}
    const index=clamp(lo,1,samples);
    const t=(distance-cumulative[index-1])/(cumulative[index]-cumulative[index-1]);
    return points[index-1].clone().lerp(points[index],t);
  };
}
function buildRosary() {
  rosary=new THREE.Group();
  scene.add(rosary);
  activeMaterial=makeMaterial("wood");
  activeGlowMaterial=activeMaterial.clone();
  activeGlowMaterial.emissive=new THREE.Color(0xe5a955);
  activeGlowMaterial.emissiveIntensity=.55;
  const medal=node("medal",new THREE.Vector3(0,-.74,0),0);
  const curve=ellipseCurve();
  let previous=medal;
  for(let i=1;i<=54;i++) {
    const large=i===11||i===22||i===33||i===44;
    const decade = Math.min(5,Math.floor((i-1)/11)+1);
    const n=node(large?"large":"small",curve(i/55),i,decade);
    connect(previous,n);
    previous=n;
  }
  connect(previous,medal);
  previous=medal;
  const ys=[-1.18,-1.50,-1.80,-2.10,-2.46];
  for(let i=0;i<ys.length;i++) {
    const n=node(i===0||i===4?"large":"small",new THREE.Vector3(0,ys[i],.035),55+i,0);
    connect(previous,n);previous=n;
  }
  const cross=node("cross",new THREE.Vector3(0,-3.08,.03),60);
  connect(previous,cross);
  if(beads.filter(n=>n.kind==="small").length!==53||
     beads.filter(n=>n.kind==="large").length!==6){
    throw new Error("La corona deve contenere 53 Ave Maria e 6 Padre Nostro");
  }
  rosary.rotation.set(0,0,0);
}
function makeHalo() {
  const cnv=document.createElement("canvas");
  cnv.width=128;cnv.height=128;
  const ctx=cnv.getContext("2d");
  const gradient=ctx.createRadialGradient(64,64,8,64,64,64);
  gradient.addColorStop(0,"rgba(255,224,160,.73)");
  gradient.addColorStop(.3,"rgba(251,195,112,.23)");
  gradient.addColorStop(.7,"rgba(230,157,71,.065)");
  gradient.addColorStop(1,"rgba(230,157,71,0)");
  ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  const t=new THREE.CanvasTexture(cnv);
  selectedHalo=new THREE.Sprite(new THREE.SpriteMaterial({
    map:t,transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending
  }));
  selectedHalo.scale.set(.72,.72,1);
  scene.add(selectedHalo);
  selectedLamp=new THREE.PointLight(0xffc36e,2.2,1.2,1.65);
  scene.add(selectedLamp);
}
function setSelected(index, vibrate=true) {
  const n=beads[index];
  if(!n || (n.kind!=="small"&&n.kind!=="large"))return;
  selected=index;
  for(const bead of beads) {
    if(bead.surface) bead.surface.material=bead.index===selected?activeGlowMaterial:activeMaterial;
  }
  const tail=index>=55;
  const large=n.kind==="large";
  if(tail){
    const num=index-54;
    title.textContent=large?"Padre Nostro · coda":"Ave Maria · coda";
    details.textContent="Grano "+num+" di 5 · sequenza iniziale";
  } else {
    const decade=Math.min(5,Math.floor((index-1)/11)+1);
    const count=index-[0,11,22,33,44][decade-1];
    title.textContent=large?"Padre Nostro · separatore":"Ave Maria · "+decade+"ª decina";
    details.textContent=large?"Grano fra due decine":("Grano "+Math.min(10,count)+" di 10");
  }
  if(vibrate&&navigator.vibrate)navigator.vibrate(8);
}
function resize() {
  if (!renderer || !camera) return;
  const w=Math.max(stage.clientWidth,1),h=Math.max(stage.clientHeight,1);
  // Dimensione in pixel CSS costante: nessun adattamento all'intera corona.
  viewWidth=w/CSS_PX_PER_WORLD;
  viewHeight=h/CSS_PX_PER_WORLD;
  camera.left=-viewWidth/2; camera.right=viewWidth/2;
  camera.top=viewHeight/2;camera.bottom=-viewHeight/2;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8));
  renderer.setSize(w,h,false);
  frameBounds=stage.getBoundingClientRect();
  updateGripTargets();
  constrain();
}
function worldToLocalOnPlane(x,y) {
  const bounds=frameBounds||stage.getBoundingClientRect();
  return new THREE.Vector3(
    (x-bounds.left-bounds.width/2)/CSS_PX_PER_WORLD,
    (bounds.top+bounds.height/2-y)/CSS_PX_PER_WORLD, .02);
}
function updateGripTargets() {
  const bounds=frameBounds||stage.getBoundingClientRect();
  const frame=gripFrame.getBoundingClientRect();
  const x=frame.left+frame.width*.47;
  const y=frame.top+frame.height*.53;
  const px=(x-bounds.left-bounds.width/2)/CSS_PX_PER_WORLD;
  const py=(bounds.top+bounds.height/2-y)/CSS_PX_PER_WORLD;
  guidePoints=Array.from({length:GRIP_BEADS},(_,slot)=>
    new THREE.Vector3(px,py+(slot-2)*GRIP_PITCH,0));
  // Il punto fisico a sinistra è allineato al centro del riquadro destro.
  const leftBox=guidePointLeft.getBoundingClientRect();
  const supportX=leftBox.left+leftBox.width/2;
  leftGuidePoint.set(
    (supportX-bounds.left-bounds.width/2)/CSS_PX_PER_WORLD,
    py, 0
  );
  updateUpperArc();
}
function guideTarget(slot) {return guidePoints[slot];}
function gripIndex(slot) { return gripStart+slot; }
// Solo una breve campata superiore, non metà corona.
function leftGuideIndex() {
  return upperArcIndices.at(-1) || 25;
}
function leftGuideTarget() {return leftGuidePoint;}
function topArcIndices(rise) {
  const from=Math.min(54,gripIndex(GRIP_BEADS-1));
  const count=chooseArchSteps(guideTarget(GRIP_BEADS-1),leftGuideTarget(),rise,GRIP_PITCH);
  // La connessione fra 54 e 1 attraversa davvero la medaglietta 0.
  return ringArcPath(from,count);
}
function updateUpperArc() {
  if(!beads.length||!guidePoints.length)return;
  const start=guideTarget(GRIP_BEADS-1);
  const end=leftGuideTarget();
  const availableRise=viewHeight/2-ARC_TOP_MARGIN-Math.max(start.y,end.y);
  const rise=clamp(availableRise,.03,ARC_RISE);
  upperArcIndices=topArcIndices(rise);
  // Campionamento a lunghezza d'arco: i grani sono distribuiti in modo
  // regolare sul profilo anche dove la curva si inclina molto.
  const samples=96,positions=[],distances=[0];
  for(let i=0;i<=samples;i++){
    const p=archPoint(start,end,rise,i/samples);
    const point=new THREE.Vector3(p.x,p.y,0);
    positions.push(point);
    if(i>0)distances.push(distances.at(-1)+point.distanceTo(positions[i-1]));
  }
  const total=distances.at(-1);
  upperArcTargets=upperArcIndices.map((_,i)=>{
    if(upperArcIndices.length===1)return start.clone();
    const fraction=i/(upperArcIndices.length-1);
    const targetDistance=total*fraction;
    let low=1,high=samples;
    while(low<high){
      const mid=(low+high)>>1;
      if(distances[mid]<targetDistance)low=mid+1;
      else high=mid;
    }
    const k=low;
    const denominator=distances[k]-distances[k-1];
    const alpha=denominator>0?(targetDistance-distances[k-1])/denominator:0;
    return positions[k-1].clone().lerp(positions[k],clamp(alpha,0,1));
  });
}
function shiftGrip(direction) {
  const next=clamp(gripStart+direction,1,55);
  if(next===gripStart)return false;
  gripStart=next;
  gripCount.textContent=`${gripStart}–${gripStart+GRIP_BEADS-1}`;
  updateUpperArc();
  navigator.vibrate?.(6);
  return true;
}
function moveGripByPixels(delta) {
  guideMoved+=delta;
  const pitch=GRIP_PITCH*CSS_PX_PER_WORLD;
  while(Math.abs(guideMoved)>=pitch) {
    const direction=guideMoved>0?1:-1;
    if(!shiftGrip(direction)){guideMoved=0;break;}
    guideMoved-=direction*pitch;
  }
}
function pick(x,y) {
  const box=stage.getBoundingClientRect();
  let candidate=-1,score=28*28;
  rosary.updateMatrixWorld(true);
  for(const n of beads) {
    if(n.kind!=="small"&&n.kind!=="large")continue;
    const world=rosary.localToWorld(n.p.clone());
    const projected=world.project(camera);
    if(projected.z<-.9||projected.z>.9)continue;
    const px=box.left+(projected.x+1)*box.width/2;
    const py=box.top+(1-projected.y)*box.height/2;
    const d=(px-x)**2+(py-y)**2;
    if(d<score){score=d;candidate=n.index;}
  }
  return candidate;
}
function constrain() {
  // Collisione dei grani con i quattro bordi: NON si scala il modello.
  const left=-viewWidth/2+SCREEN_INSET, right=viewWidth/2-SCREEN_INSET;
  const bottom=-viewHeight/2+SCREEN_INSET, top=viewHeight/2-SCREEN_INSET;
  for(const n of beads) {
    const r=n.radius||.1;
    const oldX=n.p.x,oldY=n.p.y;
    n.p.x=clamp(n.p.x,left+r,right-r);
    n.p.y=clamp(n.p.y,bottom+r,top-r);
    if(n.p.x!==oldX)n.old.x=n.p.x+(oldX-n.p.x)*.08;
    if(n.p.y!==oldY)n.old.y=n.p.y+(oldY-n.p.y)*.08;
    n.p.z=clamp(n.p.z,-.09,.09);
  }
}
function handlePointerDown(event) {
  event.preventDefault();
  stage.setPointerCapture(event.pointerId);
  const hit=pick(event.clientX,event.clientY);
  const frame=gripFrame.getBoundingClientRect();
  const p={
    id:event.pointerId,x:event.clientX,y:event.clientY,bead:hit,
    inGrip:event.clientX>=frame.left&&event.clientX<=frame.right
      &&event.clientY>=frame.top&&event.clientY<=frame.bottom,
  };
  touches.set(event.pointerId,p);
  if(hit>=0){
    setSelected(hit);
    beads[hit].grabbedBy.add(event.pointerId);
    beads[hit].target=worldToLocalOnPlane(p.x,p.y);
  }
}
function handlePointerMove(event) {
  const p=touches.get(event.pointerId);
  if(!p)return;
  event.preventDefault();
  const previousY=p.y;
  p.x=event.clientX;p.y=event.clientY;
  if(p.bead>=0){
    // Due dita su due grani = due vincoli trascinati indipendenti.
    beads[p.bead].target=worldToLocalOnPlane(p.x,p.y);
    if(p.inGrip&&touches.size===1)moveGripByPixels(p.y-previousY);
  } else if(touches.size===1 ||
      (touches.size===2&&[...touches.values()].every(t=>t.bead<0))){
    // Lo sfondo alimenta la guida, senza trasformazioni/zoom della camera.
    moveGripByPixels(p.y-previousY);
  }
}
function handlePointerUp(event) {
  const p=touches.get(event.pointerId);
  if(!p)return;
  event.preventDefault();
  if(p.bead>=0) {
    const n=beads[p.bead];
    n.grabbedBy.delete(event.pointerId);
    if(!n.grabbedBy.size)n.target=null;
  }
  touches.delete(event.pointerId);
  guideMoved=0;
}
function reset() {
  gripStart=12;
  guideMoved=0;
  gripCount.textContent=`${gripStart}–${gripStart+GRIP_BEADS-1}`;
  touches.clear();
  rosary.position.set(0,0,0);
  rosary.rotation.set(0,0,0);
  rosary.scale.setScalar(1);
  updateGripTargets();
  // Il lato destro dell'anello parte dentro la finestra di presa.
  const displacement=guideTarget(2).clone().sub(beads[gripStart+2].rest);
  for(const n of beads){
    n.p.copy(n.rest).add(displacement);
    n.old.copy(n.p);
    n.target=null;
    n.grabbedBy.clear();
    n.mesh.position.copy(n.p);
  }
  constrain();
  // Assestamento iniziale: gli altri grani ricadono naturalmente.
  for(let i=0;i<90;i++)physics();
  setSelected(gripStart+2,false);
}
function physics() {
  // Verlet: ogni grano tende a cadere, il crocifisso pesa di più.
  for(const n of beads){
    if(n.grabbedBy.size&&n.target) {
      n.old.copy(n.p);
      n.p.lerp(n.target,.85);
      continue;
    }
    vA.copy(n.p).sub(n.old).multiplyScalar(.87);
    n.old.copy(n.p);
    n.p.add(vA);
    n.p.y-=GRAVITY*(n.kind==="cross"?1.65:n.kind==="large"?1.2:1);
  }
  const held=new Set();
  for(let slot=0;slot<GRIP_BEADS;slot++)held.add(gripIndex(slot));
  const secondaryIndex=leftGuideIndex();
  for(let iteration=0;iteration<6;iteration++){
    // Seconda forza: cinque grani nel riquadro, elasticamente trattenuti.
    for(let slot=0;slot<GRIP_BEADS;slot++){
      const n=beads[gripIndex(slot)];
      if(!n.grabbedBy.size)n.p.lerp(guideTarget(slot),iteration===0?.33:.22);
    }
    // Un solo grano sul lato opposto: sostegno più debole della presa.
    // Se viene afferrato, il dito prevale sull'attrazione del punto.
    const secondary=beads[secondaryIndex];
    if(secondary && !secondary.grabbedBy.size) {
      secondary.p.lerp(leftGuideTarget(),iteration===0?LEFT_GUIDE_STRENGTH:.035);
    }
    // Solo il percorso superiore è guidato verso un arco curvo.
    // Non tocchiamo i grani del percorso inferiore: cadono per gravità.
    for(let k=1;k<upperArcIndices.length-1;k++) {
      const index=upperArcIndices[k];
      const n=beads[index];
      if(n.grabbedBy.size||held.has(index)||index===secondaryIndex)continue;
      const t=k/(upperArcIndices.length-1);
      const fade=Math.sin(Math.PI*t); // transizione morbida agli appoggi
      // La campata cede vicino alle dita, senza combattere il tocco.
      const nearFinger=touches.size && [-2,-1,0,1,2].some(offset=>{
        const adjacent=upperArcIndices[k+offset];
        return adjacent!==undefined&&beads[adjacent].grabbedBy.size>0;
      });
      n.p.lerp(upperArcTargets[k],
        fade*(nearFinger?.22:1)*(iteration===0?ARC_PULL:ARC_PULL_LATER));
    }
    // Corda inestensibile: il movimento di un grano si propaga ai vicini.
    for(const edge of links){
      const a=edge.a,b=edge.b;
      vA.copy(b.p).sub(a.p);
      const length=vA.length();
      if(length<.00001)continue;
      const factor=(length-edge.restLength)/length;
      const wa=a.grabbedBy.size?0:held.has(a.index)?.12:a.index===secondaryIndex?.38:1;
      const wb=b.grabbedBy.size?0:held.has(b.index)?.12:b.index===secondaryIndex?.38:1;
      const total=wa+wb;
      if(total<.001)continue;
      a.p.addScaledVector(vA,factor*wa/total*.79);
      b.p.addScaledVector(vA,-factor*wb/total*.79);
    }
    // Volume solido dei grani: non attraversano il mucchio in basso.
    for(let i=0;i<beads.length;i++){
      const a=beads[i];
      for(let j=i+2;j<beads.length;j++){
        const b=beads[j];
        const minimum=(a.radius||.1)+(b.radius||.1)+.008;
        if(Math.abs(a.p.x-b.p.x)>minimum || Math.abs(a.p.y-b.p.y)>minimum)continue;
        vA.copy(b.p).sub(a.p);
        let distance=vA.length();
        if(distance>=minimum)continue;
        if(distance<.00001) {
          // Due grani sovrapposti devono comunque separarsi.
          vA.set((j%2 ? 1 : -1)*.008,.003,0);
          distance=vA.length();
        }
        const overlap=(minimum-distance)/distance*.40;
        const wa=a.grabbedBy.size?0:held.has(a.index)?.15:a.index===secondaryIndex?.38:1;
        const wb=b.grabbedBy.size?0:held.has(b.index)?.15:b.index===secondaryIndex?.38:1;
        const total=wa+wb;
        if(!total)continue;
        a.p.addScaledVector(vA,-overlap*wa/total);
        b.p.addScaledVector(vA,overlap*wb/total);
      }
    }
    constrain();
  }
  for(const n of beads){
    if(n.grabbedBy.size&&n.target)n.p.lerp(n.target,.4);
    else n.old.lerp(n.p,.24); // smorza le spinte introdotte dai vincoli
    n.mesh.position.copy(n.p);
  }
}

function updateLinks() {
  for(const edge of links){
    vA.copy(edge.b.p).sub(edge.a.p);
    const length=vA.length();
    edge.mesh.position.copy(edge.a.p).addScaledVector(vA,.5);
    edge.mesh.scale.set(1,length,1);
    edge.mesh.quaternion.setFromUnitVectors(UP,vA.normalize());
  }
}
function animate() {
  requestAnimationFrame(animate);
  const now=performance.now();
  const steps=Math.min(3,Math.max(1,Math.round((now-frameLast)/16.67)||1));
  frameLast=now;
  for(let i=0;i<steps;i++)physics();
  updateLinks();
  rosary.updateMatrixWorld(true);
  const bead=beads[selected];
  if(bead&&selectedLamp&&selectedHalo) {
    const position=rosary.localToWorld(bead.p.clone());
    selectedHalo.position.copy(position);
    selectedHalo.position.z+=.14;
    selectedLamp.position.copy(position);
    selectedLamp.position.z+=.38;
    const radius=bead.kind==="large"?.66:.5;
    selectedHalo.scale.set(radius,radius,1);
  }
  renderer.render(scene,camera);
}
function setup() {
  try {
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.30;
  } catch(err) {
    fallback.hidden=false;
    console.error("Rosario 3D: WebGL non disponibile",err);
    return;
  }
  stage.appendChild(renderer.domElement);
  window.__rosario3dReady = true;
  fallback.hidden = true;
  scene=new THREE.Scene();
  camera=new THREE.OrthographicCamera(-2,2,4.5,-4.5,.01,60);
  camera.position.set(0,0,18);
  camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xffe3be,0x24384f,2.1));
  const main=new THREE.DirectionalLight(0xffd2a1,2.7);
  main.position.set(-4,6,11);scene.add(main);
  const rim=new THREE.DirectionalLight(0x91b6ff,1.2);
  rim.position.set(5,-3,7);scene.add(rim);
  buildRosary();
  makeHalo();
  try {
    const preference=localStorage.getItem("rosario3d.material");
    if(textures[preference])materialName=preference;
  } catch{}
  setMaterial(materialName);
  resize();
  reset();
  stage.addEventListener("pointerdown",handlePointerDown);
  stage.addEventListener("pointermove",handlePointerMove);
  stage.addEventListener("pointerup",handlePointerUp);
  stage.addEventListener("pointercancel",handlePointerUp);
  stage.addEventListener("lostpointercapture",handlePointerUp);
  stage.addEventListener("contextmenu",e=>e.preventDefault());
  stage.addEventListener("wheel",e=>{
    e.preventDefault();
    shiftGrip(Math.sign(e.deltaY));
  },{passive:false});

  stage.addEventListener("keydown",e=>{
    if(e.key==="Escape"||e.key==="r"||e.key==="R")reset();
    else if(e.key==="ArrowDown")shiftGrip(1);
    else if(e.key==="ArrowUp")shiftGrip(-1);
    else if(e.key==="ArrowRight")setSelected(clamp(selected+1,1,59));
    else if(e.key==="ArrowLeft")setSelected(clamp(selected-1,1,59));
  });
  window.addEventListener("resize",resize);
  window.visualViewport?.addEventListener("resize",resize);
  for(const button of materialButtons)button.addEventListener("click",()=>setMaterial(button.dataset.material));
  document.querySelector("#reset").addEventListener("click",reset);
  document.querySelector("#toggleUi").addEventListener("click",()=>{
    document.querySelector(".experience").classList.add("hide-ui");
    document.querySelector("#miniUi").hidden=false;
  });
  document.querySelector("#showUi").addEventListener("click",()=>{
    document.querySelector(".experience").classList.remove("hide-ui");
    document.querySelector("#miniUi").hidden=true;
  });
  animate();
}
setup();
