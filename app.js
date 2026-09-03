"use strict";

const AUTO_VOICE = "__auto__";
const STORAGE_KEY = "rosario2.reader.v2";
const INTERACTION_MODES = ["automatic", "guided", "silent"];
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
  interactionModeButtons: document.querySelectorAll("[data-interaction-mode]"),
  interactionHint: document.querySelector("#interactionHint"),
  gripInstruction: document.querySelector("#gripInstruction"),
  beadStage: document.querySelector(".bead-stage"),
  audioSettings: document.querySelectorAll("[data-audio-setting]"),
  resetButton: document.querySelector("#resetButton"),
  fullRosaryToggle: document.querySelector("#fullRosaryToggle"),
  mysterySetSelect: document.querySelector("#mysterySetSelect"),
  shortMysteryField: document.querySelector("#shortMysteryField"),
  shortMysterySelect: document.querySelector("#shortMysterySelect"),
  voiceSelect: document.querySelector("#voiceSelect"),
  speechRateButtons: document.querySelectorAll("[data-speech-rate]"),
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
const queryInteractionMode = INTERACTION_MODES.includes(query.get("use"))
  ? query.get("use")
  : null;
const savedInteractionMode = INTERACTION_MODES.includes(savedState?.interactionMode)
  ? savedState.interactionMode
  : "automatic";

const state = {
  setChoice: querySet || savedState?.setChoice || "auto",
  full: queryMode ? queryMode === "full" : savedState?.full ?? true,
  shortMysteryIndex: Number(savedState?.shortMysteryIndex) || 0,
  currentIndex: 0,
  voiceName: savedState?.voiceName || AUTO_VOICE,
  rate: ["1.2", "1.5", "1.7"].includes(String(savedState?.rate)) ? String(savedState.rate) : "1.2",
  interactionMode: queryInteractionMode || savedInteractionMode,
  completedAt: shouldRestart ? null : savedState?.completedAt || null,
};

let model;
let voices = [];
let bestVoice = null;
let responseVoice = null;
let speechStatus = "idle";
let activeSpeechRun = 0;
let activeUtterance = null;
let continuationTimer = null;
let gripGesture = null;
let settleTimer = null;
let guidedStepHeardId = null;
let railSyncFrame = null;
let railHasAligned = false;

const GRIP_THRESHOLD = 34;

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
        interactionMode: state.interactionMode,
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
  if (railSyncFrame !== null) window.cancelAnimationFrame(railSyncFrame);
  railSyncFrame = null;
  railHasAligned = false;
  elements.ring.innerHTML = "";
  elements.ring.scrollTo({ top: 0, behavior: "auto" });

  const startSpacer = document.createElement("span");
  startSpacer.className = "strand-spacer";
  startSpacer.setAttribute("aria-hidden", "true");
  elements.ring.appendChild(startSpacer);

  model.beads.forEach((bead, beadIndex) => {
    const row = document.createElement("div");
    const beadShape = document.createElement("span");

    row.className = "bead-row";
    row.dataset.beadIndex = String(beadIndex);
    row.setAttribute("aria-hidden", "true");

    beadShape.className = `bead${bead.kind === "large" ? " major" : ""}`;
    beadShape.setAttribute("aria-hidden", "true");

    row.append(beadShape);
    elements.ring.appendChild(row);
  });

  const endSpacer = document.createElement("span");
  endSpacer.className = "strand-spacer";
  endSpacer.setAttribute("aria-hidden", "true");
  elements.ring.appendChild(endSpacer);
}

function getLastStepIndexForBead(beadIndex) {
  for (let index = model.steps.length - 1; index >= 0; index -= 1) {
    if (model.steps[index].beadIndex === beadIndex) return index;
  }
  return -1;
}

function updateUi({ syncRail = false, announce = false, animateRail = true } = {}) {
  const step = model.steps[state.currentIndex];
  const progress = model.steps.length <= 1
    ? 0
    : Math.round((state.currentIndex / (model.steps.length - 1)) * 100);

  elements.prayerTitle.textContent = step.title;
  renderPrayerText(step);
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

  elements.ring.querySelectorAll(".bead-row").forEach((row) => {
    const beadIndex = Number(row.dataset.beadIndex);
    const isActive = beadIndex === step.beadIndex;
    const isDone = getLastStepIndexForBead(beadIndex) < state.currentIndex;

    row.classList.toggle("active", isActive);
    row.classList.toggle("done", isDone);
    row.setAttribute("aria-hidden", isActive ? "false" : "true");
  });

  if (announce) {
    elements.prayerAnnouncement.textContent = `${step.title}. ${expandCodeForSpeech(step)}`;
  }

  updatePlayerUi();
  updateSpeechStatus();
  saveState();

  if (syncRail) syncRailToBead(step.beadIndex, { animate: animateRail });
}

