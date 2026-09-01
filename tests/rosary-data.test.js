"use strict";

const assert = require("node:assert/strict");
const rosary = require("../rosary-data.js");

assert.deepEqual(Object.keys(rosary.mysterySets), ["joyful", "luminous", "sorrowful", "glorious"]);
Object.values(rosary.mysterySets).forEach((set) => {
  assert.equal(set.mysteries.length, 5, `${set.label} deve contenere cinque misteri`);
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

const withIntention = rosary.buildRosary({
  setChoice: "luminous",
  full: false,
  intention: "la mia famiglia",
  speakIntention: true,
});
assert.equal(withIntention.steps.length, 24);
assert.match(withIntention.steps.find((step) => step.id === "opening-intention").text, /la mia famiglia/);

console.log("Rosary data tests passed");
