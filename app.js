const prayers = {
  sign: "Nel nome del Padre, del Figlio e dello Spirito Santo. Amen.",
  ourFather:
    "Padre nostro, che sei nei cieli, sia santificato il tuo nome, venga il tuo regno, sia fatta la tua volontà, come in cielo così in terra. Dacci oggi il nostro pane quotidiano, rimetti a noi i nostri debiti come anche noi li rimettiamo ai nostri debitori, e non abbandonarci alla tentazione, ma liberaci dal male. Amen.",
  hailMary:
    "Ave o Maria, piena di grazia, il Signore è con te. Tu sei benedetta fra le donne e benedetto è il frutto del tuo seno, Gesù. Santa Maria, Madre di Dio, prega per noi peccatori, adesso e nell'ora della nostra morte. Amen.",
  glory:
    "Gloria al Padre, al Figlio e allo Spirito Santo. Come era nel principio, ora e sempre, nei secoli dei secoli. Amen.",
  fatima:
    "Gesù mio, perdona le nostre colpe, preservaci dal fuoco dell'inferno, porta in cielo tutte le anime, specialmente le più bisognose della tua misericordia.",
  undoer:
    "Maria, Madre che scioglie i nodi, affidiamo a te questo nodo. Prendilo nelle tue mani pazienti e guidaci verso la pace del cuore.",
};

const mysteries = [
  "L'Annunciazione dell'Angelo a Maria",
  "La visita di Maria a Elisabetta",
  "La nascita di Gesù a Betlemme",
  "La presentazione di Gesù al Tempio",
  "Il ritrovamento di Gesù nel Tempio",
];

const shortMysteries = [mysteries[0]];
const rosaryBeads = [
  { kind: "large", role: "incipit" },
  ...Array.from({ length: 3 }, () => ({ kind: "small", role: "opening" })),
  { kind: "large", role: "opening-glory" },
  ...mysteries.flatMap((_, decadeIndex) => [
    { kind: "large", role: "decade", decadeIndex },
    ...Array.from({ length: 10 }, (_, hailIndex) => ({
      kind: "small",
      role: "hail-mary",
      decadeIndex,
      hailIndex,
    })),
  ]),
  { kind: "large", role: "final" },
];
const beadCount = rosaryBeads.length;
let steps = [];
let currentIndex = 0;
let isPlaying = false;
let voices = [];
let railScrollTimer;
let railReleaseTimer;
let suppressRailSelection = false;

const ring = document.querySelector("#rosaryRing");
const prayerTitle = document.querySelector("#prayerTitle");
const prayerText = document.querySelector("#prayerText");
const currentStepType = document.querySelector("#currentStepType");
const currentStepTitle = document.querySelector("#currentStepTitle");
const currentStepCount = document.querySelector("#currentStepCount");
const stepCode = document.querySelector("#stepCode");
const progressFill = document.querySelector("#progressFill");
const progressLabel = document.querySelector("#progressLabel");
const playButton = document.querySelector("#playButton");
const pauseButton = document.querySelector("#pauseButton");
const nextButton = document.querySelector("#nextButton");
const resetButton = document.querySelector("#resetButton");
const fullRosaryToggle = document.querySelector("#fullRosaryToggle");
const voiceSelect = document.querySelector("#voiceSelect");
const speechSupport = document.querySelector("#speechSupport");
const knotInput = document.querySelector("#knotInput");
const modeLabel = document.querySelector("#modeLabel");
const durationEstimate = document.querySelector("#durationEstimate");

function createStep(type, title, text, beadIndex = null, context = {}) {
  const visibleBeadIndex = beadIndex === null ? null : Math.min(beadIndex, beadCount - 1);
  return { type, title, text, beadIndex: visibleBeadIndex, ...context };
}