function syncRailToBead(beadIndex, { animate = true } = {}) {
  if (railSyncFrame !== null) window.cancelAnimationFrame(railSyncFrame);

  const alignRail = () => {
    railSyncFrame = null;
    const row = elements.ring.querySelector(`[data-bead-index="${beadIndex}"]`);
    if (!row || elements.ring.clientHeight <= 0) return;

    const cssThumbPosition = window
      .getComputedStyle(elements.beadStage)
      .getPropertyValue("--thumb-position")
      .trim();
    const parsedThumbPosition = Number.parseFloat(cssThumbPosition);
    const thumbRatio = cssThumbPosition.endsWith("%") && Number.isFinite(parsedThumbPosition)
      ? Math.min(0.75, Math.max(0.35, parsedThumbPosition / 100))
      : 0.58;
    const rowCenter = row.offsetTop + row.clientHeight / 2;
    const unclampedTop = rowCenter - elements.ring.clientHeight * thumbRatio;
    const maximumTop = Math.max(0, elements.ring.scrollHeight - elements.ring.clientHeight);
    const nextTop = Math.min(maximumTop, Math.max(0, unclampedTop));

    if (Math.abs(elements.ring.scrollTop - nextTop) < 1) {
      railHasAligned = true;
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    elements.ring.scrollTo({
      top: nextTop,
      behavior: animate && railHasAligned && !reduceMotion ? "smooth" : "auto",
    });
    railHasAligned = true;
  };

  if (animate) {
    railSyncFrame = window.requestAnimationFrame(alignRail);
  } else {
    alignRail();
  }
}

function goToStep(
  index,
  { announce = false, scrollText = true, stopAudio = true, animateRail = true } = {},
) {
  if (stopAudio) stopSpeech();
  state.currentIndex = Math.max(0, Math.min(index, model.steps.length - 1));
  if (guidedStepHeardId !== model.steps[state.currentIndex].id) guidedStepHeardId = null;
  if (state.currentIndex < model.steps.length - 1) state.completedAt = null;
  updateUi({ syncRail: true, announce, animateRail });
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
    elements.interactionModeButtons.forEach((button) => {
      button.disabled = button.dataset.interactionMode !== "silent";
    });
    state.interactionMode = "silent";
    updateUi();
    updateSpeechStatus("Audio non disponibile · modalità silenziosa");
    return;
  }

  voices = window.speechSynthesis
    .getVoices()
    .filter((voice) => String(voice.lang || "").toLowerCase().startsWith("it"))
    .sort((first, second) => scoreVoice(second) - scoreVoice(first) || first.name.localeCompare(second.name));
  bestVoice = voices[0] || null;
  responseVoice = voices.find((voice) => voice.name !== bestVoice?.name) || bestVoice;

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

function getResponseVoice() {
  const guideVoice = getSelectedVoice();
  return voices.find((voice) => voice.name !== guideVoice?.name)
    || responseVoice
    || guideVoice;
}

function updateSpeechStatus(message = null) {
  if (message) {
    elements.speechSupport.textContent = message;
    return;
  }
  if (state.interactionMode === "silent") {
    elements.speechSupport.textContent = "Senza audio";
    elements.speechSupport.title = "Recita silenziosa con avanzamento manuale";
    return;
  }
  if (!("speechSynthesis" in window)) {
    elements.speechSupport.textContent = "Solo testo";
    return;
  }
  const selectedVoice = getSelectedVoice();
  const modePrefix = state.interactionMode === "automatic" ? "Automatico" : "Gestito da te";
  const replyVoice = getResponseVoice();
  elements.speechSupport.textContent = selectedVoice
    ? `${modePrefix} · guida e risposta`
    : `${modePrefix} · voci italiane`;
  elements.speechSupport.title = selectedVoice
    ? `Guida: ${selectedVoice.name}. Risposta: ${replyVoice?.name || selectedVoice.name}`
    : "Il dispositivo sceglierà le voci italiane disponibili";
}

function expandCodeForSpeech(step) {
  if (!step.mysteryNumber) return step.title;
  if (step.repetition) {
    return `Mistero ${step.mysteryNumber}, Ave Maria ${step.repetition} di 10`;
  }
  return `Mistero ${step.mysteryNumber}`;
}

function prepareSpeechText(text) {
  const ordinals = { "1º": "primo", "2º": "secondo", "3º": "terzo", "4º": "quarto", "5º": "quinto" };
  return Object.entries(ordinals).reduce(
    (prepared, [number, word]) => prepared.replaceAll(number, word),
    String(text || "").replace(/\s+/g, " ").trim(),
  );
}

function getSpeechParts(step) {
  return Array.isArray(step.speechParts) && step.speechParts.length
    ? step.speechParts
    : [{ speaker: "leader", text: step.text }];
}

function renderPrayerText(step) {
  const parts = getSpeechParts(step);
  elements.prayerText.replaceChildren();

  parts.forEach((part) => {
    const segment = document.createElement("span");
    segment.className = `prayer-part prayer-part--${part.speaker}`;
    const label = document.createElement("small");
    label.textContent = part.speaker === "assembly" ? "Tutti" : "Guida";
    const text = document.createElement("span");
    text.textContent = part.text;
    segment.append(label, text);
    elements.prayerText.appendChild(segment);
  });
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
  const parts = getSpeechParts(step);

  function finishStep() {
    activeUtterance = null;
    speechStatus = "idle";
    elements.prayerText.removeAttribute("data-speaker");

    if (state.currentIndex >= model.steps.length - 1) {
      completeRosary();
      return;
    }
    if (!continueAutomatically) {
      guidedStepHeardId = step.id;
      updatePlayerUi();
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
  }

  function speakPart(partIndex) {
    if (runId !== activeSpeechRun) return;
    const part = parts[partIndex];
    if (!part) {
      finishStep();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(prepareSpeechText(part.text));
    const isAssembly = part.speaker === "assembly";
    const guideVoice = getSelectedVoice();
    const selectedVoice = isAssembly ? getResponseVoice() : guideVoice;

    utterance.lang = "it-IT";
    utterance.rate = Number(state.rate) || 1.2;
    utterance.pitch = isAssembly && selectedVoice === guideVoice ? 0.9 : 1;
    utterance.volume = 1;
    if (selectedVoice) utterance.voice = selectedVoice;

    activeUtterance = utterance;
    utterance.onstart = () => {
      if (runId !== activeSpeechRun) return;
      speechStatus = "speaking";
      updatePlayerUi();
      elements.prayerText.dataset.speaker = part.speaker;
    };
    utterance.onend = () => {
      if (runId !== activeSpeechRun) return;
      activeUtterance = null;
      elements.prayerText.removeAttribute("data-speaker");
      continuationTimer = window.setTimeout(() => speakPart(partIndex + 1), isAssembly ? 110 : 230);
    };
    utterance.onerror = (event) => {
      if (runId !== activeSpeechRun || ["canceled", "interrupted"].includes(event.error)) return;
      activeUtterance = null;
      elements.prayerText.removeAttribute("data-speaker");
      speechStatus = "idle";
      updatePlayerUi();
      updateSpeechStatus("Tocca Ascolta per riprovare");
    };

    window.speechSynthesis.speak(utterance);
  }

  speakPart(0);
}

function toggleSpeech() {
  if (state.currentIndex === model.steps.length - 1 && state.completedAt) {
    state.currentIndex = 0;
    state.completedAt = null;
    updateUi({ syncRail: true, announce: true });
    if (state.interactionMode === "silent") return;
  }
  if (state.interactionMode === "silent") return;
  if (speechStatus === "speaking") {
    pauseSpeech();
    return;
  }
  if (speechStatus === "paused") {
    resumeSpeech();
    return;
  }
  speakCurrent({ continueAutomatically: state.interactionMode === "automatic" });
}

function updatePlayerUi() {
  elements.interactionModeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.interactionMode === state.interactionMode));
  });

  const isSpeaking = speechStatus === "speaking";
  const isPaused = speechStatus === "paused";
  const isCompleted = Boolean(state.completedAt) && state.currentIndex === model.steps.length - 1;
  const isAutomatic = state.interactionMode === "automatic";
  const isSilent = state.interactionMode === "silent";
  const guidedCanAdvance =
    state.interactionMode === "guided"
    && guidedStepHeardId === model.steps[state.currentIndex].id;

  elements.playIcon.textContent = isSpeaking ? "Ⅱ" : isCompleted ? "↻" : "▶";
  elements.playButtonLabel.textContent = isSpeaking
    ? "Pausa"
    : isPaused
      ? "Riprendi"
      : isCompleted
        ? "Ricomincia"
        : isAutomatic
          ? "Avvia"
          : "Ascolta";
  elements.playPauseButton.setAttribute(
    "aria-label",
    isSpeaking
      ? "Metti in pausa"
      : isPaused
        ? "Riprendi la voce"
        : isCompleted
          ? "Ricomincia il Rosario"
          : isAutomatic
            ? "Avvia la recita automatica"
            : "Ascolta la preghiera",
  );
  elements.playPauseButton.classList.toggle("is-playing", isSpeaking);
  elements.playPauseButton.hidden = isSilent && !isCompleted;
  elements.audioSettings.forEach((field) => {
    field.hidden = isSilent;
  });

  if (isCompleted) {
    elements.interactionHint.textContent = "Rosario completato.";
    elements.gripInstruction.textContent = "Completato";
  } else if (isAutomatic) {
    elements.interactionHint.textContent = isSpeaking
      ? "Voce e corona avanzano da sole."
      : isPaused
        ? "Recita in pausa."
        : "Avvia la voce: la corona seguirà la recita.";
    elements.gripInstruction.textContent = isSpeaking ? "Scorre con la voce" : "Appoggia il pollice";
  } else if (state.interactionMode === "guided") {
    elements.interactionHint.textContent = isSpeaking
      ? "Ascolta; al termine fai scorrere un grano."
      : isPaused
        ? "Recita in pausa."
        : guidedCanAdvance
          ? "Ora trascina il grano verso l’alto."
          : "Tocca Ascolta per recitare questo passaggio.";
    elements.gripInstruction.textContent = isSpeaking
      ? "Ascolta"
      : guidedCanAdvance
        ? "Trascina ↑"
        : "Prima ascolta";
  } else {
    elements.interactionHint.textContent = "Leggi, poi trascina il grano verso l’alto.";
    elements.gripInstruction.textContent = "Trascina ↑";
  }

  const canGrip =
    !isCompleted
    && !isSpeaking
    && !isPaused
    && (isSilent || guidedCanAdvance);
  elements.beadStage.classList.toggle("can-grip", canGrip);
  elements.ring.setAttribute("aria-disabled", String(!canGrip));
  elements.ring.tabIndex = canGrip ? 0 : -1;

  const step = model.steps[state.currentIndex];
  const gripAction = isAutomatic
    ? "La corona avanza insieme alla voce."
    : canGrip
      ? "Trascina il grano verso l’alto per continuare."
      : state.interactionMode === "guided"
        ? "Ascolta il passaggio prima di avanzare."
        : "Rosario completato.";
  elements.ring.setAttribute(
    "aria-label",
    `${data.getBeadLabel(model.beads[step.beadIndex])}. ${step.code}. ${gripAction}`,
  );
}

