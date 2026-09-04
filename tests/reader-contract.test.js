"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "rosario.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const gripWindow = fs.readFileSync(path.join(root, "grip-window.js"), "utf8");
const gripStyles = fs.readFileSync(path.join(root, "grip-window.css"), "utf8");

for (const mode of ["automatic", "guided", "silent"]) {
  assert.match(html, new RegExp(`data-interaction-mode="${mode}"`));
}

assert.match(app, /function advanceFromGrip\(\{ animateRail = true \} = \{\}\)/);
assert.match(app, /goToStep\(state\.currentIndex \+ 1/);
assert.doesNotMatch(app, /function jumpToBead/);
assert.doesNotMatch(app, /selectCenteredBead/);
assert.match(styles, /\.bead-stage\.is-gripping/);
assert.match(styles, /touch-action: none/);
assert.match(html, /class="bead-stage grip-window"/);
assert.doesNotMatch(app, /className = "bead-code"/);
assert.match(app, /if \(step\.displayText\)/);
assert.match(app, /if \(step\.largeBeadCard\)/);
assert.match(app, /large-bead-card__reading/);
assert.doesNotMatch(html, /id="progressLabel"/);
assert.doesNotMatch(html, /id="modeLabel"/);
assert.doesNotMatch(html, /id="durationEstimate"/);
assert.match(app, /large-bead-card__title/);
assert.match(app, /Segno della Croce\.\.\./);
assert.match(app, /let speechCheckpoint = null/);
assert.match(app, /utterance\.onboundary/);
assert.match(app, /resumeCheckpoint: checkpoint/);
assert.doesNotMatch(app, /speechSynthesis\.pause\(\)/);
assert.match(styles, /clamp\(9\.35rem, 16vw, 12rem\)/);
assert.match(styles, /clamp\(5\.8rem, 22\.67vw, 7\.33rem\)/);
assert.match(styles, /\.prayer-panel\s*\{[\s\S]*?overflow:\s*visible/);
assert.ok(
  html.indexOf('class="player-rate-control"') > html.indexOf('id="playPauseButton"'),
  "Il controllo velocita deve trovarsi a destra del tasto di riproduzione",
);
assert.doesNotMatch(gripWindow, /classList\.add\([^)]*grip-window/);
assert.match(app, /requestAnimationFrame/);
assert.match(app, /getPropertyValue\("--thumb-position"\)/);
assert.match(app, /advanceFromGrip\(\{ animateRail: false \}\)/);
assert.match(app, /classList\.add\("is-snapping"\)/);
assert.match(gripStyles, /\.rosary-strand\.is-snapping \.bead-row/);
assert.doesNotMatch(gripStyles, /\.bead-row[^}]*visibility:\s*hidden/s);
assert.doesNotMatch(gripStyles, /\.bead-row[^}]*opacity:\s*0(?:;|\s)/s);

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, "Gli id del lettore devono essere univoci");

const selectors = [...app.matchAll(/querySelector\("#([A-Za-z0-9_-]+)"\)/g)].map((match) => match[1]);
selectors.forEach((id) => {
  assert.ok(ids.includes(id), `Il selettore #${id} deve esistere nel lettore`);
});

console.log("Reader interaction contract passed");