function buildSteps(useFullRosary = false) {
  const activeMysteries = useFullRosary ? mysteries : shortMysteries;
  const finalBeadIndex = getFinalBeadIndex(activeMysteries.length);
  const nextSteps = [
    createStep("Intro", "Segno della Croce", prayers.sign, 0),
    createStep("Invocazione", "Maria che scioglie i nodi", knotPrayer(), 0),
  ];

  activeMysteries.forEach((mystery, decadeIndex) => {
    const decadeBeadIndex = getDecadeBeadIndex(decadeIndex);
    nextSteps.push(
      createStep(
        "Mistero",
        `${decadeIndex + 1}. ${mystery}`,
        `Meditiamo: ${mystery}. ${prayers.undoer}`,
        decadeBeadIndex,
        { mysteryNumber: decadeIndex + 1 },
      ),
    );
    nextSteps.push(
      createStep("Padre Nostro", "Padre Nostro", prayers.ourFather, decadeBeadIndex, {
        mysteryNumber: decadeIndex + 1,
      }),
    );

    for (let hailIndex = 1; hailIndex <= 10; hailIndex += 1) {
      nextSteps.push(
        createStep(
          "Ave Maria",
          `Ave Maria ${hailIndex} / 10`,
          prayers.hailMary,
          getHailMaryBeadIndex(decadeIndex, hailIndex - 1),
          { mysteryNumber: decadeIndex + 1, repetition: hailIndex },
        ),
      );
    }

    const closingBeadIndex = getFinalBeadIndex(decadeIndex + 1);
    nextSteps.push(
      createStep("Gloria", "Gloria al Padre", prayers.glory, closingBeadIndex, {
        mysteryNumber: decadeIndex + 1,
      }),
    );
    nextSteps.push(
      createStep("Fatima", "Preghiera di Fatima", prayers.fatima, closingBeadIndex, {
        mysteryNumber: decadeIndex + 1,
      }),
    );
  });

  nextSteps.push(
    createStep(
      "Finale",
      "Affidamento",
      "Maria che scioglie i nodi, resta con noi e guidaci al tuo Figlio Gesù. Amen.",
      finalBeadIndex,
    ),
  );
  return nextSteps;
}

function getDecadeBeadIndex(decadeIndex) {
  return 5 + decadeIndex * 11;
}

function getHailMaryBeadIndex(decadeIndex, hailIndex) {
  return getDecadeBeadIndex(decadeIndex) + 1 + hailIndex;
}

function getFinalBeadIndex(activeDecadeCount) {
  return Math.min(getDecadeBeadIndex(activeDecadeCount), beadCount - 1);
}

function knotPrayer() {
  const knot = knotInput?.value.trim();
  if (!knot) {
    return prayers.undoer;
  }
  return `Maria, Madre che scioglie i nodi, ti affidiamo questo nodo: ${knot}. Prendilo nelle tue mani pazienti e guidaci verso la pace del cuore.`;
}

function renderBeads() {
  if (!ring) {
    return;
  }

  ring.innerHTML = "";
  const useFullRosary = Boolean(fullRosaryToggle?.checked);
  const visibleBeadCount = useFullRosary
    ? beadCount
    : getFinalBeadIndex(shortMysteries.length) + 1;

  for (let index = 0; index < visibleBeadCount; index += 1) {
    const row = document.createElement("div");
    const bead = document.createElement("button");
    const code = document.createElement("span");
    const isMajor = rosaryBeads[index].kind === "large";
    const isShortFinal = !useFullRosary && index === visibleBeadCount - 1;

    row.className = "bead-row";
    row.dataset.beadIndex = String(index);
    row.setAttribute("role", "listitem");

    code.className = "bead-code";
    code.textContent = getBeadCode(index, isShortFinal);
    code.dataset.defaultCode = code.textContent;

    bead.className = `bead${isMajor ? " major" : ""}`;
    bead.type = "button";
    bead.setAttribute("aria-label", isShortFinal ? "Grano finale" : getBeadLabel(index));
    bead.addEventListener("click", () => jumpToBead(index));

    row.append(code, bead);
    ring.appendChild(row);
  }
}

function getBeadCode(index, isShortFinal = false) {
  if (isShortFinal || rosaryBeads[index].role === "final") {
    return "Fine";
  }

  const bead = rosaryBeads[index];
  if (bead.role === "decade") {
    return `Mis.${bead.decadeIndex + 1}`;
  }
  if (bead.role === "hail-mary") {
    return `Mis.${bead.decadeIndex + 1}-${bead.hailIndex + 1}`;
  }
  return index === 0 ? "Inizio" : "Apertura";
}

function getStepCode(step) {
  if (step.mysteryNumber) {
    if (step.repetition) {
      return `Mis.${step.mysteryNumber}-${step.repetition}`;
    }

    const suffixes = {
      "Padre Nostro": "P",
      Gloria: "G",
      Fatima: "F",
    };
    const suffix = suffixes[step.type];
    return suffix ? `Mis.${step.mysteryNumber}-${suffix}` : `Mis.${step.mysteryNumber}`;
  }

  const labels = {
    Intro: "Inizio",
    Invocazione: "Nodo",
    Finale: "Fine",
  };
  return labels[step.type] || step.type;
}

