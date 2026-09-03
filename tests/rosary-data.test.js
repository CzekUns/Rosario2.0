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
assert.equal(full.beads.length, 60);
assert.equal(full.steps.length, 64);
assert.equal(full.steps.filter((step) => step.type === "Ave Maria").length, 50);
assert.equal(full.steps.at(-2).title, "Salve Regina");
assert.equal(full.steps.filter((step) => step.type === "Mistero").length, 5);
full.steps.filter((step) => step.type === "Mistero").forEach((step) => {
  assert.ok(step.text.length > 40, `${step.title} deve includere il passo biblico`);
  assert.match(step.scriptureSource, /^(Dal Vangelo secondo|Dal libro dell'Apocalisse)/);
  assert.ok(step.scriptureReference, `${step.title} deve mostrare il riferimento biblico`);
  assert.equal(step.largeBeadCard, true);
  assert.deepEqual(
    step.speechParts.map((part) => part.speaker),
    ["leader", "assembly", "leader", "leader", "assembly"],
    `${step.title} deve recitare Gloria, versetto e Padre Nostro in un unico passaggio`,
  );
});
assert.equal(full.steps.some((step) => step.title === "Preghiera di Fatima"), false);

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
assert.equal(short.beads.length, 16);
assert.equal(short.steps.length, 20);
assert.equal(short.selectedMysteries[0].mysteryNumber, 5);
assert.equal(rosary.getBeadCode(short.beads[4]), "Mis.5");
assert.equal(rosary.getBeadCode(short.beads[14]), "Mis.5-10");

const cana = rosary.buildRosary({
  setChoice: "luminous",
  full: false,
  shortMysteryIndex: 1,
}).steps.find((step) => step.type === "Mistero");
assert.match(cana.text, /mancare il vino/i);
assert.match(cana.text, /qualsiasi cosa vi dica, fatela/i);
assert.equal(cana.scriptureSource, "Dal Vangelo secondo Giovanni");
assert.equal(cana.scriptureReference, "Gv 2,3.5");

const withIntention = rosary.buildRosary({
  setChoice: "luminous",
  full: false,
  intention: "la mia famiglia",
  speakIntention: true,
});
assert.equal(withIntention.steps.length, 21);
assert.match(withIntention.steps.find((step) => step.id === "opening-intention").text, /la mia famiglia/);

console.log("Rosary data tests passed");