function completeRosary() {
  state.completedAt = state.completedAt || new Date().toISOString();
  saveState();
  updatePlayerUi();
  updateSpeechStatus("Rosario completato");
  if ("vibrate" in navigator) navigator.vibrate([12, 45, 18]);
}

function advanceFromGrip({ animateRail = true } = {}) {
  const currentStep = model.steps[state.currentIndex];
  const canAdvance =
    state.interactionMode === "silent"
    || (state.interactionMode === "guided" && guidedStepHeardId === currentStep.id);
  if (!canAdvance || speechStatus !== "idle") return;
  if (state.currentIndex >= model.steps.length - 1) {
    completeRosary();
    return;
  }

  goToStep(state.currentIndex + 1, {
    announce: true,
    stopAudio: false,
    animateRail,
  });

  window.clearTimeout(settleTimer);
  elements.beadStage.classList.add("grip-settled");
  settleTimer = window.setTimeout(() => elements.beadStage.classList.remove("grip-settled"), 240);
  if ("vibrate" in navigator) navigator.vibrate(11);

  if (state.interactionMode === "guided") {
    speakCurrent({ continueAutomatically: false });
  }
}

function beginGrip(event) {
  const activeBead = event.target.closest(".bead-row.active .bead");
  if (!activeBead || gripGesture) return;

  gripGesture = {
    pointerId: event.pointerId,
    startY: event.clientY,
    deltaY: 0,
    canAdvance:
      (
        state.interactionMode === "silent"
        || (
          state.interactionMode === "guided"
          && guidedStepHeardId === model.steps[state.currentIndex].id
        )
      )
      && speechStatus === "idle"
      && !state.completedAt,
  };
  elements.ring.setPointerCapture?.(event.pointerId);
  elements.ring.classList.add("is-gripping");
  elements.beadStage.classList.add("is-gripping");
  elements.ring.style.setProperty("--grip-drag", "0px");
  event.preventDefault();
}

