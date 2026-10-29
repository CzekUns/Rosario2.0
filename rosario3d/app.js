import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js";

// Laboratorio indipendente: 54 grani sull'anello (50 Ave Maria + 4 Padre Nostro),
// medaglia centrale, 5 grani sulla coda (3 Ave Maria + 2 Padre Nostro), crocifisso.
// La medaglia prende il posto del quinto divisore sull'anello: 59 grani totali.
const stage = document.querySelector("#stage");
const fallback = document.querySelector("#fallback");
const title = document.querySelector("#selectedTitle");
const details = document.querySelector("#selectedInfo");
const materialButtons = [...document.querySelectorAll("[data-material]")];
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

let scene, camera, renderer, rosary;
let beads = [];
let links = [];
let selected = 17;
let viewWidth = 4, viewHeight = 9;
let materialName = "wood";
let activeMaterial, activeGlowMaterial;
const touches = new Map();
let transformStart = null;
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
  links.push({a,b,mesh,restLength:a.rest.distanceTo(b.rest)});
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
  rosary.rotation.set(.09,-.10,0);
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
  if(!renderer||!camera)return;
  const w=Math.max(stage.clientWidth,1),h=Math.max(stage.clientHeight,1);
  const aspect=w/h;
  viewHeight=Math.max(8.25,3.85/aspect);
  viewWidth=viewHeight*aspect;
  camera.left=-viewWidth/2;camera.right=viewWidth/2;
  camera.top=viewHeight/2;camera.bottom=-viewHeight/2;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8));
  renderer.setSize(w,h,false);
  constrain();
}
function screenNdc(x,y) {
  const box=stage.getBoundingClientRect();
  return new THREE.Vector2(
    clamp((x-box.left)/box.width*2-1,-.92,.92),
    clamp(1-(y-box.top)/box.height*2,-.92,.92)
  );
}
function worldToLocalOnPlane(x,y) {
  const ndc=screenNdc(x,y);
  const point=new THREE.Vector3(ndc.x,ndc.y,-1).unproject(camera);
  const direction=new THREE.Vector3(0,0,-1);
  rosary.updateMatrixWorld(true);
  const planePoint=rosary.localToWorld(new THREE.Vector3(0,0,0));
  const normal=WORLD_Z.clone().transformDirection(rosary.matrixWorld);
  const plane=new THREE.Plane().setFromNormalAndCoplanarPoint(normal,planePoint);
  const ray=new THREE.Ray(point,direction);
  const hit=new THREE.Vector3();
  if(!ray.intersectPlane(plane,hit))return null;
  return rosary.worldToLocal(hit);
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
function beginTwoFingerTransform() {
  const [a,b]=[...touches.values()];
  if(!a||!b)return;
  if(a.bead>=0&&b.bead>=0&&a.bead!==b.bead) {
    transformStart=null;
    return;
  }
  for(const item of touches.values())item.bead=-1;
  const dx=b.x-a.x,dy=b.y-a.y;
  transformStart={
    length:Math.max(30,Math.hypot(dx,dy)),angle:Math.atan2(dy,dx),
    midpointX:(a.x+b.x)/2,midpointY:(a.y+b.y)/2,
    scale:rosary.scale.x,rot:rosary.rotation.z,
    px:rosary.position.x,py:rosary.position.y,
  };
}
function constrain() {
  if(!camera||!rosary||!beads.length)return;
  rosary.updateMatrixWorld(true);
  function bounds(){
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    for(const n of beads){
      const projected=rosary.localToWorld(n.p.clone()).project(camera);
      const pad=n.kind==="cross"?.075:n.kind==="large"?.04:.025;
      minX=Math.min(minX,projected.x-pad);maxX=Math.max(maxX,projected.x+pad);
      minY=Math.min(minY,projected.y-pad);maxY=Math.max(maxY,projected.y+pad);
    }
    return {minX,maxX,minY,maxY};
  }
  const limit=.945;
  let box=bounds();
  const s=Math.min(1,(2*limit)/(box.maxX-box.minX),(2*limit)/(box.maxY-box.minY));
  if(s<1){
    rosary.scale.multiplyScalar(s*.998);
    rosary.updateMatrixWorld(true);
    box=bounds();
  }
  let dx=0,dy=0;
  if(box.minX< -limit)dx=-limit-box.minX;
  else if(box.maxX>limit)dx=limit-box.maxX;
  if(box.minY< -limit)dy=-limit-box.minY;
  else if(box.maxY>limit)dy=limit-box.maxY;
  rosary.position.x+=dx*viewWidth/2;
  rosary.position.y+=dy*viewHeight/2;
  rosary.updateMatrixWorld(true);
}
function handlePointerDown(event) {
  event.preventDefault();
  stage.setPointerCapture(event.pointerId);
  const hit=pick(event.clientX,event.clientY);
  const record={
    id:event.pointerId,x:event.clientX,y:event.clientY,
    lastX:event.clientX,lastY:event.clientY,startX:event.clientX,startY:event.clientY,
    bead:hit,
  };
  touches.set(event.pointerId,record);
  if(hit>=0){
    setSelected(hit);
    beads[hit].grabbedBy.add(event.pointerId);
    beads[hit].target=worldToLocalOnPlane(event.clientX,event.clientY);
  }
  if(touches.size===2){
    beginTwoFingerTransform();
    if(transformStart)for(const n of beads){n.grabbedBy.clear();n.target=null;}
  }
}
function handlePointerMove(event) {
  const p=touches.get(event.pointerId);
  if(!p)return;
  event.preventDefault();
  const dx=event.clientX-p.x,dy=event.clientY-p.y;
  p.lastX=p.x;p.lastY=p.y;p.x=event.clientX;p.y=event.clientY;
  if(touches.size>=2) {
    if(transformStart){
      const [a,b]=[...touches.values()];
      const ddx=b.x-a.x,ddy=b.y-a.y;
      const midX=(a.x+b.x)/2,midY=(a.y+b.y)/2;
      const scale=clamp(transformStart.scale*Math.hypot(ddx,ddy)/transformStart.length,.55,2.0);
      rosary.scale.setScalar(scale);
      rosary.rotation.z=transformStart.rot+Math.atan2(ddy,ddx)-transformStart.angle;
      rosary.position.x=transformStart.px+(midX-transformStart.midpointX)/stage.clientWidth*viewWidth;
      rosary.position.y=transformStart.py-(midY-transformStart.midpointY)/stage.clientHeight*viewHeight;
      constrain();
    } else {
      for(const item of touches.values()){
        if(item.bead>=0){
          const n=beads[item.bead];
          n.target=worldToLocalOnPlane(item.x,item.y);
        }
      }
    }
    return;
  }
  if(p.bead>=0) {
    beads[p.bead].target=worldToLocalOnPlane(p.x,p.y);
  } else {
    rosary.rotation.y=clamp(rosary.rotation.y+dx*.006,-.82,.82);
    rosary.rotation.x=clamp(rosary.rotation.x+dy*.005,-.65,.65);
    constrain();
  }
}
function handlePointerUp(event) {
  const p=touches.get(event.pointerId);
  if(!p)return;
  event.preventDefault();
  if(p.bead>=0) {
    beads[p.bead].grabbedBy.delete(event.pointerId);
    if(!beads[p.bead].grabbedBy.size)beads[p.bead].target=null;
  }
  touches.delete(event.pointerId);
  if(touches.size===1) {
    const other=[...touches.values()][0];
    other.lastX=other.x;other.lastY=other.y;
    if(other.bead>=0){
      beads[other.bead].grabbedBy.add(other.id);
      beads[other.bead].target=worldToLocalOnPlane(other.x,other.y);
    }
  }
  transformStart=null;
}
function reset() {
  for(const n of beads){
    n.p.copy(n.rest);n.old.copy(n.rest);
    n.target=null;n.grabbedBy.clear();
  }
  touches.clear();
  rosary.position.set(0,0,0);
  rosary.rotation.set(.09,-.10,0);
  rosary.scale.setScalar(1);
  setSelected(17,false);
  constrain();
}
function physics() {
  for(const n of beads){
    if(n.grabbedBy.size&&n.target){
      n.old.copy(n.p);n.p.lerp(n.target,.72);
      continue;
    }
    // Verlet con ritorno morbido alla geometria di riposo e inerzia limitata.
    vA.copy(n.p).sub(n.old).multiplyScalar(n.kind==="cross"?.78:.82);
    n.old.copy(n.p);
    const restoring=n.kind==="medal"?.14:n.kind==="cross"?.020:.025;
    n.p.add(vA).lerp(n.rest,restoring);
  }
  for(let step=0;step<5;step++){
    for(const edge of links){
      const a=edge.a,b=edge.b;
      vA.copy(b.p).sub(a.p);
      const len=vA.length();
      if(len<.0001)continue;
      const strength=(len-edge.restLength)/len;
      const fixA=a.grabbedBy.size&&a.target;
      const fixB=b.grabbedBy.size&&b.target;
      const influenceA=fixA?0:a.kind==="medal"?.13:.5;
      const influenceB=fixB?0:b.kind==="medal"?.13:.5;
      const total=influenceA+influenceB;
      if(!total)continue;
      a.p.addScaledVector(vA,strength*influenceA/total*.62);
      b.p.addScaledVector(vA,-strength*influenceB/total*.62);
    }
  }
  for(const n of beads){
    if(n.grabbedBy.size&&n.target)n.p.lerp(n.target,.5);
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
  if(!reduceMotion || touches.size)physics();
  updateLinks();
  rosary.updateMatrixWorld(true);
  const bead=beads[selected];
  if(bead&&selectedLamp&&selectedHalo){
    const pos=rosary.localToWorld(bead.p.clone());
    selectedHalo.position.copy(pos);
    selectedHalo.position.z+=.14;
    selectedLamp.position.copy(pos);
    selectedLamp.position.z+=.38;
    const time=performance.now()*.001;
    const scale=(bead.kind==="large"?.66:.50)*(1+.07*Math.sin(time*2.8));
    selectedHalo.scale.set(scale,scale,1);
  }
  if(++frameNumber % 3 === 0)constrain();
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
  setSelected(17,false);
  resize();
  stage.addEventListener("pointerdown",handlePointerDown);
  stage.addEventListener("pointermove",handlePointerMove);
  stage.addEventListener("pointerup",handlePointerUp);
  stage.addEventListener("pointercancel",handlePointerUp);
  stage.addEventListener("lostpointercapture",handlePointerUp);
  stage.addEventListener("contextmenu",e=>e.preventDefault());
  stage.addEventListener("wheel",e=>{
    e.preventDefault();
    rosary.scale.multiplyScalar(e.deltaY<0?1.075:.93);
    constrain();
  },{passive:false});
  stage.addEventListener("keydown",e=>{
    if(e.key==="Escape"||e.key==="r"||e.key==="R")reset();
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
