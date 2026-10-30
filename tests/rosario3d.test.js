"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..", "rosario3d");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const js = fs.readFileSync(path.join(root, "app.js"), "utf8");

assert.match(html, /id="stage"/);
assert.match(html, /src="\.\/app.js"/);
assert.match(js, /three@0\.186\.1\/build\/three\.module\.js/);
assert.match(css, /touch-action:\s*none/);
assert.match(js, /function handlePointerDown/);
assert.match(js, /function handlePointerMove/);
assert.match(js, /function handlePointerUp/);
assert.match(js, /const touches = new Map\(\)/);
assert.match(js, /const GRIP_BEADS = 5/);
assert.match(js, /const GRAVITY = \.0019/);
assert.match(js, /function moveGripByPixels/);
assert.match(js, /function shiftGrip/);
assert.match(js, /function guideTarget/);
assert.match(js, /function leftGuideIndex/);
assert.match(js, /function leftGuideTarget/);
assert.match(js, /const LEFT_GUIDE_STRENGTH = \.09/);
assert.match(js, /const ARC_RISE = \.77/);
assert.match(js, /function topArcIndices/);
assert.match(js, /ringArcPath\(from,count\)/);
assert.match(js, /chooseArchSteps/);
assert.match(js, /archPoint/);
assert.match(js, /function updateUpperArc/);
assert.match(js, /const nearFinger=touches\.size/);
assert.match(js, /n\.old\.lerp\(n\.p,\.24\)/);
assert.match(js, /upperArcTargets\[k\]/);
assert.match(js, /const fade=Math\.sin\(Math\.PI\*t\)/);
assert.match(js, /secondary\.p\.lerp\(leftGuideTarget\(\)/);
assert.match(js, /secondaryIndex\?\.38:1/);
assert.match(js, /function updateGripTargets/);
assert.match(js, /function worldToLocalOnPlane/);
assert.match(js, /\(x-bounds\.left-bounds\.width\/2\)\/CSS_PX_PER_WORLD/);
assert.match(js, /function constrain\(\)/);
assert.match(js, /n\.p\.y-=GRAVITY/);
assert.match(js, /left\+r,right-r/);
assert.match(js, /n\.p\.lerp\(guideTarget\(slot\)/);
assert.match(js, /viewHeight=h\/CSS_PX_PER_WORLD/);
assert.doesNotMatch(js, /rosary\.scale\.multiplyScalar/);
assert.doesNotMatch(js, /Math\.hypot\(ddx,ddy\)/);
assert.match(js, /function physics\(\)/);
assert.match(js, /function setSelected/);
assert.match(js, /selectedHalo/);
assert.match(js, /textureOf\("wood"\)/);
assert.match(js, /textureOf\("ivory"\)/);
assert.match(js, /textureOf\("onyx"\)/);
assert.match(js, /let previous=medal/);
assert.match(js, /for\(let i=1;i<=54;i\+\+\)/);
assert.match(js, /const ys=\[-1\.18,-1\.50,-1\.80,-2\.10,-2\.46\]/);
assert.match(js, /n\.kind==="small"\)\.length!==53/);
assert.match(js, /n\.kind==="large"\)\.length!==6/);
assert.match(js, /connect\(previous,cross\)/);
assert.match(js, /navigator\.vibrate/);
assert.match(html, /id="gripFrame"/);
assert.match(html, /id="guidePointLeft"/);
assert.match(css, /\.left-guide\s*\{/);
assert.match(css, /\.left-guide__point\s*\{/);
assert.match(html, /id="gripCount"/);
assert.match(html, /5 GRANI/);
assert.match(css, /\.grip-frame\{/);
assert.doesNotMatch(html, /ruota · ingrandisci/);
assert.match(js, /function updateLinks/);
for(const control of ["wood","ivory","onyx"]) {
  assert.match(html,new RegExp('data-material="'+control+'"'));
}
for(const id of ["reset","toggleUi","showUi","selectionLabel"]) {
  assert.ok(html.includes('id="'+id+'"'));
}
assert.doesNotMatch(js,/window\.location\.href\s*=/);
assert.doesNotMatch(js,/fetch\(.+api\//);
console.log("Rosario 3D static contracts passed");

(async function verifyArcGeometry() {
  const {pathToFileURL}=require("node:url");
  const arc=await import(pathToFileURL(path.join(root,"arc-math.mjs")).href);
  assert.deepEqual(arc.ringArcPath(12,10),[12,13,14,15,16,17,18,19,20,21,22]);
  assert.deepEqual(arc.ringArcPath(50,8),[50,51,52,53,54,0,1,2,3]);
  assert.deepEqual(arc.ringArcPath(54,1),[54,0,1]);
  assert.equal(arc.archPoint({x:1,y:0},{x:-1,y:0},.7,0).x,1);
  assert.equal(arc.archPoint({x:1,y:0},{x:-1,y:0},.7,1).x,-1);
  assert.ok(Math.abs(arc.archPoint({x:1,y:0},{x:-1,y:0},.7,.5).y-.7)<1e-10);
  // Arc must fit its bead count on a range of typical phone screen widths.
  for(const width of [320,360,390,430]) {
    const start={x:(width-58-width/2)/202,y:.43};
    const end={x:(38-width/2)/202,y:0};
    const count=arc.chooseArchSteps(start,end,.77,.215);
    assert.ok(count>=6 && count<=17,"Invalid bead count on width "+width);
    assert.ok(Math.abs(count*.215-arc.archLength(start,end,.77))<=.11,
      "Rope excessively compressed on width "+width);
  }
  console.log("Rosario 3D arc geometry tests passed");
})().catch(err=>{console.error(err);process.exitCode=1;});
