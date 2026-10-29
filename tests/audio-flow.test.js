"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const data = require("../rosary-data.js");
const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extract(start, end) {
  const first = app.indexOf(start);
  const last = app.indexOf(end, first);
  assert.ok(first >= 0 && last > first, "Sezione audio non trovata: " + start);
  return app.slice(first, last);
}

const speechHelpers = extract("function speechChunkEnd(", "function readSavedState()");
const recordedHelpers = extract("function getSpeechParts(", "function renderPrayerText(");
const playback = extract("function stopSpeech(", "function updatePlayerUi()");

function runScenario(mode, { missingEnded = false, ttsStallsOnce = false } = {}) {
  const model = data.buildRosary({ setChoice: "joyful", full: true });
  const runtime = [
    '"use strict";',
    'let tasks = [], nextId = 0, now = 0, canceled = new Set();',
    'let chunks = [], audioRates = [], ttsFailed = false;',
    'const timers = {',
    ' setTimeout(fn, ms) { const id = ++nextId; tasks.push({id, fn, at: now + ms}); return id; },',
    ' clearTimeout(id) { canceled.add(id); }',
    '};',
    'let speechStatus = "idle", activeSpeechRun = 0, activeUtterance = null;',
    'let activeRecordedAudio = null, continuationTimer = null, recordedWatchdog = null, ttsWatchdog = null;',
    'let speechCheckpoint = null, guidedStepHeardId = null;',
    'const MAX_TTS_CHARS = 145, supportsRecordedAudio = true;',
    'const RECORDED_PRAYERS = ["creed", "ourFather", "hailMary", "glory", "fatima"]',
    ' .map(key => ({ parts: data.prayerParts[key], src: key + ".ogg" }));',
    'class Audio {',
    ' constructor() { this.currentTime = 0; this.duration = 4; this.readyState = 4; this.ended = false; this.paused = true; }',
    ' canPlayType() { return "probably"; }',
    ' play() {',
    '   this.paused = false; audioRates.push(this.playbackRate); this.onplaying?.();',
    '   timers.setTimeout(() => {',
    '     if (this.paused) return;',
    '     this.ended = true; this.currentTime = this.duration;',
    '     if (!missingEnded) this.onended?.();',
    '   }, 200);',
    '   return Promise.resolve();',
    ' }',
    ' pause() { this.paused = true; }',
    ' removeAttribute() {}',
    ' load() {}',
    '}',
    'const recordedPlayer = new Audio();',
    'class SpeechSynthesisUtterance { constructor(text) { this.text = text; } }',
    'const window = {',
    ' setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout,',
    ' speechSynthesis: {',
    '   cancel() {},',
    '   speak(u) {',
    '     chunks.push(u.text); u.onstart?.();',
    '     if (ttsStallsOnce && !ttsFailed) { ttsFailed = true; return; }',
    '     if (u.text.length <= MAX_TTS_CHARS) timers.setTimeout(() => u.onend?.(), 70);',
    '   }',
    ' }',
    '};',
    'const document = { hidden: false };',
    'const state = { currentIndex: 0, interactionMode: mode, rate: "1.5" };',
    'const elements = {',
    ' prayerText: { dataset: {}, removeAttribute() {} },',
    ' prayerScroll: { scrollTo() {} }',
    '};',
    'function updateUi() {}',
    'function updatePlayerUi() {}',
    'function updateSpeechStatus() {}',
    'function getSelectedVoice() { return null; }',
    'function getResponseVoice() { return null; }',
    'function completeRosary() {}',
    'function prepareSpeechText(t) { return String(t).replace(/\\s+/g, " ").trim(); }',
    speechHelpers,
    recordedHelpers,
    playback,
    'speakCurrent({ continueAutomatically: mode === "automatic" });',
    'let cycles = 0;',
    'while (tasks.length && cycles++ < 2000) {',
    ' tasks.sort((a, b) => a.at - b.at);',
    ' const next = tasks.shift();',
    ' if (canceled.has(next.id)) continue;',
    ' now = next.at; next.fn();',
    ' if (state.currentIndex >= 2) break;',
    '}',
    'globalThis.result = {',
    ' step: state.currentIndex, status: speechStatus, heard: guidedStepHeardId,',
    ' chunks, audioRates, cycles, seconds: now / 1000',
    '};',
  ].join("\n");
  const context = vm.createContext({ data, model, mode, missingEnded, ttsStallsOnce });
  vm.runInContext(runtime, context, { timeout: 5000 });
  return context.result;
}

for (const missingEnded of [false, true]) {
  const automatic = runScenario("automatic", { missingEnded });
  assert.ok(automatic.step >= 2, "Auto deve superare il primo mistero e la prima Ave Maria");
  assert.ok(Math.max(...automatic.chunks.map(part => part.length)) <= 145, "Segmenti TTS troppo lunghi");
  assert.ok(automatic.audioRates.every(rate => rate === 1.5), "Velocità audio registrato errata");
  assert.ok(automatic.audioRates.length >= 3, "Non sono stati riprodotti gli audio registrati");

  const guided = runScenario("guided", { missingEnded });
  assert.equal(guided.step, 0, "Audio manuale non deve scorrere automaticamente i grani");
  assert.equal(guided.heard, "joyful-m1", "Audio manuale deve abilitare il primo grano");
}

const recovered = runScenario("automatic", { ttsStallsOnce: true });
assert.ok(recovered.step >= 2, "Un TTS bloccato non deve arrestare Auto definitivamente");
console.log("Audio playback transition tests passed");
