"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const data = require("../rosary-data.js");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const clips = ["credo", "padre-nostro", "ave-maria", "gloria", "fine-mistero"];

clips.forEach((name) => {
  const file = path.join(root, "assets", "audio", name + ".ogg");
  const audio = fs.readFileSync(file);
  assert.equal(audio.subarray(0, 4).toString("ascii"), "OggS", name + " deve essere Ogg");
  assert.ok(audio.subarray(0, 128).includes(Buffer.from("OpusHead")), name + " deve essere Opus");
  assert.ok(app.includes(name + ".ogg"), name + " deve essere selezionabile nel player");
  assert.ok(worker.includes("assets/audio/" + name + ".ogg"), name + " deve essere in cache offline");
});

const full = data.buildRosary({ setChoice: "joyful", full: true });
assert.ok(full.steps[0].speechParts.some((part) => part.text === data.prayers.creed));
assert.equal(full.steps.filter((step) => step.repetition === 10 && step.endOfMystery).length, 5);
console.log("Recorded audio contract passed");