function getBeadLabel(index) {
  const bead = rosaryBeads[index];
  if (bead.role === "decade") {
    return `Grano grande, mistero ${bead.decadeIndex + 1} e Padre Nostro`;
  }
  if (bead.role === "hail-mary") {
    return `Grano piccolo, Ave Maria ${bead.hailIndex + 1}, decina ${bead.decadeIndex + 1}`;
  }
  return `Grano ${index + 1}`;
}

function refreshSteps(keepIndex = false) {
  if (!ring) {
    return;
  }

  const useFullRosary = Boolean(fullRosaryToggle?.checked);
  steps = buildSteps(useFullRosary);
  modeLabel.textContent = useFullRosary ? "Rosario completo" : "Rosario breve";
  durationEstimate.textContent = useFullRosary ? "~22 min" : "~4 min";
  if (!keepIndex) {
    currentIndex = 0;
  }
  currentIndex = Math.min(currentIndex, steps.length - 1);
  renderBeads();
  updateUi();
}

function updateUi() {
  if (!steps.length) {
    return;
  }

  const currentStep = steps[currentIndex];
  const progress = steps.length <= 1 ? 0 : Math.round((currentIndex / (steps.length - 1)) * 100);

  prayerTitle.textContent = currentStep.title;
  prayerText.textContent = currentStep.text;
  currentStepType.textContent = currentStep.type;
  currentStepTitle.textContent = currentStep.title;
  currentStepCount.textContent = `${currentIndex + 1}/${steps.length}`;
  stepCode.textContent = getStepCode(currentStep);
  progressFill.style.width = `${progress}%`;
  progressLabel.textContent = `${progress}%`;

  document.querySelectorAll(".bead-row").forEach((row) => {
    const beadIndex = Number(row.dataset.beadIndex);
    const bead = row.querySelector(".bead");
    const code = row.querySelector(".bead-code");
    const isActive = beadIndex === currentStep.beadIndex;

    row.classList.toggle("active", isActive);
    row.classList.toggle("done", beadIndex < currentStep.beadIndex);
    bead?.setAttribute("aria-current", isActive ? "step" : "false");
    if (code) {
      code.textContent = isActive ? getStepCode(currentStep) : code.dataset.defaultCode;
    }
  });

  syncRailToBead(currentStep.beadIndex);
}

function syncRailToBead(beadIndex) {
  if (!ring || beadIndex === null) {
    return;
  }

  const row = ring.querySelector(`[data-bead-index="${beadIndex}"]`);
  if (!row) {
    return;
  }

  const nextTop = row.offsetTop - (ring.clientHeight - row.clientHeight) / 2;
  if (Math.abs(ring.scrollTop - nextTop) < 2) {
    return;
  }

  suppressRailSelection = true;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  ring.scrollTo({ top: nextTop, behavior: reduceMotion ? "auto" : "smooth" });
  window.clearTimeout(railReleaseTimer);
  railReleaseTimer = window.setTimeout(() => {
    suppressRailSelection = false;
  }, reduceMotion ? 80 : 420);
}

function selectCenteredBead() {
  if (!ring || suppressRailSelection) {
    return;
  }

  const rows = [...ring.querySelectorAll(".bead-row")];
  const railCenter = ring.scrollTop + ring.clientHeight / 2;
  const closestRow = rows.reduce((closest, row) => {
    const rowCenter = row.offsetTop + row.clientHeight / 2;
    const distance = Math.abs(rowCenter - railCenter);
    return !closest || distance < closest.distance ? { row, distance } : closest;
  }, null);

  if (!closestRow) {
    return;
  }

  const beadIndex = Number(closestRow.row.dataset.beadIndex);
  if (steps[currentIndex]?.beadIndex !== beadIndex) {
    jumpToBead(beadIndex, { fromRail: true });
  }
}

