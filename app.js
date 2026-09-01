"use strict";

const AUTO_VOICE = "__auto__";
const STORAGE_KEY = "rosario2.reader.v2";
const data = window.RosaryData;

const elements = {
  ring: document.querySelector("#rosaryRing"),
  prayerScroll: document.querySelector("#prayerScroll"),
  prayerTitle: document.querySelector("#prayerTitle"),
  prayerText: document.querySelector("#prayerText"),
  prayerAnnouncement: document.querySelector("#prayerAnnouncement"),
  currentStepType: document.querySelector("#currentStepType"),
  currentStepTitle: document.querySelector("#currentStepTitle"),
  currentStepCount: document.querySelector("#currentStepCount"),
  stepCode: document.querySelector("#stepCode"),
  progressBar: document.querySelector("#progressBar"),
  progressFill: document.querySelector("#progressFill"),
  progressLabel: document.querySelector("#progressLabel"),
  playPauseButton: document.querySelector("#playPauseButton"),
  playButtonLabel: document.querySelector("#playButtonLabel"),
  playIcon: document.querySelector(".play-icon"),
  previousButton: document.querySelector("#previousButton"),
  nextButton: document.querySelector("#nextButton"),
  resetButton: document.querySelector("#resetButton"),
  fullRosaryToggle: document.querySelector("#fullRosaryToggle"),
  mysterySetSelect: document.querySelector("#mysterySetSelect"),
  shortMysteryField: document.querySelector("#shortMysteryField"),
  shortMysterySelect: document.querySelector("#shortMysterySelect"),
  voiceSelect: document.querySelector("#voiceSelect"),
  speechRateSelect: document.querySelector("#speechRateSelect"),
  speechSupport: document.querySelector("#speechSupport"),
  intentionInput: document.querySelector("#intentionInput"),
  speakIntentionToggle: document.querySelector("#speakIntentionToggle"),
  modeLabel: document.querySelector("#modeLabel"),
  durationEstimate: document.querySelector("#durationEstimate"),
  setLabel: document.querySelector("#setLabel"),
};

const query = new URLSearchParams(window.location.search);
const savedState = readSavedState();
const shouldRestart = query.get("restart") === "1";
const querySet = data.mysterySets[query.get("set")] ? query.get("set") : query.get("set") === "auto" ? "auto" : null;
const queryMode = ["full", "short"].includes(query.get("mode")) ? query.get("mode") : null;

const state = {
  setChoice: querySet || savedState?.setChoice || "auto",
  full: queryMode ? queryMode === "full" : savedState?.full ?? true,
  shortMysteryIndex: Number(savedState?.shortMysteryIndex) || 0,
  currentIndex: 0,
  voiceName: savedState?.voiceName || AUTO_VOICE,
  rate: String(savedState?.rate || "0.88"),
  completedAt: shouldRestart ? null : savedState?.completedAt || null,
};

let model;
let voices = [];
let bestVoice = null;
let speechStatus = "idle";
let activeSpeechRun = 0;
let activeUtterance = null;
let continuationTimer = null;
let railScrollTimer = null;
let railReleaseTimer = null;
let suppressRailSelection = false;

function readSavedState() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    return parsed?.version === 2 ? parsed : null;
  } catch {
    return null;
  }
}

function saveState() {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        setChoice: state.setChoice,
        resolvedSetId: model.setId,
        full: state.full,
        shortMysteryIndex: state.shortMysteryIndex,
        currentStepId: model.steps[state.currentIndex]?.id || model.steps[0].id,
        currentIndex: state.currentIndex,
        totalSteps: model.steps.length,
        voiceName: state.voiceName,
        rate: state.rate,
        completedAt: state.completedAt,
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // La recita continua anche quando lo spazio locale non è disponibile.
  }
}

function canRestoreProgress() {
  if (shouldRestart || !savedState?.currentStepId) return false;
  if (querySet && querySet !== savedState.setChoice) return false;
  if (queryMode && (queryMode === "full") !== savedState.full) return false;

  const resolvedSetId = data.resolveSetId(state.setChoice);
  return savedState.resolvedSetId === resolvedSetId;
}

