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
assert.match(html, /class="bead-stage grip-window"/);
assert.match(html, /class="rosary-backdrop"/);
assert.match(html, /href="rosary-atmosphere\.css"/);
assert.match(html, /src="rosary-atmosphere\.js"/);

assert.match(css, /--thumb-position:\s*58%/);
assert.match(css, /\.grip-window\s*\{[\s\S]*?background:\s*transparent/);
assert.match(css, /\.grip-window \.strand-caption,[\s\S]*?display:\s*none/);
assert.match(css, /\.bead-row:has\(\+ \.bead-row\.active\)/);
assert.match(css, /\.bead-row\.active \+ \.bead-row \+ \.bead-row/);
assert.doesNotMatch(css, /\.grip-window \.bead-code/);
assert.match(css, /\.bead-row\.active \+ \.bead-row\s*\{\s*opacity:\s*0\.68/);
assert.match(css, /--bead-column:\s*5\.25rem/);
assert.match(css, /legno d'ulivo/);
assert.match(css, /repeating-linear-gradient/);
assert.match(css, /-webkit-mask-image:\s*none/);
assert.doesNotMatch(css, /\.bead-row[^}]*visibility:\s*hidden/s);
assert.doesNotMatch(css, /\.bead-row[^}]*opacity:\s*0(?:;|\s)/s);

assert.match(js, /HAPTIC_THRESHOLD\s*=\s*34/);
assert.match(js, /navigator\.vibrate\(7\)/);
assert.doesNotMatch(js, /classList\.add\([^)]*grip-window/);
assert.doesNotMatch(js, /jumpToBead|scrollTop\s*=/);

assert.match(atmosphereCss, /rosary-backdrop-jolt/);
assert.match(atmosphereCss, /width:\s*min\(72vw, 54rem\)/);
assert.match(atmosphereCss, /width:\s*100vw/);
assert.doesNotMatch(atmosphereCss, /\.grip-window \.bead/);
assert.match(atmosphereJs, /TOTAL_BEADS\s*=\s*61/);
assert.match(atmosphereJs, /MAJOR_BEADS/);
assert.match(atmosphereJs, /MutationObserver/);
assert.match(atmosphereJs, /currentStepCount/);
assert.match(atmosphereJs, /triggerBackdropJolt/);

console.log("Grip window contract passed");
