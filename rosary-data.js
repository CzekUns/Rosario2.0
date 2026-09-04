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

  function freezeSpeechParts(parts) {
    return Object.freeze(
      parts.map((part) => Object.freeze({ speaker: part.speaker, text: part.text })),
    );
  }

  const prayerParts = Object.freeze({
    sign: freezeSpeechParts([
      { speaker: "leader", text: "Nel nome del Padre, del Figlio e dello Spirito Santo." },
      { speaker: "assembly", text: "Amen." },
    ]),
    creed: freezeSpeechParts([{ speaker: "assembly", text: prayers.creed }]),
    ourFather: freezeSpeechParts([
      { speaker: "leader", text: "Padre nostro, che sei nei cieli, sia santificato il tuo nome, venga il tuo regno, sia fatta la tua volontà, come in cielo così in terra." },
      { speaker: "assembly", text: "Dacci oggi il nostro pane quotidiano, rimetti a noi i nostri debiti come anche noi li rimettiamo ai nostri debitori, e non abbandonarci alla tentazione, ma liberaci dal male. Amen." },
    ]),
    hailMary: freezeSpeechParts([
      { speaker: "leader", text: "Ave o Maria, piena di grazia, il Signore è con te. Tu sei benedetta fra le donne e benedetto è il frutto del tuo seno, Gesù." },
      { speaker: "assembly", text: "Santa Maria, Madre di Dio, prega per noi peccatori, adesso e nell'ora della nostra morte. Amen." },
    ]),
    glory: freezeSpeechParts([
      { speaker: "leader", text: "Gloria al Padre, al Figlio e allo Spirito Santo." },
      { speaker: "assembly", text: "Come era nel principio, ora e sempre, nei secoli dei secoli. Amen." },
    ]),
    fatima: freezeSpeechParts([{ speaker: "assembly", text: prayers.fatima }]),
    hailHolyQueen: freezeSpeechParts([{ speaker: "assembly", text: prayers.hailHolyQueen }]),
    undoer: freezeSpeechParts([{ speaker: "leader", text: prayers.undoer }]),
  });

  const prayerPartsByText = new Map(
    Object.keys(prayerParts).map((key) => [prayers[key], prayerParts[key]]),
  );

  const abbreviatedPrayerTextByText = new Map([
    [prayers.ourFather, "Padre Nostro..."],
    [prayers.hailMary, "Ave Maria..."],
    [prayers.glory, "Gloria al Padre..."],
  ]);

  function createMystery(title, scriptureSource, scriptureReference, scriptureText) {
    return Object.freeze({ title, scriptureSource, scriptureReference, scriptureText });
  }

  const mysterySets = Object.freeze({
    joyful: Object.freeze({
      id: "joyful",
      label: "Misteri gaudiosi",
      shortLabel: "Gaudiosi",
      days: "lunedì e sabato",
      mysteries: Object.freeze([
        createMystery(
          "L'Annunciazione dell'Angelo a Maria",
          "Dal Vangelo secondo Luca",
          "Lc 1,30-31",
          "L'angelo le disse: «Non temere, Maria, perché hai trovato grazia presso Dio. Ed ecco, concepirai un figlio, lo darai alla luce e lo chiamerai Gesù».",
        ),
        createMystery(
          "La visita di Maria a Elisabetta",
          "Dal Vangelo secondo Luca",
          "Lc 1,42",
          "Elisabetta esclamò a gran voce: «Benedetta tu fra le donne e benedetto il frutto del tuo grembo!».",
        ),
        createMystery(
          "La nascita di Gesù a Betlemme",
          "Dal Vangelo secondo Luca",
          "Lc 2,7",
          "Maria diede alla luce il suo figlio primogenito, lo avvolse in fasce e lo pose in una mangiatoia, perché per loro non c'era posto nell'alloggio.",
        ),
        createMystery(
          "La presentazione di Gesù al Tempio",
          "Dal Vangelo secondo Luca",
          "Lc 2,27-28",
          "Mentre i genitori vi portavano il bambino Gesù, Simeone lo accolse tra le braccia e benedisse Dio.",
        ),
        createMystery(
          "Il ritrovamento di Gesù nel Tempio",
          "Dal Vangelo secondo Luca",
          "Lc 2,46",
          "Dopo tre giorni lo trovarono nel tempio, seduto in mezzo ai maestri, mentre li ascoltava e li interrogava.",
        ),
      ]),
    }),
    luminous: Object.freeze({
      id: "luminous",
      label: "Misteri luminosi",
      shortLabel: "Luminosi",
      days: "giovedì",
      mysteries: Object.freeze([
        createMystery(
          "Il Battesimo di Gesù nel Giordano",
          "Dal Vangelo secondo Matteo",
          "Mt 3,17",
          "Ed ecco una voce dal cielo che diceva: «Questi è il Figlio mio, l'amato: in lui ho posto il mio compiacimento».",
        ),
        createMystery(
          "Le nozze di Cana",
          "Dal Vangelo secondo Giovanni",
          "Gv 2,3.5",
          "Venuto a mancare il vino, la madre di Gesù gli disse: «Non hanno vino». Sua madre disse ai servitori: «Qualsiasi cosa vi dica, fatela».",
        ),
        createMystery(
          "L'annuncio del Regno di Dio",
          "Dal Vangelo secondo Marco",
          "Mc 1,14-15",
          "Gesù proclamava il vangelo di Dio e diceva: «Il tempo è compiuto e il regno di Dio è vicino; convertitevi e credete nel Vangelo».",
        ),
        createMystery(
          "La Trasfigurazione di Gesù",
          "Dal Vangelo secondo Matteo",
          "Mt 17,2",
          "Fu trasfigurato davanti a loro: il suo volto brillò come il sole e le sue vesti divennero candide come la luce.",
        ),
        createMystery(
          "L'istituzione dell'Eucaristia",
          "Dal Vangelo secondo Matteo",
          "Mt 26,26",
          "Gesù prese il pane, recitò la benedizione, lo spezzò e, mentre lo dava ai discepoli, disse: «Prendete, mangiate: questo è il mio corpo».",
        ),
      ]),
    }),
    sorrowful: Object.freeze({
      id: "sorrowful",
      label: "Misteri dolorosi",
      shortLabel: "Dolorosi",
      days: "martedì e venerdì",
      mysteries: Object.freeze([
        createMystery(
          "L'agonia di Gesù nel Getsemani",
          "Dal Vangelo secondo Luca",
          "Lc 22,44",
          "Entrato nella lotta, pregava più intensamente, e il suo sudore diventò come gocce di sangue che cadono a terra.",
        ),
        createMystery(
          "La flagellazione di Gesù",
          "Dal Vangelo secondo Matteo",
          "Mt 27,26",
          "Pilato rimise in libertà per loro Barabba e, dopo aver fatto flagellare Gesù, lo consegnò perché fosse crocifisso.",
        ),
        createMystery(
          "L'incoronazione di spine",
          "Dal Vangelo secondo Matteo",
          "Mt 27,28-29",
          "I soldati intrecciarono una corona di spine, gliela posero sul capo e, inginocchiandosi davanti a lui, lo deridevano: «Salve, re dei Giudei!».",
        ),
        createMystery(
          "Gesù porta la Croce al Calvario",
          "Dal Vangelo secondo Giovanni",
          "Gv 19,17",
          "Gesù, portando la croce, si avviò verso il luogo detto del Cranio, in ebraico Gòlgota.",
        ),
        createMystery(
          "La crocifissione e morte di Gesù",
          "Dal Vangelo secondo Giovanni",
          "Gv 19,30",
          "Gesù disse: «È compiuto!». E, chinato il capo, consegnò lo spirito.",
        ),
      ]),
    }),
    glorious: Object.freeze({
      id: "glorious",
      label: "Misteri gloriosi",
      shortLabel: "Gloriosi",
      days: "mercoledì e domenica",
      mysteries: Object.freeze([
        createMystery(
          "La Risurrezione di Gesù",
          "Dal Vangelo secondo Luca",
          "Lc 24,5-6",
          "«Perché cercate tra i morti colui che è vivo? Non è qui, è risorto».",
        ),
        createMystery(
          "L'Ascensione di Gesù al cielo",
          "Dal Vangelo secondo Marco",
          "Mc 16,19",
          "Il Signore Gesù, dopo aver parlato con loro, fu elevato in cielo e sedette alla destra di Dio.",
        ),
        createMystery(
          "La discesa dello Spirito Santo",
          "Dal Vangelo secondo Giovanni",
          "Gv 20,19.22",
          "Venne Gesù, stette in mezzo e disse loro: «Pace a voi!». Detto questo, soffiò e disse loro: «Ricevete lo Spirito Santo».",
        ),
        createMystery(
          "L'Assunzione di Maria al cielo",
          "Dal Vangelo secondo Luca",
          "Lc 1,48-49",
          "«D'ora in poi tutte le generazioni mi chiameranno beata. Grandi cose ha fatto per me l'Onnipotente e Santo è il suo nome».",
        ),
        createMystery(
          "L'incoronazione di Maria Regina del cielo e della terra",
          "Dal libro dell'Apocalisse",
          "Ap 12,1",
          "Un segno grandioso apparve nel cielo: una donna vestita di sole, con la luna sotto i suoi piedi e, sul capo, una corona di dodici stelle.",
        ),
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
    return decadeIndex * 11;
  }

  function getHailMaryBeadIndex(decadeIndex, hailIndex) {
    return getDecadeBeadIndex(decadeIndex) + 1 + hailIndex;
  }

  function getFinalBeadIndex(decadeCount) {
    return decadeCount * 11;
  }

  function buildRosaryBeads(decadeCount = 5, mysteryNumbers = []) {
    const beads = [];

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
    const speechParts = context.speechParts
      || prayerPartsByText.get(text)
      || freezeSpeechParts([{ speaker: "leader", text }]);
    const displayText = context.displayText || abbreviatedPrayerTextByText.get(text);
    const step = { id, type, title, text, beadIndex, speechParts, ...context };
    if (displayText) step.displayText = displayText;
    return step;
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
      ? set.mysteries.map((mystery, index) => ({ ...mystery, mysteryNumber: index + 1 }))
      : [{ ...set.mysteries[safeShortIndex], mysteryNumber: safeShortIndex + 1 }];
    const mysteryNumbers = selectedMysteries.map((mystery) => mystery.mysteryNumber);
    const beads = buildRosaryBeads(selectedMysteries.length, mysteryNumbers);
    const steps = [];
    const intentionText = speakIntention && String(intention || "").trim()
      ? buildIntentionText(intention)
      : "";

    selectedMysteries.forEach((mystery, decadeIndex) => {
      const {
        mysteryNumber,
        title,
        scriptureSource,
        scriptureReference,
        scriptureText,
      } = mystery;
      const prefix = `${setId}-m${mysteryNumber}`;
      const decadeBeadIndex = getDecadeBeadIndex(decadeIndex);

      steps.push(
        createStep(prefix, "Mistero", `${mysteryNumber}. ${title}`, scriptureText, decadeBeadIndex, {
          code: `Mis.${mysteryNumber}`,
          mysteryNumber,
          scriptureSource,
          scriptureReference,
          largeBeadCard: true,
          includeOpeningSign: decadeIndex === 0,
          intentionText: decadeIndex === 0 ? intentionText : "",
          speechParts: freezeSpeechParts([
            ...(decadeIndex === 0 ? prayerParts.sign : []),
            ...(decadeIndex === 0 && intentionText
              ? [{ speaker: "leader", text: intentionText }]
              : []),
            ...prayerParts.glory,
            { speaker: "leader", text: `${mysteryNumber}º mistero. ${title}.` },
            { speaker: "leader", text: `${scriptureSource}. ${scriptureText}` },
            ...prayerParts.ourFather,
          ]),
          primaryOnBead: true,
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
    });

    const finalBeadIndex = getFinalBeadIndex(selectedMysteries.length);
    const lastMysteryNumber = selectedMysteries.at(-1).mysteryNumber;
    steps.push(
      createStep(`${setId}-m${lastMysteryNumber}-glory`, "Gloria", "Gloria al Padre", prayers.glory, finalBeadIndex, {
        code: `Mis.${lastMysteryNumber}-G`,
        mysteryNumber: lastMysteryNumber,
        primaryOnBead: true,
      }),
      createStep("closing-hail-holy-queen", "Conclusione", "Salve Regina", prayers.hailHolyQueen, finalBeadIndex, {
        code: "Fine",
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
    if (bead.role === "decade") return `Mis.${bead.mysteryNumber}`;
    if (bead.role === "hail-mary") return `Mis.${bead.mysteryNumber}-${bead.hailIndex + 1}`;
    return "Fine";
  }

  function getBeadLabel(bead) {
    if (!bead) return "Grano del Rosario";
    if (bead.role === "decade") {
      return `Gloria, mistero ${bead.mysteryNumber} e Padre Nostro`;
    }
    if (bead.role === "hail-mary") {
      return `Mistero ${bead.mysteryNumber}, Ave Maria ${bead.hailIndex + 1} di 10`;
    }
    return "Gloria e conclusione del Rosario";
  }

  return Object.freeze({
    prayers,
    prayerParts,
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
