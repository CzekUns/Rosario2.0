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
const beadCount = 59;
let steps = [];
let currentIndex = 0;
let isPlaying = false;
let voices = [];

const ring = document.querySelector("#rosaryRing");
const prayerTitle = document.querySelector("#prayerTitle");
const prayerText = document.querySelector("#prayerText");
const currentStepType = document.querySelector("#currentStepType");
const currentStepTitle = document.querySelector("#currentStepTitle");
const currentStepCount = document.querySelector("#currentStepCount");
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

function createStep(type, title, text, beadIndex = null) {
  const visibleBeadIndex = beadIndex === null ? null : Math.min(beadIndex, beadCount - 1);
  return { type, title, text, beadIndex: visibleBeadIndex };
}

function buildSteps(useFullRosary = false) {
  const activeMysteries = useFullRosary ? mysteries : shortMysteries;
  const nextSteps = [
    createStep("Intro", "Segno della Croce", prayers.sign, 0),
    createStep("Invocazione", "Maria che scioglie i nodi", knotPrayer(), 1),
  ];

  let beadIndex = 2;
  activeMysteries.forEach((mystery, decadeIndex) => {
    nextSteps.push(createStep("Mistero", `${decadeIndex + 1}. ${mystery}`, `Meditiamo: ${mystery}. ${prayers.undoer}`, beadIndex));
    beadIndex += 1;
    nextSteps.push(createStep("Padre Nostro", "Padre Nostro", prayers.ourFather, beadIndex));
    beadIndex += 1;

    for (let hailIndex = 1; hailIndex <= 10; hailIndex += 1) {
      nextSteps.push(createStep("Ave Maria", `Ave Maria ${hailIndex} / 10`, prayers.hailMary, beadIndex));
      beadIndex += 1;
    }

    nextSteps.push(createStep("Gloria", "Gloria al Padre", prayers.glory, beadIndex));
    beadIndex += 1;
    nextSteps.push(createStep("Fatima", "Preghiera di Fatima", prayers.fatima, beadIndex));
    beadIndex += 1;
  });

  nextSteps.push(createStep("Finale", "Affidamento", "Maria che scioglie i nodi, resta con noi e guidaci al tuo Figlio Gesù. Amen.", Math.min(beadIndex, beadCount - 1)));
  return nextSteps;
}

function knotPrayer() {
  const knot = knotInput.value.trim();
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
  const ringSize = Math.min(ring.clientWidth || 500, ring.clientHeight || 500);
  const radius = Math.max(118, ringSize / 2 - 28);

  for (let index = 0; index < beadCount; index += 1) {
    const angle = -92 + index * (360 / beadCount);
    const bead = document.createElement("button");
    const isMajor = index === 0 || index === 1 || index % 11 === 2;
    const transform = `rotate(${angle}deg) translate(${radius}px) rotate(${-angle}deg)`;
    bead.className = `bead${isMajor ? " major" : ""}`;
    bead.type = "button";
    bead.style.setProperty("--bead-transform", transform);
    bead.style.transform = transform;
    bead.setAttribute("aria-label", `Grano ${index + 1}`);
    bead.addEventListener("click", () => jumpToBead(index));
    ring.appendChild(bead);
  }
}

function refreshSteps(keepIndex = false) {
  if (!ring) {
    return;
  }

  const useFullRosary = Boolean(fullRosaryToggle?.checked);
  steps = buildSteps(useFullRosary);
  modeLabel.textContent = useFullRosary ? "Rosario completo" : "Rosario breve";
  durationEstimate.textContent = useFullRosary ? "~22 min stimati" : "~4 min demo";
  if (!keepIndex) {
    currentIndex = 0;
  }
  currentIndex = Math.min(currentIndex, steps.length - 1);
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
  currentStepCount.textContent = `${currentIndex + 1} / ${steps.length}`;
  progressFill.style.width = `${progress}%`;
  progressLabel.textContent = `${progress}%`;

  document.querySelectorAll(".bead").forEach((bead, beadIndex) => {
    bead.classList.toggle("active", beadIndex === currentStep.beadIndex);
    bead.classList.toggle("done", beadIndex < currentStep.beadIndex);
  });
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

function jumpToBead(beadIndex) {
  const nextIndex = steps.findIndex((step) => step.beadIndex >= beadIndex);
  if (nextIndex >= 0) {
    pause();
    currentIndex = nextIndex;
    updateUi();
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

renderBeads();
refreshSteps();
loadVoices();
