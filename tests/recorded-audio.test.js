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

// La lettura dei brani lunghi deve essere spezzata: su Android Web Speech può
// altrimenti arrestarsi senza consegnare l'evento onend.
assert.match(app, /const MAX_TTS_CHARS = 145/);
assert.match(app, /speechChunkEnd\(completeText, textOffset\)/);
assert.match(app, /speakPart\(partIndex, chunkEnd\)/);
assert.match(app, /audio\.onended = finishClip/);
assert.match(app, /audio\.duration - 0\.08/);
assert.match(app, /audio\.play\(\)\.catch\(fallbackToSynthesis\)/);

console.log("Recorded audio contract passed");
