/* Presentation only. Existing storage and feature controllers remain owners. */
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const routes = {
    timer: document.querySelector("a.timer-jump"),
    journal: document.querySelector("a.journal-jump"),
    links: document.querySelector("a.links-jump"),
  };
  const closeViews = () => {
    for (const id of [
      "timer-exit-reading",
      "journal-exit-reading",
      "links-exit-reading",
    ])
      document.getElementById(id).click();
  };
  const select = (view) => {
    body.dataset.calmView = view;
    Object.entries(routes).forEach(([name, a]) => {
      a.hidden = false;
      if (view === name) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    document
      .getElementById("calm-space")
      .setAttribute("aria-pressed", String(view === "space"));
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  Object.entries(routes).forEach(([view, a]) =>
    a.addEventListener("click", () => {
      select(view);
      const headings = {
        timer: "meditation-title",
        journal: "journaling-widget-title",
        links: "quick-links-title",
      };
      document.getElementById(headings[view]).focus({ preventScroll: true });
    }),
  );
  for (const id of [
    "timer-exit-reading",
    "journal-exit-reading",
    "links-exit-reading",
  ])
    document.getElementById(id).addEventListener("click", () => select("home"));
  document.getElementById("calm-home").addEventListener("click", () => {
    closeViews();
    select("home");
    document.getElementById("calm-home").focus();
  });
  document.getElementById("calm-space").addEventListener("click", () => {
    closeViews();
    select("space");
    document.querySelector("#space-settings h2").setAttribute("tabindex", "-1");
    document.querySelector("#space-settings h2").focus();
  });
  document
    .getElementById("calm-begin")
    .addEventListener("click", () => routes.timer.click());
  document.getElementById("calm-write").addEventListener("click", () => {
    routes.journal.click();
    document.getElementById("journal-text-input").focus();
  });
  // Keep all legacy tools reachable, outside the quiet arrival and active task.
  const settings = document.getElementById("space-settings");
  const groups = [
    ["Atmosphere", document.getElementById("theme-customization-panel")],
    ["A daily thought", document.getElementById("daily-inspiration-widget")],
    ["Time & date", document.getElementById("time-date-widget")],
    ["Weather", document.getElementById("weather-widget")],
  ];
  groups.forEach(([title, element]) => {
    const d = document.createElement("details");
    d.className = "space-disclosure";
    const summary = document.createElement("summary");
    summary.textContent = title;
    d.append(summary, element);
    settings.append(d);
  });
  const extra = document.createElement("details");
  extra.className = "space-disclosure";
  extra.innerHTML =
    "<summary>Legacy scene & audio tools</summary><p>Original scene controls are kept here. The bundled gallery uses placeholder images; its labels are not verified photographs. The ambient preview is silent, and bell recordings are unavailable.</p>";
  extra.append(
    document.getElementById("gallery-controls"),
    document.getElementById("main-audio-player-container"),
  );
  settings.append(extra);
  // Expose unavailable sound files honestly without changing saved timer state.
  const legacyLayout = document.createElement("p");
  legacyLayout.className = "space-intro";
  legacyLayout.textContent =
    "One quiet layout now replaces the old dashboard grids. Your earlier layout preference is kept, not overwritten.";
  document.getElementById("layout-selection-controls").before(legacyLayout);
  document
    .querySelectorAll("#bell-sound-select option:not([value=silent])")
    .forEach((e) => {
      e.disabled = true;
      e.textContent += " (unavailable)";
    });
  select("home");
});
// Existing link editor: keep keyboard focus inside the editor while it is open.
document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("quick-link-modal"),
    content = overlay.querySelector(".modal-content");
  content.setAttribute("role", "dialog");
  content.setAttribute("aria-modal", "true");
  content.setAttribute("aria-labelledby", "quick-link-modal-title");
  document
    .getElementById("close-modal-btn")
    .setAttribute("aria-label", "Close link editor");
  let previous;
  new MutationObserver(() => {
    if (!overlay.classList.contains("hidden")) {
      previous = document.activeElement;
      document.getElementById("link-name").focus();
    } else if (previous?.isConnected) {
      previous.focus();
    }
  }).observe(overlay, { attributes: true, attributeFilter: ["class"] });
  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      document.getElementById("cancel-link-btn").click();
    }
    if (e.key === "Tab") {
      const controls = [
        ...content.querySelectorAll("button,input:not([type=hidden])"),
      ].filter((e) => !e.disabled && e.checkVisibility());
      const first = controls[0],
        last = controls.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
});
