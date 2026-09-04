"use strict";

const assert = require("node:assert/strict");
const rosary = require("../rosary-data.js");

assert.deepEqual(Object.keys(rosary.mysterySets), ["joyful", "luminous", "sorrowful", "glorious"]);
Object.values(rosary.mysterySets).forEach((set) => {
  assert.equal(set.mysteries.length, 5, `${set.label} deve contenere cinque misteri`);
  set.mysteries.forEach((mystery) => {
    assert.ok(mystery.title, "Ogni mistero deve avere un titolo");
    assert.ok(mystery.scriptureSource, `${mystery.title} deve indicare il libro biblico`);
    assert.ok(mystery.scriptureReference, `${mystery.title} deve avere un riferimento biblico`);
    assert.ok(mystery.scriptureText.length > 40, `${mystery.title} deve proclamare un passo biblico`);
    assert.equal(mystery.narrative, undefined, `${mystery.title} non deve contenere un riassunto inventato`);
  });
});

const expectedByDay = ["glorious", "joyful", "sorrowful", "glorious", "luminous", "sorrowful", "joyful"];
expectedByDay.forEach((expected, day) => {
  const date = new Date(2024, 0, 7 + day);
  assert.equal(date.getDay(), day);
  assert.equal(rosary.getTodaySetId(date), expected);
});

const full = rosary.buildRosary({ setChoice: "joyful", full: true });
assert.equal(full.beads.length, 56);
assert.equal(full.steps.length, 58);
assert.equal(full.steps.filter((step) => step.type === "Ave Maria").length, 50);
assert.equal(full.steps.at(-2).title, "Salve Regina");
assert.equal(full.steps.filter((step) => step.type === "Mistero").length, 5);
full.steps.filter((step) => step.type === "Mistero").forEach((step, index) => {
  assert.ok(step.text.length > 40, `${step.title} deve includere il passo biblico`);
  assert.match(step.scriptureSource, /^(Dal Vangelo secondo|Dal libro dell'Apocalisse)/);
  assert.ok(step.scriptureReference, `${step.title} deve mostrare il riferimento biblico`);
  assert.equal(step.largeBeadCard, true);
  assert.deepEqual(
    step.speechParts.map((part) => part.speaker),
    index === 0
      ? ["leader", "assembly", "leader", "assembly", "leader", "leader", "leader", "assembly"]
      : ["leader", "assembly", "leader", "leader", "leader", "assembly"],
    `${step.title} deve recitare Gloria, Vangelo e Padre Nostro in un unico passaggio`,
  );
  assert.ok(
    step.speechParts.some((part) => part.text.includes(step.title.replace(/^\d+\.\s*/, ""))),
    `${step.title} deve essere annunciato anche dalla voce`,
  );
  assert.ok(
    step.speechParts.some((part) => part.text.includes(step.text)),
    `${step.title} deve leggere integralmente il brano biblico anche nell'audio`,
  );
  assert.ok(
    step.speechParts.some((part) => /Ascoltiamo la Parola (del Vangelo|della Scrittura)/.test(part.text)),
    `${step.title} deve introdurre esplicitamente la lettura biblica`,
  );
});
assert.equal(full.steps.some((step) => step.title === "Preghiera di Fatima"), false);
assert.equal(full.steps.some((step) => step.title === "Credo"), false);
assert.equal(full.steps.some((step) => step.id.startsWith("opening-hail")), false);
assert.equal(full.steps.some((step) => step.id === "opening-sign"), false);
assert.equal(full.steps[0].includeOpeningSign, true);

full.selectedMysteries.forEach((mystery, decadeIndex) => {
  const largeBeadSteps = full.steps
    .filter((step) => step.beadIndex === rosary.getDecadeBeadIndex(decadeIndex))
    .map((step) => step.type);
  assert.deepEqual(
    largeBeadSteps,
    ["Mistero"],
    `Il grano grande ${decadeIndex + 1} deve richiedere un solo avanzamento`,
  );
});

full.steps.filter((step) => step.type === "Ave Maria").forEach((step) => {
  assert.equal(step.displayText, "Ave Maria...");
});
full.steps.filter((step) => step.title === "Padre Nostro").forEach((step) => {
  assert.equal(step.displayText, "Padre Nostro...");
});
full.steps.filter((step) => step.title === "Gloria al Padre").forEach((step) => {
  assert.equal(step.displayText, "Gloria al Padre...");
});

full.beads.forEach((_, beadIndex) => {
  assert.ok(
    full.steps.some((step) => step.beadIndex === beadIndex && step.primaryOnBead),
    `Il grano ${beadIndex} deve avere un passaggio principale`,
  );
});

const short = rosary.buildRosary({
  setChoice: "sorrowful",
  full: false,
  shortMysteryIndex: 4,
});
assert.equal(short.beads.length, 12);
assert.equal(short.steps.length, 14);
assert.equal(short.selectedMysteries[0].mysteryNumber, 5);
assert.equal(rosary.getBeadCode(short.beads[0]), "Mis.5");
assert.equal(rosary.getBeadCode(short.beads[10]), "Mis.5-10");

const cana = rosary.buildRosary({
  setChoice: "luminous",
  full: false,
  shortMysteryIndex: 1,
}).steps.find((step) => step.type === "Mistero");
assert.match(cana.text, /mancare il vino/i);
assert.match(cana.text, /qualsiasi cosa vi dica, fatela/i);
assert.equal(cana.scriptureSource, "Dal Vangelo secondo Giovanni");
assert.match(cana.text, /festa di nozze a Cana/i);
assert.match(cana.text, /Gesù con i suoi discepoli/i);
assert.equal(cana.scriptureReference, "Gv 2,1-5");

const withIntention = rosary.buildRosary({
  setChoice: "luminous",
  full: false,
  intention: "la mia famiglia",
  speakIntention: true,
});
assert.equal(withIntention.steps.length, 14);
assert.match(withIntention.steps[0].intentionText, /la mia famiglia/);
assert.match(
  withIntention.steps[0].speechParts.map((part) => part.text).join(" "),
  /la mia famiglia/,
);

console.log("Rosary data tests passed");
