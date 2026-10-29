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
assert.match(js, /function beginTwoFingerTransform/);
assert.match(js, /function worldToLocalOnPlane/);
assert.match(js, /new THREE\.Vector3\(ndc\.x,ndc\.y,-1\)\.unproject\(camera\)/);
assert.match(js, /function constrain\(\)/);
assert.match(js, /Math\.min\(1,\(2\*limit\)\/\(box\.maxX-box\.minX\)/);
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
for(const control of ["wood","ivory","onyx"]) {
  assert.match(html,new RegExp('data-material="'+control+'"'));
}
for(const id of ["reset","toggleUi","showUi","selectionLabel"]) {
  assert.ok(html.includes('id="'+id+'"'));
}
assert.doesNotMatch(js,/window\.location\.href\s*=/);
assert.doesNotMatch(js,/fetch\(.+api\//);
console.log("Rosario 3D static contracts passed");
