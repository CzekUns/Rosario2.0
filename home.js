"use strict";

const HOME_STORAGE_KEY = "rosario2.reader.v2";
const rosaryData = window.RosaryData;

const today = new Date();
const todaySet = rosaryData.mysterySets[rosaryData.getTodaySetId(today)];
const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

document.querySelector("#todayDate").textContent = capitalize(dateFormatter.format(today));
document.querySelector("#todayTitle").textContent = todaySet.label;
document.querySelector("#todayShortLabel").textContent = todaySet.shortLabel;

const mysteryList = document.querySelector("#todayMysteryList");
mysteryList.innerHTML = "";
todaySet.mysteries.forEach((mystery) => {
  const item = document.createElement("li");
  item.textContent = mystery.title;
  mysteryList.appendChild(item);
});

showResumeState();

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function showResumeState() {
  let saved;
  try {
    saved = JSON.parse(window.localStorage.getItem(HOME_STORAGE_KEY));
  } catch {
    return;
  }

  if (!saved || saved.version !== 2 || saved.completedAt || saved.currentIndex <= 0) return;
  if (saved.setChoice === "auto" && saved.resolvedSetId !== rosaryData.getTodaySetId(today)) return;

  const banner = document.querySelector("#resumeBanner");
  const label = document.querySelector("#resumeLabel");
  const set = rosaryData.mysterySets[saved.resolvedSetId];
  const percent = saved.totalSteps > 1
    ? Math.round((saved.currentIndex / (saved.totalSteps - 1)) * 100)
    : 0;

  label.textContent = `${set?.shortLabel || "Rosario"} · ${percent}% completato`;
  banner.hidden = false;
}
