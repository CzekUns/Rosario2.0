"use strict";

(() => {
  const ring = document.querySelector("#rosaryRing");
  const stage = document.querySelector(".bead-stage");
  if (!ring || !stage) return;

  const HAPTIC_THRESHOLD = 34;
  let hapticGesture = null;

  stage.classList.add("grip-window");

  function isActiveGripTarget(event) {
    return stage.classList.contains("can-grip")
      && Boolean(event.target.closest(".bead-row.active .bead"));
  }

  function beginHapticGesture(event) {
    if (!isActiveGripTarget(event)) return;
    hapticGesture = {
      pointerId: event.pointerId,
      startY: event.clientY,
      thresholdSignaled: false,
    };
  }

  function updateHapticGesture(event) {
    if (!hapticGesture || event.pointerId !== hapticGesture.pointerId) return;
    const upwardDistance = hapticGesture.startY - event.clientY;
    if (upwardDistance < HAPTIC_THRESHOLD || hapticGesture.thresholdSignaled) return;

    hapticGesture.thresholdSignaled = true;
    if ("vibrate" in navigator) navigator.vibrate(7);
  }

  function endHapticGesture(event) {
    if (!hapticGesture || event.pointerId !== hapticGesture.pointerId) return;
    hapticGesture = null;
  }

  ring.addEventListener("pointerdown", beginHapticGesture);
  ring.addEventListener("pointermove", updateHapticGesture);
  ring.addEventListener("pointerup", endHapticGesture);
  ring.addEventListener("pointercancel", endHapticGesture);
})();
