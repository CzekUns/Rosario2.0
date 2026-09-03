"use strict";

const assert = require("node:assert/strict");
const rosary = require("../rosary-data.js");

assert.deepEqual(Object.keys(rosary.mysterySets), ["joyful", "luminous", "sorrowful", "glorious"]);
Object.values(rosary.mysterySets).forEach((set) => {
  assert.equal(set.mysteries.length, 5, `${set.label} deve contenere cinque misteri`);
  set.mysteries.forEach((mystery) => {
    assert.ok(mystery.title, "Ogni mistero deve avere un titolo");
    assert.ok(mystery.scriptureReference, `${mystery.title} deve avere un riferimento biblico`);
    assert.ok(mystery.narrative.length > 120, `${mystery.title} deve raccontare la scena contemplata`);
  });
});

const expectedByDay = ["glorious", "joyful", "sorrowful", "glorious", "luminous", "sorrowful", "joyful"];
expectedByDay.forEach((expected, day) => {
  const date = new Date(2024, 0, 7 + day);
  assert.equal(date.getDay(), day);
  assert.equal(rosary.getTodaySetId(date), expected);
});

const full = rosary.buildRosary({ setChoice: "joyful", full: true });
assert.equal(full.beads.length, 61);
assert.equal(full.steps.length, 79);
assert.equal(full.steps.filter((step) => step.type === "Ave Maria").length, 50);
assert.equal(full.steps.at(-2).title, "Salve Regina");
assert.equal(full.steps.filter((step) => step.type === "Mistero").length, 5);
full.steps.filter((step) => step.type === "Mistero").forEach((step) => {
  assert.ok(step.text.length > 150, `${step.title} deve includere il racconto evangelico`);
  assert.ok(step.scriptureReference, `${step.title} deve mostrare il riferimento biblico`);
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
assert.equal(short.beads.length, 17);
assert.equal(short.steps.length, 23);
assert.equal(short.selectedMysteries[0].mysteryNumber, 5);
assert.equal(rosary.getBeadCode(short.beads[5]), "Mis.5");
assert.equal(rosary.getBeadCode(short.beads[15]), "Mis.5-10");

const cana = rosary.buildRosary({
  setChoice: "luminous",
  full: false,
  shortMysteryIndex: 1,
}).steps.find((step) => step.type === "Mistero");
assert.match(cana.text, /mancare il vino/i);
assert.match(cana.text, /sei giare/i);
assert.equal(cana.scriptureReference, "Gv 2,1-12");

const withIntention = rosary.buildRosary({
  setChoice: "luminous",
  full: false,
  intention: "la mia famiglia",
  speakIntention: true,
});
assert.equal(withIntention.steps.length, 24);
assert.match(withIntention.steps.find((step) => step.id === "opening-intention").text, /la mia famiglia/);

console.log("Rosary data tests passed");
