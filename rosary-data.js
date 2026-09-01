(function exposeRosaryData(root, factory) {
  const api = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.RosaryData = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createRosaryData() {
  "use strict";

  const prayers = Object.freeze({
    sign: "Nel nome del Padre, del Figlio e dello Spirito Santo. Amen.",
    creed:
      "Credo in Dio, Padre onnipotente, Creatore del cielo e della terra; e in Gesù Cristo, suo unico Figlio, nostro Signore, il quale fu concepito di Spirito Santo, nacque da Maria Vergine, patì sotto Ponzio Pilato, fu crocifisso, morì e fu sepolto; discese agli inferi; il terzo giorno risuscitò da morte; salì al cielo, siede alla destra di Dio Padre onnipotente; di là verrà a giudicare i vivi e i morti. Credo nello Spirito Santo, la santa Chiesa cattolica, la comunione dei santi, la remissione dei peccati, la risurrezione della carne, la vita eterna. Amen.",
    ourFather:
      "Padre nostro, che sei nei cieli, sia santificato il tuo nome, venga il tuo regno, sia fatta la tua volontà, come in cielo così in terra. Dacci oggi il nostro pane quotidiano, rimetti a noi i nostri debiti come anche noi li rimettiamo ai nostri debitori, e non abbandonarci alla tentazione, ma liberaci dal male. Amen.",
    hailMary:
      "Ave o Maria, piena di grazia, il Signore è con te. Tu sei benedetta fra le donne e benedetto è il frutto del tuo seno, Gesù. Santa Maria, Madre di Dio, prega per noi peccatori, adesso e nell'ora della nostra morte. Amen.",
    glory:
      "Gloria al Padre, al Figlio e allo Spirito Santo. Come era nel principio, ora e sempre, nei secoli dei secoli. Amen.",
    fatima:
      "Gesù mio, perdona le nostre colpe, preservaci dal fuoco dell'inferno, porta in cielo tutte le anime, specialmente le più bisognose della tua misericordia.",
    hailHolyQueen:
      "Salve, Regina, Madre di misericordia, vita, dolcezza e speranza nostra, salve. A te ricorriamo, esuli figli di Eva; a te sospiriamo, gementi e piangenti in questa valle di lacrime. Orsù dunque, avvocata nostra, rivolgi a noi gli occhi tuoi misericordiosi. E mostraci, dopo questo esilio, Gesù, il frutto benedetto del tuo seno. O clemente, o pia, o dolce Vergine Maria.",
    undoer:
      "Maria, Madre che scioglie i nodi, accogli questa intenzione nelle tue mani pazienti e guidaci verso la pace del cuore.",
  });

  const mysterySets = Object.freeze({
    joyful: Object.freeze({
      id: "joyful",
      label: "Misteri gaudiosi",
      shortLabel: "Gaudiosi",
      days: "lunedì e sabato",
      mysteries: Object.freeze([
        "L'Annunciazione dell'Angelo a Maria",
        "La visita di Maria a Elisabetta",
        "La nascita di Gesù a Betlemme",
        "La presentazione di Gesù al Tempio",
        "Il ritrovamento di Gesù nel Tempio",
      ]),
    }),
    luminous: Object.freeze({
      id: "luminous",
      label: "Misteri luminosi",
      shortLabel: "Luminosi",
      days: "giovedì",
      mysteries: Object.freeze([
        "Il Battesimo di Gesù nel Giordano",
        "Le nozze di Cana",
        "L'annuncio del Regno di Dio",
        "La Trasfigurazione di Gesù",
        "L'istituzione dell'Eucaristia",
      ]),
    }),
    sorrowful: Object.freeze({
      id: "sorrowful",
      label: "Misteri dolorosi",
      shortLabel: "Dolorosi",
      days: "martedì e venerdì",
      mysteries: Object.freeze([
        "L'agonia di Gesù nel Getsemani",
        "La flagellazione di Gesù",
        "L'incoronazione di spine",
        "Gesù porta la Croce al Calvario",
        "La crocifissione e morte di Gesù",
      ]),
    }),
    glorious: Object.freeze({
      id: "glorious",
      label: "Misteri gloriosi",
      shortLabel: "Gloriosi",
      days: "mercoledì e domenica",
      mysteries: Object.freeze([
        "La Risurrezione di Gesù",
        "L'Ascensione di Gesù al cielo",
        "La discesa dello Spirito Santo",
        "L'Assunzione di Maria al cielo",
        "L'incoronazione di Maria Regina del cielo e della terra",
      ]),
    }),
  });

  const dayToMysterySet = Object.freeze([
    "glorious",
    "joyful",
    "sorrowful",
    "glorious",
    "luminous",
    "sorrowful",
    "joyful",
  ]);

  function getTodaySetId(date = new Date()) {
    return dayToMysterySet[date.getDay()];
  }

  function resolveSetId(choice = "auto", date = new Date()) {
    return choice === "auto" || !mysterySets[choice] ? getTodaySetId(date) : choice;
  }

  function getDecadeBeadIndex(decadeIndex) {
    return 5 + decadeIndex * 11;
  }

  function getHailMaryBeadIndex(decadeIndex, hailIndex) {
    return getDecadeBeadIndex(decadeIndex) + 1 + hailIndex;
  }

  function getFinalBeadIndex(decadeCount) {
    return 5 + decadeCount * 11;
  }

  function buildRosaryBeads(decadeCount = 5, mysteryNumbers = []) {
    const beads = [
      { kind: "large", role: "incipit" },
      { kind: "small", role: "opening-hail", openingIndex: 0 },
      { kind: "small", role: "opening-hail", openingIndex: 1 },
      { kind: "small", role: "opening-hail", openingIndex: 2 },
      { kind: "large", role: "opening-glory" },
    ];

    for (let decadeIndex = 0; decadeIndex < decadeCount; decadeIndex += 1) {
      const mysteryNumber = mysteryNumbers[decadeIndex] || decadeIndex + 1;
      beads.push({ kind: "large", role: "decade", decadeIndex, mysteryNumber });
      for (let hailIndex = 0; hailIndex < 10; hailIndex += 1) {
        beads.push({
          kind: "small",
          role: "hail-mary",
          decadeIndex,
          hailIndex,
          mysteryNumber,
        });
      }
    }

    beads.push({ kind: "large", role: "final" });
    return beads;
  }

  function createStep(id, type, title, text, beadIndex, context = {}) {
    return { id, type, title, text, beadIndex, ...context };
  }

  function buildIntentionText(intention) {
    const cleanIntention = String(intention || "").trim();
    if (!cleanIntention) {
      return prayers.undoer;
    }
    return `Maria, Madre che scioglie i nodi, ti affidiamo questa intenzione: ${cleanIntention}. Accoglila nelle tue mani pazienti e guidaci verso la pace del cuore.`;
  }

  function buildRosary(options = {}) {
    const {
      setChoice = "auto",
      full = true,
      shortMysteryIndex = 0,
      intention = "",
      speakIntention = false,
      date = new Date(),
    } = options;

    const setId = resolveSetId(setChoice, date);
    const set = mysterySets[setId];
    const safeShortIndex = Math.max(0, Math.min(Number(shortMysteryIndex) || 0, 4));
    const selectedMysteries = full
      ? set.mysteries.map((title, index) => ({ title, mysteryNumber: index + 1 }))
      : [{ title: set.mysteries[safeShortIndex], mysteryNumber: safeShortIndex + 1 }];
    const mysteryNumbers = selectedMysteries.map((mystery) => mystery.mysteryNumber);
    const beads = buildRosaryBeads(selectedMysteries.length, mysteryNumbers);
    const steps = [
      createStep("opening-sign", "Inizio", "Segno della Croce", prayers.sign, 0, {
        code: "Inizio",
        primaryOnBead: true,
      }),
      createStep("opening-creed", "Apertura", "Credo", prayers.creed, 0, {
        code: "Credo",
      }),
      createStep("opening-our-father", "Apertura", "Padre Nostro", prayers.ourFather, 0, {
        code: "Aper.-P",
      }),
      createStep("opening-hail-1", "Apertura", "Ave Maria per la fede", prayers.hailMary, 1, {
        code: "Fede",
        primaryOnBead: true,
      }),
      createStep("opening-hail-2", "Apertura", "Ave Maria per la speranza", prayers.hailMary, 2, {
        code: "Speranza",
        primaryOnBead: true,
      }),
      createStep("opening-hail-3", "Apertura", "Ave Maria per la carità", prayers.hailMary, 3, {
        code: "Carità",
        primaryOnBead: true,
      }),
      createStep("opening-glory", "Apertura", "Gloria al Padre", prayers.glory, 4, {
        code: "Aper.-G",
        primaryOnBead: true,
      }),
    ];

    if (speakIntention && String(intention || "").trim()) {
      steps.push(
        createStep("opening-intention", "Affidamento", "Intenzione personale", buildIntentionText(intention), 4, {
          code: "Nodo",
        }),
      );
    }

    selectedMysteries.forEach((mystery, decadeIndex) => {
      const { mysteryNumber, title } = mystery;
      const prefix = `${setId}-m${mysteryNumber}`;
      const decadeBeadIndex = getDecadeBeadIndex(decadeIndex);
      const lastHailBeadIndex = getHailMaryBeadIndex(decadeIndex, 9);

      steps.push(
        createStep(prefix, "Mistero", `${mysteryNumber}. ${title}`, `Nel ${mysteryNumber}º mistero contempliamo: ${title}.`, decadeBeadIndex, {
          code: `Mis.${mysteryNumber}`,
          mysteryNumber,
          primaryOnBead: true,
        }),
        createStep(`${prefix}-our-father`, "Padre Nostro", "Padre Nostro", prayers.ourFather, decadeBeadIndex, {
          code: `Mis.${mysteryNumber}-P`,
          mysteryNumber,
        }),
      );

      for (let hailNumber = 1; hailNumber <= 10; hailNumber += 1) {
        steps.push(
          createStep(
            `${prefix}-hail-${hailNumber}`,
            "Ave Maria",
            `Ave Maria ${hailNumber} di 10`,
            prayers.hailMary,
            getHailMaryBeadIndex(decadeIndex, hailNumber - 1),
            {
              code: `Mis.${mysteryNumber}-${hailNumber}`,
              mysteryNumber,
              repetition: hailNumber,
              primaryOnBead: true,
            },
          ),
        );
      }

      steps.push(
        createStep(`${prefix}-glory`, "Gloria", "Gloria al Padre", prayers.glory, lastHailBeadIndex, {
          code: `Mis.${mysteryNumber}-G`,
          mysteryNumber,
        }),
        createStep(`${prefix}-fatima`, "Invocazione", "Preghiera di Fatima", prayers.fatima, lastHailBeadIndex, {
          code: `Mis.${mysteryNumber}-F`,
          mysteryNumber,
        }),
      );
    });

    const finalBeadIndex = getFinalBeadIndex(selectedMysteries.length);
    steps.push(
      createStep("closing-hail-holy-queen", "Conclusione", "Salve Regina", prayers.hailHolyQueen, finalBeadIndex, {
        code: "Fine",
        primaryOnBead: true,
      }),
      createStep("closing-sign", "Conclusione", "Segno della Croce", prayers.sign, finalBeadIndex, {
        code: "Amen",
      }),
    );

    return {
      beads,
      steps,
      set,
      setId,
      selectedMysteries,
      full,
      shortMysteryIndex: safeShortIndex,
    };
  }

  function getBeadCode(bead) {
    if (!bead) return "";
    if (bead.role === "incipit") return "Inizio";
    if (bead.role === "opening-hail") return ["Fede", "Speranza", "Carità"][bead.openingIndex];
    if (bead.role === "opening-glory") return "Gloria";
    if (bead.role === "decade") return `Mis.${bead.mysteryNumber}`;
    if (bead.role === "hail-mary") return `Mis.${bead.mysteryNumber}-${bead.hailIndex + 1}`;
    return "Fine";
  }

  function getBeadLabel(bead) {
    if (!bead) return "Grano del Rosario";
    if (bead.role === "incipit") return "Inizio del Rosario";
    if (bead.role === "opening-hail") {
      return `Ave Maria di apertura per ${["la fede", "la speranza", "la carità"][bead.openingIndex]}`;
    }
    if (bead.role === "opening-glory") return "Gloria di apertura";
    if (bead.role === "decade") return `Mistero ${bead.mysteryNumber}, Padre Nostro`;
    if (bead.role === "hail-mary") {
      return `Mistero ${bead.mysteryNumber}, Ave Maria ${bead.hailIndex + 1} di 10`;
    }
    return "Conclusione del Rosario";
  }

  return Object.freeze({
    prayers,
    mysterySets,
    dayToMysterySet,
    getTodaySetId,
    resolveSetId,
    getDecadeBeadIndex,
    getHailMaryBeadIndex,
    getFinalBeadIndex,
    buildRosaryBeads,
    buildRosary,
    getBeadCode,
    getBeadLabel,
  });
});
