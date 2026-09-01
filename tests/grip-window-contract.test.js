"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "rosario.html"), "utf8");
const css = fs.readFileSync(path.join(root, "grip-window.css"), "utf8");
const js = fs.readFileSync(path.join(root, "grip-window.js"), "utf8");
const atmosphereCss = fs.readFileSync(path.join(root, "rosary-atmosphere.css"), "utf8");
const atmosphereJs = fs.readFileSync(path.join(root, "rosary-atmosphere.js"), "utf8");

assert.match(html, /href="grip-window\.css"/);
assert.match(html, /src="grip-window\.js"/);
assert.match(html, /Finestra di presa del Rosario/);
assert.match(html, /class="rosary-backdrop"/);
assert.match(html, /href="rosary-atmosphere\.css"/);
assert.match(html, /src="rosary-atmosphere\.js"/);

assert.match(css, /--thumb-anchor/);
assert.match(css, /\.bead-row:has\(\+ \.bead-row\.active\)/);
assert.match(css, /\.bead-row\.active \+ \.bead-row \+ \.bead-row/);
assert.match(css, /\.grip-window \.bead-code\s*\{[\s\S]*?opacity:\s*0/);
assert.match(css, /legno d'ulivo/);

assert.match(js, /HAPTIC_THRESHOLD\s*=\s*34/);
assert.match(js, /navigator\.vibrate\(7\)/);
assert.doesNotMatch(js, /jumpToBead|scrollTop\s*=/);

assert.match(atmosphereCss, /\.grip-window \.bead-row\.done/);
assert.match(atmosphereCss, /\.grip-window \.bead\.major::before\s*\{[\s\S]*?width:\s*3\.2rem/);
assert.match(atmosphereCss, /rosary-backdrop-jolt/);
assert.match(atmosphereJs, /TOTAL_BEADS\s*=\s*61/);
assert.match(atmosphereJs, /MAJOR_BEADS/);
assert.match(atmosphereJs, /MutationObserver/);
assert.match(atmosphereJs, /currentStepCount/);
assert.match(atmosphereJs, /triggerBackdropJolt/);

console.log("Grip window contract passed");