function speakCurrent() {
  if (!("speechSynthesis" in window)) {
    if (speechSupport) {
      speechSupport.textContent = "Audio non disponibile";
    }
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(steps[currentIndex].text);
  utterance.lang = "it-IT";
  utterance.rate = 0.92;
  utterance.pitch = 0.92;

  const selectedVoice = voices.find((voice) => voice.name === voiceSelect.value);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.onend = () => {
    if (!isPlaying) {
      return;
    }
    if (currentIndex < steps.length - 1) {
      currentIndex += 1;
      updateUi();
      window.setTimeout(speakCurrent, 450);
    } else {
      isPlaying = false;
      playButton.textContent = "Ricomincia";
    }
  };

  window.speechSynthesis.speak(utterance);
}

function play() {
  if (currentIndex >= steps.length - 1 && !isPlaying) {
    currentIndex = 0;
  }
  refreshSteps(true);
  isPlaying = true;
  playButton.textContent = "In ascolto";
  speakCurrent();
}

function pause() {
  isPlaying = false;
  playButton.textContent = "Riprendi";
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function next() {
  pause();
  currentIndex = Math.min(currentIndex + 1, steps.length - 1);
  updateUi();
}

function reset() {
  pause();
  currentIndex = 0;
  playButton.textContent = "Play";
  refreshSteps();
}

function jumpToBead(beadIndex, { fromRail = false } = {}) {
  const exactIndex = steps.findIndex((step) => step.beadIndex === beadIndex);
  const nextIndex = exactIndex >= 0
    ? exactIndex
    : steps.findIndex((step) => step.beadIndex > beadIndex);
  if (nextIndex >= 0) {
    pause();
    currentIndex = nextIndex;
    updateUi();
    if (fromRail && "vibrate" in navigator) {
      navigator.vibrate(8);
    }
  }
}

function loadVoices() {
  if (!voiceSelect) {
    return;
  }

  if (!("speechSynthesis" in window)) {
    if (speechSupport) {
      speechSupport.textContent = "Solo testo";
    }
    voiceSelect.innerHTML = "<option>Audio non supportato</option>";
    voiceSelect.disabled = true;
    return;
  }

  voices = window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith("it"))
    .sort((firstVoice, secondVoice) => firstVoice.name.localeCompare(secondVoice.name));

  const fallbackVoices = window.speechSynthesis.getVoices();
  const availableVoices = voices.length ? voices : fallbackVoices;
  voiceSelect.innerHTML = "";
  availableVoices.forEach((voice) => {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = `${voice.name} · ${voice.lang}`;
    voiceSelect.appendChild(option);
  });

  if (!availableVoices.length) {
    const option = document.createElement("option");
    option.textContent = "Voce predefinita";
    voiceSelect.appendChild(option);
  }
}

document.querySelectorAll(".section-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const section = tab.dataset.section;
    document.querySelectorAll(".section-tab").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
    tab.classList.add("active");
    document.querySelector(`#panel-${section}`).classList.add("active");
  });
});

const startJourneyButton = document.querySelector("#startJourneyButton");
if (startJourneyButton?.tagName === "BUTTON") {
  startJourneyButton.addEventListener("click", () => {
    document.querySelector("#app")?.scrollIntoView({ behavior: "smooth" });
  });
}

document.querySelector("#openAppButton")?.addEventListener("click", () => {
  document.querySelector("#app")?.scrollIntoView({ behavior: "smooth" });
});

playButton?.addEventListener("click", play);
pauseButton?.addEventListener("click", pause);
nextButton?.addEventListener("click", next);
resetButton?.addEventListener("click", reset);
fullRosaryToggle?.addEventListener("change", () => refreshSteps());
knotInput?.addEventListener("change", () => refreshSteps(true));

ring?.addEventListener("pointerdown", () => {
  window.clearTimeout(railReleaseTimer);
  suppressRailSelection = false;
});

ring?.addEventListener(
  "scroll",
  () => {
    if (suppressRailSelection) {
      return;
    }
    window.clearTimeout(railScrollTimer);
    railScrollTimer = window.setTimeout(selectCenteredBead, 110);
  },
  { passive: true },
);

ring?.addEventListener("keydown", (event) => {
  if (!["ArrowUp", "ArrowDown"].includes(event.key)) {
    return;
  }

  event.preventDefault();
  const direction = event.key === "ArrowDown" ? 1 : -1;
  const activeBeadIndex = steps[currentIndex]?.beadIndex ?? 0;
  const targetIndex = Math.max(
    0,
    Math.min(activeBeadIndex + direction, ring.querySelectorAll(".bead-row").length - 1),
  );
  jumpToBead(targetIndex);
});

window.addEventListener("resize", () => {
  if (!ring) {
    return;
  }
  renderBeads();
  updateUi();
});

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

refreshSteps();
loadVoices();
