"use strict";

(() => {
  const backdrop = document.querySelector(".rosary-backdrop");
  const beadCounter = document.querySelector("#currentStepCount");
  if (!backdrop || !beadCounter) return;

  const SVG_NS = "http://www.w3.org/2000/svg";
  const TOTAL_BEADS = 61;
  const MAJOR_BEADS = new Set([0, 4, 5, 16, 27, 38, 49, 60]);
  let previousBeadCounter = beadCounter.textContent;
  let joltTimer = null;

  function svgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NS, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    return element;
  }

  function buildBackdropRosary() {
    const svg = svgElement("svg", {
      class: "rosary-backdrop-svg",
      viewBox: "0 0 1000 1600",
      preserveAspectRatio: "xMidYMid meet",
      focusable: "false",
      "aria-hidden": "true",
    });
    const group = svgElement("g", { class: "rosary-backdrop-group" });

    group.appendChild(svgElement("ellipse", {
      class: "rosary-backdrop-cord",
      cx: 500,
      cy: 675,
      rx: 382,
      ry: 526,
    }));

    for (let index = 0; index < TOTAL_BEADS; index += 1) {
      const angle = (-Math.PI / 2) + (index / TOTAL_BEADS) * Math.PI * 2;
      const cx = 500 + Math.cos(angle) * 382;
      const cy = 675 + Math.sin(angle) * 526;
      group.appendChild(svgElement("circle", {
        class: `rosary-backdrop-bead${MAJOR_BEADS.has(index) ? " major" : ""}`,
        cx: cx.toFixed(2),
        cy: cy.toFixed(2),
        r: MAJOR_BEADS.has(index) ? 17 : 10.5,
      }));
    }

    group.appendChild(svgElement("path", {
      class: "rosary-backdrop-tail",
      d: "M500 1202 C500 1280 500 1328 500 1398",
    }));

    [1252, 1304, 1356].forEach((cy, index) => {
      group.appendChild(svgElement("circle", {
        class: `rosary-backdrop-bead${index === 1 ? " major" : ""}`,
        cx: 500,
        cy,
        r: index === 1 ? 17 : 11,
      }));
    });

    group.appendChild(svgElement("ellipse", {
      class: "rosary-backdrop-medal",
      cx: 500,
      cy: 1412,
      rx: 24,
      ry: 31,
    }));

    const cross = svgElement("g", {
      class: "rosary-backdrop-cross",
      transform: "translate(500 1505)",
    });
    cross.appendChild(svgElement("rect", { x: -13, y: -64, width: 26, height: 126, rx: 8 }));
    cross.appendChild(svgElement("rect", { x: -43, y: -28, width: 86, height: 24, rx: 8 }));
    group.appendChild(cross);

    svg.appendChild(group);
    backdrop.replaceChildren(svg);
  }

  function triggerBackdropJolt() {
    backdrop.classList.remove("jolt");
    void backdrop.offsetWidth;
    backdrop.classList.add("jolt");
    window.clearTimeout(joltTimer);
    joltTimer = window.setTimeout(() => backdrop.classList.remove("jolt"), 300);
  }

  const counterObserver = new MutationObserver(() => {
    const nextBeadCounter = beadCounter.textContent;
    if (!nextBeadCounter || nextBeadCounter === previousBeadCounter) return;
    previousBeadCounter = nextBeadCounter;
    triggerBackdropJolt();
  });

  buildBackdropRosary();
  counterObserver.observe(beadCounter, { childList: true, characterData: true, subtree: true });
})();