function populateMysteryOptions() {
  const resolvedSet = data.mysterySets[data.resolveSetId(state.setChoice)];
  const automaticOption = elements.mysterySetSelect.querySelector('option[value="auto"]');
  automaticOption.textContent = `Automatici: ${data.mysterySets[data.getTodaySetId()].shortLabel} oggi`;

  elements.shortMysterySelect.innerHTML = "";
  resolvedSet.mysteries.forEach((title, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${index + 1}. ${title}`;
    elements.shortMysterySelect.appendChild(option);
  });
  elements.shortMysterySelect.value = String(state.shortMysteryIndex);
}

function rebuildRosary({ keepStepId = null, restoreSaved = false, resetProgress = false } = {}) {
  const previousStepId = resetProgress
    ? null
    : keepStepId || model?.steps[state.currentIndex]?.id || null;
  model = data.buildRosary({
    setChoice: state.setChoice,
    full: state.full,
    shortMysteryIndex: state.shortMysteryIndex,
    intention: elements.intentionInput.value,
    speakIntention: elements.speakIntentionToggle.checked,
  });

  populateMysteryOptions();
  renderBeads();

  const targetStepId = restoreSaved ? savedState?.currentStepId : previousStepId;
  const matchingIndex = targetStepId ? model.steps.findIndex((step) => step.id === targetStepId) : -1;
  state.currentIndex = matchingIndex >= 0 ? matchingIndex : 0;
  state.currentIndex = Math.min(state.currentIndex, model.steps.length - 1);
  updateUi({ syncRail: true });
}

function renderBeads() {
  elements.ring.innerHTML = "";

  model.beads.forEach((bead, beadIndex) => {
    const row = document.createElement("div");
    const code = document.createElement("span");
    const button = document.createElement("button");

    row.className = "bead-row";
    row.dataset.beadIndex = String(beadIndex);
    row.setAttribute("role", "listitem");

    code.className = "bead-code";
    code.textContent = data.getBeadCode(bead);
    code.dataset.defaultCode = code.textContent;

    button.className = `bead${bead.kind === "large" ? " major" : ""}`;
    button.type = "button";
    button.setAttribute("aria-label", data.getBeadLabel(bead));
    button.addEventListener("click", () => jumpToBead(beadIndex));

    row.append(code, button);
    elements.ring.appendChild(row);
  });
}

function getLastStepIndexForBead(beadIndex) {
  for (let index = model.steps.length - 1; index >= 0; index -= 1) {
    if (model.steps[index].beadIndex === beadIndex) return index;
  }
  return -1;
}

function updateUi({ syncRail = false, announce = false } = {}) {
  const step = model.steps[state.currentIndex];
  const progress = model.steps.length <= 1
    ? 0
    : Math.round((state.currentIndex / (model.steps.length - 1)) * 100);

  elements.prayerTitle.textContent = step.title;
  elements.prayerText.textContent = step.text;
  elements.currentStepType.textContent = step.type;
  elements.currentStepTitle.textContent = step.title;
  elements.currentStepCount.textContent = `${step.beadIndex + 1} di ${model.beads.length}`;
  elements.stepCode.textContent = step.code;
  elements.progressFill.style.width = `${progress}%`;
  elements.progressLabel.textContent = `${progress}%`;
  elements.progressBar.setAttribute("aria-valuenow", String(progress));
  elements.modeLabel.textContent = state.full ? "Rosario completo" : "Una decina";
  elements.durationEstimate.textContent = state.full ? "circa 25 minuti" : "circa 8 minuti";
  elements.setLabel.textContent = model.set.label;
  elements.shortMysteryField.hidden = state.full;
  elements.previousButton.disabled = state.currentIndex === 0;
  elements.nextButton.disabled = state.currentIndex === model.steps.length - 1;

  elements.ring.querySelectorAll(".bead-row").forEach((row) => {
    const beadIndex = Number(row.dataset.beadIndex);
    const button = row.querySelector(".bead");
    const code = row.querySelector(".bead-code");
    const isActive = beadIndex === step.beadIndex;
    const isDone = getLastStepIndexForBead(beadIndex) < state.currentIndex;

    row.classList.toggle("active", isActive);
    row.classList.toggle("done", isDone);
    button.setAttribute("aria-current", isActive ? "step" : "false");
    code.textContent = isActive ? step.code : code.dataset.defaultCode;
  });

  if (announce) {
    elements.prayerAnnouncement.textContent = `${step.title}. ${expandCodeForSpeech(step)}`;
  }

  updatePlayerUi();
  updateSpeechStatus();
  saveState();

  if (syncRail) syncRailToBead(step.beadIndex);
}

function syncRailToBead(beadIndex) {
  const row = elements.ring.querySelector(`[data-bead-index="${beadIndex}"]`);
  if (!row) return;

  const nextTop = row.offsetTop - (elements.ring.clientHeight - row.clientHeight) / 2;
  if (Math.abs(elements.ring.scrollTop - nextTop) < 2) return;

  suppressRailSelection = true;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  elements.ring.scrollTo({ top: nextTop, behavior: reduceMotion ? "auto" : "smooth" });
  window.clearTimeout(railReleaseTimer);
  railReleaseTimer = window.setTimeout(() => {
    suppressRailSelection = false;
  }, reduceMotion ? 80 : 520);
}

function selectCenteredBead() {
  if (suppressRailSelection) return;

  const rows = [...elements.ring.querySelectorAll(".bead-row")];
  const railCenter = elements.ring.scrollTop + elements.ring.clientHeight / 2;
  const closest = rows.reduce((best, row) => {
    const center = row.offsetTop + row.clientHeight / 2;
    const distance = Math.abs(center - railCenter);
    return !best || distance < best.distance ? { row, distance } : best;
  }, null);

  if (!closest) return;
  const beadIndex = Number(closest.row.dataset.beadIndex);
  if (model.steps[state.currentIndex].beadIndex !== beadIndex) {
    jumpToBead(beadIndex, { fromRail: true });
  }
}

function jumpToBead(beadIndex, { fromRail = false } = {}) {
  const primaryIndex = model.steps.findIndex(
    (step) => step.beadIndex === beadIndex && step.primaryOnBead,
  );
  const fallbackIndex = model.steps.findIndex((step) => step.beadIndex === beadIndex);
  const targetIndex = primaryIndex >= 0 ? primaryIndex : fallbackIndex;
  if (targetIndex < 0) return;

  goToStep(targetIndex, { announce: true });
  if (fromRail && "vibrate" in navigator) navigator.vibrate(8);
}

function goToStep(index, { announce = false, scrollText = true, stopAudio = true } = {}) {
  if (stopAudio) stopSpeech();
  state.currentIndex = Math.max(0, Math.min(index, model.steps.length - 1));
  if (state.currentIndex < model.steps.length - 1) state.completedAt = null;
  updateUi({ syncRail: true, announce });
  if (scrollText) elements.prayerScroll.scrollTo({ top: 0, behavior: "auto" });
}

function scoreVoice(voice) {
  const name = `${voice.name} ${voice.voiceURI}`.toLowerCase();
  const lang = String(voice.lang || "").toLowerCase();
  let score = lang === "it-it" ? 120 : lang.startsWith("it") ? 95 : 0;

  if (/natural|neural/.test(name)) score += 75;
  if (/enhanced|premium/.test(name)) score += 65;
  if (/google/.test(name)) score += 55;
  if (/microsoft/.test(name)) score += 50;
  if (/alice|isabella|elsa|federica|paola|diego|luca/.test(name)) score += 35;
  if (voice.default) score += 8;
  if (voice.localService) score += 4;
  if (/espeak|compact|festival|mbrola/.test(name)) score -= 120;
  return score;
}

function loadVoices() {
  if (!("speechSynthesis" in window)) {
    elements.voiceSelect.innerHTML = '<option value="__auto__">Audio non disponibile</option>';
    elements.voiceSelect.disabled = true;
    updateSpeechStatus();
    return;
  }

  voices = window.speechSynthesis
    .getVoices()
    .filter((voice) => String(voice.lang || "").toLowerCase().startsWith("it"))
    .sort((first, second) => scoreVoice(second) - scoreVoice(first) || first.name.localeCompare(second.name));
  bestVoice = voices[0] || null;

  elements.voiceSelect.innerHTML = "";
  const automatic = document.createElement("option");
  automatic.value = AUTO_VOICE;
  automatic.textContent = bestVoice ? `Migliore disponibile · ${bestVoice.name}` : "Voce italiana predefinita";
  elements.voiceSelect.appendChild(automatic);

  voices.forEach((voice) => {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = `${voice.name} · ${voice.lang}`;
    elements.voiceSelect.appendChild(option);
  });

  const selectedExists = state.voiceName === AUTO_VOICE || voices.some((voice) => voice.name === state.voiceName);
  if (!selectedExists) state.voiceName = AUTO_VOICE;
  elements.voiceSelect.value = state.voiceName;
  updateSpeechStatus();
}

function getSelectedVoice() {
  if (state.voiceName === AUTO_VOICE) return bestVoice;
  return voices.find((voice) => voice.name === state.voiceName) || bestVoice;
}

function updateSpeechStatus(message = null) {
  if (message) {
    elements.speechSupport.textContent = message;
    return;
  }
  if (!("speechSynthesis" in window)) {
    elements.speechSupport.textContent = "Solo testo";
    return;
  }
  const selectedVoice = getSelectedVoice();
  elements.speechSupport.textContent = selectedVoice ? selectedVoice.name : "Voce italiana automatica";
  elements.speechSupport.title = selectedVoice
    ? `Voce in uso: ${selectedVoice.name}`
    : "Il dispositivo sceglierà una voce italiana";
}

function expandCodeForSpeech(step) {
  if (!step.mysteryNumber) return step.title;
  if (step.repetition) {
    return `Mistero ${step.mysteryNumber}, Ave Maria ${step.repetition} di 10`;
  }
  return `Mistero ${step.mysteryNumber}`;
}

function prepareSpeechText(step) {
  const ordinals = { "1º": "primo", "2º": "secondo", "3º": "terzo", "4º": "quarto", "5º": "quinto" };
  return Object.entries(ordinals).reduce(
    (text, [number, word]) => text.replaceAll(number, word),
    step.text.replace(/\s+/g, " ").trim(),
  );
}

function stopSpeech() {
  activeSpeechRun += 1;
  window.clearTimeout(continuationTimer);
  continuationTimer = null;
  activeUtterance = null;
  speechStatus = "idle";
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  updatePlayerUi();
}

function pauseSpeech() {
  if (!("speechSynthesis" in window) || speechStatus !== "speaking") return;
  window.speechSynthesis.pause();
  speechStatus = "paused";
  updatePlayerUi();
}

function resumeSpeech() {
  if (!("speechSynthesis" in window) || speechStatus !== "paused") return;
  window.speechSynthesis.resume();
  speechStatus = "speaking";
  updatePlayerUi();
}

function speakCurrent({ continueAutomatically = true } = {}) {
  if (!("speechSynthesis" in window)) {
    updateSpeechStatus("Audio non disponibile");
    return;
  }

  stopSpeech();
  const runId = activeSpeechRun;
  const step = model.steps[state.currentIndex];
  const utterance = new SpeechSynthesisUtterance(prepareSpeechText(step));
  const selectedVoice = getSelectedVoice();

  utterance.lang = "it-IT";
  utterance.rate = Number(state.rate) || 0.88;
  utterance.pitch = 1;
  utterance.volume = 1;
  if (selectedVoice) utterance.voice = selectedVoice;

  activeUtterance = utterance;
  utterance.onstart = () => {
    if (runId !== activeSpeechRun) return;
    speechStatus = "speaking";
    updatePlayerUi();
  };

  utterance.onend = () => {
    if (runId !== activeSpeechRun) return;
    activeUtterance = null;
    speechStatus = "idle";

    if (!continueAutomatically) {
      updatePlayerUi();
      return;
    }

    if (state.currentIndex >= model.steps.length - 1) {
      state.completedAt = new Date().toISOString();
      saveState();
      updatePlayerUi();
      updateSpeechStatus("Rosario completato");
      return;
    }

    const nextStep = model.steps[state.currentIndex + 1];
    const pauseDuration = nextStep.type === "Mistero" || nextStep.type === "Conclusione" ? 900 : 520;
    continuationTimer = window.setTimeout(() => {
      if (runId !== activeSpeechRun) return;
      state.currentIndex += 1;
      updateUi({ syncRail: true, announce: true });
      elements.prayerScroll.scrollTo({ top: 0, behavior: "auto" });
      speakCurrent({ continueAutomatically: true });
    }, pauseDuration);
  };

  utterance.onerror = (event) => {
    if (runId !== activeSpeechRun || ["canceled", "interrupted"].includes(event.error)) return;
    activeUtterance = null;
    speechStatus = "idle";
    updatePlayerUi();
    updateSpeechStatus("Tocca Ascolta per riprovare");
  };

  window.speechSynthesis.speak(utterance);
}

function toggleSpeech() {
  if (speechStatus === "speaking") {
    pauseSpeech();
    return;
  }
  if (speechStatus === "paused") {
    resumeSpeech();
    return;
  }
  if (state.currentIndex === model.steps.length - 1 && state.completedAt) {
    state.currentIndex = 0;
    state.completedAt = null;
    updateUi({ syncRail: true, announce: true });
  }
  speakCurrent({ continueAutomatically: true });
}

function updatePlayerUi() {
  const isSpeaking = speechStatus === "speaking";
  const isPaused = speechStatus === "paused";
  const isCompleted = Boolean(state.completedAt) && state.currentIndex === model.steps.length - 1;

  elements.playIcon.textContent = isSpeaking ? "Ⅱ" : "▶";
  elements.playButtonLabel.textContent = isSpeaking
    ? "Pausa"
    : isPaused
      ? "Riprendi"
      : isCompleted
        ? "Ricomincia"
        : "Ascolta";
  elements.playPauseButton.setAttribute(
    "aria-label",
    isSpeaking ? "Metti in pausa" : isPaused ? "Riprendi la voce" : "Ascolta la preghiera",
  );
  elements.playPauseButton.classList.toggle("is-playing", isSpeaking);
}

function changeRosaryConfiguration(change) {
  stopSpeech();
  change();
  state.completedAt = null;
  rebuildRosary({ resetProgress: true });
}

elements.playPauseButton.addEventListener("click", toggleSpeech);
elements.previousButton.addEventListener("click", () => goToStep(state.currentIndex - 1, { announce: true }));
elements.nextButton.addEventListener("click", () => goToStep(state.currentIndex + 1, { announce: true }));

elements.resetButton.addEventListener("click", () => {
  if (state.currentIndex > 0 && !window.confirm("Vuoi ricominciare il Rosario dall’inizio?")) return;
  stopSpeech();
  state.currentIndex = 0;
  state.completedAt = null;
  updateUi({ syncRail: true, announce: true });
  elements.prayerScroll.scrollTo({ top: 0, behavior: "auto" });
});

elements.fullRosaryToggle.addEventListener("change", () => {
  changeRosaryConfiguration(() => {
    state.full = elements.fullRosaryToggle.checked;
  });
});

elements.mysterySetSelect.addEventListener("change", () => {
  changeRosaryConfiguration(() => {
    state.setChoice = elements.mysterySetSelect.value;
    state.shortMysteryIndex = 0;
  });
});

elements.shortMysterySelect.addEventListener("change", () => {
  changeRosaryConfiguration(() => {
    state.shortMysteryIndex = Number(elements.shortMysterySelect.value) || 0;
  });
});

elements.voiceSelect.addEventListener("change", () => {
  stopSpeech();
  state.voiceName = elements.voiceSelect.value;
  updateSpeechStatus();
  saveState();
});

elements.speechRateSelect.addEventListener("change", () => {
  stopSpeech();
  state.rate = elements.speechRateSelect.value;
  saveState();
});

elements.intentionInput.addEventListener("input", () => {
  elements.speakIntentionToggle.disabled = !elements.intentionInput.value.trim();
  if (!elements.intentionInput.value.trim() && elements.speakIntentionToggle.checked) {
    elements.speakIntentionToggle.checked = false;
    rebuildRosary({ keepStepId: model.steps[state.currentIndex].id });
  }
});

elements.intentionInput.addEventListener("change", () => {
  if (elements.speakIntentionToggle.checked) {
    rebuildRosary({ keepStepId: model.steps[state.currentIndex].id });
  }
});

elements.speakIntentionToggle.addEventListener("change", () => {
  stopSpeech();
  rebuildRosary({ keepStepId: model.steps[state.currentIndex].id });
});

elements.ring.addEventListener("pointerdown", () => {
  window.clearTimeout(railReleaseTimer);
  suppressRailSelection = false;
});

elements.ring.addEventListener(
  "scroll",
  () => {
    if (suppressRailSelection) return;
    window.clearTimeout(railScrollTimer);
    railScrollTimer = window.setTimeout(selectCenteredBead, 120);
  },
  { passive: true },
);

elements.ring.addEventListener("keydown", (event) => {
  if (!["ArrowUp", "ArrowDown"].includes(event.key)) return;
  event.preventDefault();
  const direction = event.key === "ArrowDown" ? 1 : -1;
  const currentBeadIndex = model.steps[state.currentIndex].beadIndex;
  const targetIndex = Math.max(0, Math.min(currentBeadIndex + direction, model.beads.length - 1));
  jumpToBead(targetIndex);
});

window.addEventListener("resize", () => syncRailToBead(model.steps[state.currentIndex].beadIndex));
window.addEventListener("pagehide", () => {
  saveState();
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
});

elements.fullRosaryToggle.checked = state.full;
elements.mysterySetSelect.value = state.setChoice;
elements.speechRateSelect.value = ["0.82", "0.88", "0.94", "1"].includes(state.rate) ? state.rate : "0.88";
state.rate = elements.speechRateSelect.value;
elements.speakIntentionToggle.disabled = true;

const restoreProgress = canRestoreProgress();
if (!restoreProgress) state.completedAt = null;
rebuildRosary({ restoreSaved: restoreProgress });
loadVoices();

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
}