function moveGrip(event) {
  if (!gripGesture || event.pointerId !== gripGesture.pointerId) return;
  const rawDelta = event.clientY - gripGesture.startY;
  const maxUpwardTravel = gripGesture.canAdvance ? -64 : -14;
  gripGesture.deltaY = Math.max(maxUpwardTravel, Math.min(14, rawDelta));
  elements.ring.style.setProperty("--grip-drag", `${gripGesture.deltaY}px`);
  elements.beadStage.classList.toggle(
    "grip-ready",
    gripGesture.canAdvance && gripGesture.deltaY <= -GRIP_THRESHOLD,
  );
  event.preventDefault();
}

function endGrip(event) {
  if (!gripGesture || event.pointerId !== gripGesture.pointerId) return;
  const shouldAdvance = gripGesture.canAdvance && gripGesture.deltaY <= -GRIP_THRESHOLD;
  gripGesture = null;
  try {
    elements.ring.releasePointerCapture?.(event.pointerId);
  } catch {
    // La cattura può essere già terminata dal browser dopo un pointercancel.
  }
  if (shouldAdvance) {
    elements.ring.classList.add("is-snapping");
    advanceFromGrip({ animateRail: false });
  }

  elements.ring.style.setProperty("--grip-drag", "0px");
  elements.ring.classList.remove("is-gripping");
  elements.beadStage.classList.remove("is-gripping", "grip-ready");

  if (shouldAdvance) {
    window.requestAnimationFrame(() => elements.ring.classList.remove("is-snapping"));
  }
}

