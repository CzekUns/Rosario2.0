"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "rosario.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

for (const mode of ["automatic", "guided", "silent"]) {
  assert.match(html, new RegExp(`<option value="${mode}">`));
}

assert.match(app, /function advanceFromGrip\(\)/);
assert.match(app, /goToStep\(state\.currentIndex \+ 1/);
assert.doesNotMatch(app, /function jumpToBead/);
assert.doesNotMatch(app, /selectCenteredBead/);
assert.match(styles, /\.bead-stage\.is-gripping/);
assert.match(styles, /touch-action: none/);

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, "Gli id del lettore devono essere univoci");

const selectors = [...app.matchAll(/querySelector\("#([A-Za-z0-9_-]+)"\)/g)].map((match) => match[1]);
selectors.forEach((id) => {
  assert.ok(ids.includes(id), `Il selettore #${id} deve esistere nel lettore`);
});

console.log("Reader interaction contract passed");
