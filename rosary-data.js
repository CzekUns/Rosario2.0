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

  function createMystery(title, scriptureReference, narrative) {
    return Object.freeze({ title, scriptureReference, narrative });
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
          "Lc 1,26-38",
          "L'angelo Gabriele è mandato da Dio a Nazaret, da Maria. Le annuncia che concepirà Gesù per opera dello Spirito Santo. Maria, pur domandandosi come avverrà, si affida liberamente alla parola di Dio e accoglie la sua chiamata.",
        ),
        createMystery(
          "La visita di Maria a Elisabetta",
          "Lc 1,39-56",
          "Maria si mette in viaggio verso la casa di Elisabetta. Al suo saluto, il bambino sussulta nel grembo della cugina, che la riconosce benedetta fra le donne. Maria allora loda Dio per le grandi opere compiute nella sua umiltà.",
        ),
        createMystery(
          "La nascita di Gesù a Betlemme",
          "Lc 2,1-20",
          "Maria e Giuseppe giungono a Betlemme, dove nasce Gesù. Maria lo avvolge in fasce e lo depone in una mangiatoia. Gli angeli portano ai pastori l'annuncio di una grande gioia; essi accorrono, trovano il bambino e raccontano ciò che hanno udito.",
        ),
        createMystery(
          "La presentazione di Gesù al Tempio",
          "Lc 2,22-38",
          "Maria e Giuseppe portano Gesù al Tempio per offrirlo al Signore. Simeone prende il bambino tra le braccia, riconosce in lui la salvezza preparata per tutti i popoli e annuncia a Maria che una spada attraverserà la sua anima. Anche Anna rende lode a Dio.",
        ),
        createMystery(
          "Il ritrovamento di Gesù nel Tempio",
          "Lc 2,41-52",
          "Dopo tre giorni di ricerca, Maria e Giuseppe trovano Gesù nel Tempio, seduto tra i maestri mentre li ascolta e li interroga. Gesù ricorda loro che deve occuparsi delle cose del Padre suo, poi torna a Nazaret e rimane loro sottomesso.",
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
          "Mt 3,13-17",
          "Gesù raggiunge Giovanni al Giordano e riceve il battesimo. Uscendo dall'acqua, i cieli si aprono, lo Spirito di Dio scende su di lui come una colomba e la voce del Padre lo manifesta come il Figlio amato nel quale ha posto il suo compiacimento.",
        ),
        createMystery(
          "Le nozze di Cana",
          "Gv 2,1-12",
          "Durante una festa di nozze a Cana viene a mancare il vino. Maria se ne accorge e invita i servi a fidarsi di Gesù. Egli fa riempire d'acqua sei giare e trasforma quell'acqua in vino buono: è il primo dei suoi segni e i discepoli credono in lui.",
        ),
        createMystery(
          "L'annuncio del Regno di Dio",
          "Mc 1,14-15",
          "Gesù percorre la Galilea annunciando che il tempo è compiuto e il Regno di Dio è vicino. Invita tutti alla conversione e alla fede nel Vangelo; con il perdono, le guarigioni e la vicinanza agli ultimi rende già presente la misericordia del Padre.",
        ),
        createMystery(
          "La Trasfigurazione di Gesù",
          "Lc 9,28-36",
          "Gesù sale sul monte con Pietro, Giovanni e Giacomo. Mentre prega, il suo volto cambia d'aspetto e le sue vesti diventano splendenti; Mosè ed Elia parlano con lui. Dalla nube la voce del Padre indica Gesù come il Figlio eletto e invita ad ascoltarlo.",
        ),
        createMystery(
          "L'istituzione dell'Eucaristia",
          "Lc 22,14-20",
          "Nell'ultima cena Gesù prende il pane, rende grazie, lo spezza e lo dona ai discepoli come suo corpo offerto per loro. Poi consegna il calice della nuova alleanza nel suo sangue e chiede di ripetere quel gesto in sua memoria.",
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
          "Lc 22,39-46",
          "Nel Getsemani Gesù prega mentre i discepoli, vinti dalla tristezza, si addormentano. Nell'angoscia affida al Padre la propria paura e sceglie di compiere la sua volontà. Un angelo lo conforta, ed egli si rialza per affrontare ciò che sta per accadere.",
        ),
        createMystery(
          "La flagellazione di Gesù",
          "Gv 18,38–19,1",
          "Pilato dichiara di non trovare colpa in Gesù, ma cede alla pressione della folla. Fa liberare Barabba e consegna Gesù ai soldati perché sia flagellato. L'innocente subisce la violenza senza rispondere con altra violenza.",
        ),
        createMystery(
          "L'incoronazione di spine",
          "Mt 27,27-31",
          "I soldati conducono Gesù nel pretorio, gli mettono addosso un mantello scarlatto e intrecciano una corona di spine sul suo capo. Gli pongono una canna nella mano e lo deridono chiamandolo re, poi lo percuotono e lo conducono alla crocifissione.",
        ),
        createMystery(
          "Gesù porta la Croce al Calvario",
          "Lc 23,26-32",
          "Mentre Gesù viene condotto al luogo della crocifissione, i soldati costringono Simone di Cirene a portare la croce dietro di lui. Una folla lo segue e alcune donne piangono; anche in quel cammino di dolore Gesù rivolge loro una parola di verità.",
        ),
        createMystery(
          "La crocifissione e morte di Gesù",
          "Lc 23,33-46",
          "Sul Calvario Gesù è crocifisso tra due malfattori. Prega perché i suoi persecutori siano perdonati e promette il paradiso al condannato che si affida a lui. Dopo aver consegnato il proprio spirito nelle mani del Padre, muore e il centurione riconosce la sua innocenza.",
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
          "Lc 24,1-12",
          "All'alba le donne trovano la pietra rotolata via e il sepolcro vuoto. Due messaggeri ricordano loro che Gesù aveva annunciato la propria risurrezione. Esse corrono dagli apostoli; Pietro raggiunge il sepolcro e torna pieno di stupore per quanto è accaduto.",
        ),
        createMystery(
          "L'Ascensione di Gesù al cielo",
          "At 1,6-11",
          "Gesù risorto promette agli apostoli la forza dello Spirito Santo e li invia come suoi testimoni fino ai confini della terra. Mentre essi lo guardano, viene elevato e una nube lo sottrae ai loro occhi; i discepoli ricevono la promessa del suo ritorno.",
        ),
        createMystery(
          "La discesa dello Spirito Santo",
          "At 2,1-13",
          "Nel giorno di Pentecoste i discepoli sono riuniti insieme. Un fragore come di vento riempie la casa e lingue come di fuoco si posano su ciascuno. Tutti vengono colmati di Spirito Santo e cominciano ad annunciare le opere di Dio nelle lingue dei popoli.",
        ),
        createMystery(
          "L'Assunzione di Maria al cielo",
          "Lc 1,48-49",
          "Nel Magnificat Maria proclama che tutte le generazioni la chiameranno beata per le grandi cose compiute in lei dall'Onnipotente. La Chiesa contempla il compimento di questa promessa: terminata la sua vita terrena, Maria è accolta da Dio in cielo, in anima e corpo.",
        ),
        createMystery(
          "L'incoronazione di Maria Regina del cielo e della terra",
          "Ap 12,1",
          "L'Apocalisse mostra nel cielo una donna vestita di sole, con la luna sotto i piedi e una corona di dodici stelle. In questa immagine la Chiesa contempla Maria accanto al Figlio risorto, partecipe della sua gloria e madre che continua a intercedere per il suo popolo.",
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
    const speechParts = context.speechParts
      || prayerPartsByText.get(text)
      || freezeSpeechParts([{ speaker: "leader", text }]);
    return { id, type, title, text, beadIndex, speechParts, ...context };
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
      const { mysteryNumber, title, scriptureReference, narrative } = mystery;
      const prefix = `${setId}-m${mysteryNumber}`;
      const decadeBeadIndex = getDecadeBeadIndex(decadeIndex);
      const lastHailBeadIndex = getHailMaryBeadIndex(decadeIndex, 9);

      steps.push(
        createStep(prefix, "Mistero", `${mysteryNumber}. ${title}`, `Nel ${mysteryNumber}º mistero contempliamo ${title}. ${narrative}`, decadeBeadIndex, {
          code: `Mis.${mysteryNumber}`,
          mysteryNumber,
          scriptureReference,
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