function changeRosaryConfiguration(change) {
  stopSpeech();
  guidedStepHeardId = null;
  change();
  state.completedAt = null;
  rebuildRosary({ resetProgress: true });
}

elements.playPauseButton.addEventListener("click", toggleSpeech);

elements.interactionModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextMode = button.dataset.interactionMode;
    if (!INTERACTION_MODES.includes(nextMode) || nextMode === state.interactionMode) return;
    stopSpeech();
    state.interactionMode = nextMode;
    guidedStepHeardId = null;
    updateUi();
  });
});

elements.resetButton.addEventListener("click", () => {
  if (state.currentIndex > 0 && !window.confirm("Vuoi ricominciare il Rosario dall’inizio?")) return;
  stopSpeech();
  guidedStepHeardId = null;
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

elements.speechRateButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextRate = button.dataset.speechRate;
    if (!["1.2", "1.5", "1.7"].includes(nextRate) || nextRate === state.rate) return;
    stopSpeech();
    state.rate = nextRate;
    elements.speechRateButtons.forEach((rateButton) => {
      rateButton.setAttribute("aria-pressed", String(rateButton.dataset.speechRate === state.rate));
    });
    saveState();
  });
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

elements.ring.addEventListener("pointerdown", beginGrip);
elements.ring.addEventListener("pointermove", moveGrip);
elements.ring.addEventListener("pointerup", endGrip);
elements.ring.addEventListener("pointercancel", endGrip);

elements.ring.addEventListener("keydown", (event) => {
  if (!["ArrowDown", "Enter", " "].includes(event.key)) return;
  event.preventDefault();
  advanceFromGrip();
});

function realignCurrentBead() {
  syncRailToBead(model.steps[state.currentIndex].beadIndex);
}

window.addEventListener("resize", realignCurrentBead);
window.visualViewport?.addEventListener("resize", realignCurrentBead);
window.addEventListener("pagehide", () => {
  saveState();
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
});

elements.fullRosaryToggle.checked = state.full;
elements.mysterySetSelect.value = state.setChoice;
elements.interactionModeButtons.forEach((button) => {
  button.setAttribute("aria-pressed", String(button.dataset.interactionMode === state.interactionMode));
});
elements.speechRateButtons.forEach((button) => {
  button.setAttribute("aria-pressed", String(button.dataset.speechRate === state.rate));
});
elements.speakIntentionToggle.disabled = true;

const restoreProgress = canRestoreProgress();
if (!restoreProgress) state.completedAt = null;
rebuildRosary({ restoreSaved: restoreProgress });
loadVoices();

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
}
