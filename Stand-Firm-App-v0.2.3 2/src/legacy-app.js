(() => {
  "use strict";
  const C = window.StandFirmContent;
  if (!C) throw new Error("Stand Firm content is unavailable.");
  const $ = (id) => document.getElementById(id);
  const storeKey = "stand-firm-prototype-v1";
  const initial = { theme: "dark", saved: [], completed: [], journal: [] };
  function loadState() {
    try {
      const data = JSON.parse(localStorage.getItem(storeKey) || "{}");
      return {
        ...initial,
        ...data,
        saved: Array.isArray(data.saved) ? data.saved : [],
        completed: Array.isArray(data.completed) ? data.completed : [],
        journal: Array.isArray(data.journal) ? data.journal : [],
      };
    } catch {
      return { ...initial };
    }
  }
  let state = loadState();
  function saveState() {
    try {
      localStorage.setItem(storeKey, JSON.stringify(state));
      return true;
    } catch {
      document.getElementById("saveStatus").textContent =
        "Could not save. Browser storage is unavailable or full.";
      return false;
    }
  }
  function localDate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(label, handler, cls = "secondary") {
    const node = el("button", cls, label);
    node.type = "button";
    node.addEventListener("click", handler);
    return node;
  }
  function clear(node) {
    node.replaceChildren();
  }
  function formatDate(value) {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  // Same single-page, persistent-navigation pattern as the family PWAs.
  const screens = [...document.querySelectorAll(".screen")];
  const nav = [...document.querySelectorAll(".nav-button")];
  const validScreens = new Set(screens.map((s) => s.dataset.screen));
  let currentScreen = "home";
  let breathTimer = null;
  let breathElapsed = 0;
  function showScreen(name, { updateHash = true, scroll = true } = {}) {
    if (!validScreens.has(name)) name = "mission";
    if (name !== "reset") stopBreathing();
    currentScreen = name;
    for (const screen of screens) {
      const active = screen.dataset.screen === name;
      screen.hidden = !active;
      screen.setAttribute("aria-hidden", String(!active));
    }
    for (const item of nav) {
      const active = item.dataset.go === name;
      item.classList.toggle("active", active);
      item.setAttribute("aria-current", active ? "page" : "false");
    }
    if (updateHash) history.pushState(null, "", `#${name}`);
    window.dispatchEvent(
      new CustomEvent("standfirm:navigate", { detail: name }),
    );
    if (scroll)
      window.scrollTo({
        top: 0,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
  }
  document
    .querySelectorAll("[data-go]")
    .forEach((node) =>
      node.addEventListener("click", () => showScreen(node.dataset.go)),
    );
  window.standFirmNavigate = showScreen;
  window.addEventListener("hashchange", () =>
    showScreen(location.hash.slice(1), { updateHash: false }),
  );
  showScreen(location.hash.slice(1), { updateHash: false, scroll: false });

  // Local appearance preference.
  function applyTheme() {
    document.body.classList.toggle("light", state.theme === "light");
    $("themeToggle").textContent = state.theme === "light" ? "☾" : "☼";
    $("themeToggle").setAttribute(
      "aria-label",
      state.theme === "light" ? "Switch to dark mode" : "Switch to light mode",
    );
    document.querySelector('meta[name="theme-color"]').content =
      state.theme === "light" ? "#f5f1e8" : "#101b1d";
  }
  $("themeToggle").addEventListener("click", () => {
    state.theme = state.theme === "light" ? "dark" : "light";
    saveState();
    applyTheme();
  });
  applyTheme();

  // Scripture is rendered exclusively from the curated library, never invented by the guide.
  function verseBlock(id) {
    const v = C.verses[id];
    const box = el("div", "verse");
    box.append(
      el("span", "", v.ref),
      el("blockquote", "", v.text),
      el("span", "translation", "WORLD ENGLISH BIBLE"),
    );
    return box;
  }
  function toggleSaved(id) {
    if (state.saved.includes(id))
      state.saved = state.saved.filter((x) => x !== id);
    else state.saved = [...state.saved, id];
    saveState();
    renderSaved();
    renderScripture();
    updateGuidanceSave();
  }
  function renderSaved() {
    const root = $("savedVerses");
    clear(root);
    const valid = state.saved.filter((id) => C.verses[id]);
    if (!valid.length) {
      root.append(
        el(
          "div",
          "saved-empty",
          "No saved passages yet. Save a verse to keep it close.",
        ),
      );
      return;
    }
    for (const id of valid) {
      const v = C.verses[id];
      const card = el("article", "card scripture-item");
      card.append(el("div", "eyebrow", v.ref), el("blockquote", "", v.text));
      card.append(button("Remove from saved", () => toggleSaved(id)));
      root.append(card);
    }
  }
  function renderScripture() {
    const root = $("scriptureList");
    clear(root);
    for (const [id, v] of Object.entries(C.verses)) {
      const card = el("article", "card scripture-item");
      card.append(el("div", "eyebrow", v.ref), el("blockquote", "", v.text));
      card.append(
        button(state.saved.includes(id) ? "Saved ✓" : "Save passage", () =>
          toggleSaved(id),
        ),
      );
      root.append(card);
    }
  }
  renderSaved();
  renderScripture();

  // Daily content rotates by local calendar day and keeps its completion state.
  const today = localDate();
  const dayNumber = Math.floor(
    (Date.UTC(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate(),
    ) -
      Date.UTC(new Date().getFullYear(), 0, 1)) /
      86400000,
  );
  const daily =
    C.daily[((dayNumber % C.daily.length) + C.daily.length) % C.daily.length];
  $("todayDate").textContent = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  $("dailyNumber").textContent =
    `DAY ${String(dayNumber + 1).padStart(2, "0")} · A NEW START`;
  $("dailyTitle").textContent = daily.title;
  $("dailyReflection").textContent = daily.reflection;
  $("dailyRef").textContent = C.verses[daily.verse].ref;
  $("dailyVerse").textContent = C.verses[daily.verse].text;
  $("dailyAction").textContent = daily.action;
  function updateDaily() {
    const done = state.completed.includes(today);
    $("completeDaily").textContent = done
      ? "Completed today ✓"
      : "Mark today's action complete";
    $("completeDaily").disabled = done;
  }
  $("completeDaily").addEventListener("click", () => {
    if (!state.completed.includes(today)) {
      state.completed.push(today);
      saveState();
      updateDaily();
    }
  });
  updateDaily();

  // Situation selection and its matching Scripture, action, and prayer.
  let selectedSituation = null;
  function updateGuidanceSave() {
    if (!selectedSituation) return;
    $("saveGuidance").textContent = state.saved.includes(
      selectedSituation.verse,
    )
      ? "Passage saved ✓"
      : "Save this passage";
  }
  function selectSituation(id, { navigate = false } = {}) {
    const item = C.situations.find((s) => s.id === id);
    if (!item) return;
    selectedSituation = item;
    for (const node of document.querySelectorAll(".situation"))
      node.setAttribute("aria-pressed", String(node.dataset.situation === id));
    $("guidancePanel").hidden = false;
    $("guidanceLabel").textContent = item.label;
    $("guidanceTitle").textContent = item.title;
    $("guidanceMessage").textContent = item.message;
    $("guidanceRef").textContent = C.verses[item.verse].ref;
    $("guidanceVerse").textContent = C.verses[item.verse].text;
    $("guidanceAction").textContent = item.action;
    $("guidancePrayer").textContent = item.prayer;
    const details = $("guidancePanel").querySelector("details");
    details.open = false;
    updateGuidanceSave();
    if (navigate) showScreen("facing");
    $("guidancePanel").scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }
  for (const item of C.situations) {
    const choice = el("button", "situation");
    choice.type = "button";
    choice.dataset.situation = item.id;
    choice.setAttribute("aria-pressed", "false");
    choice.append(el("strong", "", item.label), el("span", "", item.hint));
    choice.addEventListener("click", () => selectSituation(item.id));
    $("situationGrid").append(choice);
  }
  $("saveGuidance").addEventListener("click", () => {
    if (selectedSituation && !state.saved.includes(selectedSituation.verse))
      toggleSaved(selectedSituation.verse);
  });
  $("guideFromSituation").addEventListener("click", () => {
    if (!selectedSituation) return;
    $("guideInput").value = "";
    $("guideIntro").textContent =
      `You selected ${selectedSituation.label.toLowerCase()}. You can write more about it, or use the curated guidance below.`;
    renderGuideResult(selectedSituation);
    showScreen("guide");
  });

  // Offline guide: deterministic topic routing, not a model or an imitation of one.
  const topicPatterns = [
    [
      "marriage",
      /\b(wife|husband|spouse|marriage|married|girlfriend|boyfriend|partner|relationship|argu(?:e|ing|ment)|divorce)\b/i,
    ],
    [
      "fatherhood",
      /\b(kids?|children|child|son|daughter|father|parenting|parenthood|teenager)\b/i,
    ],
    [
      "anger",
      /\b(angry|anger|furious|rage|frustrat|temper|yell|losing control)\b/i,
    ],
    [
      "grief",
      /\b(grief|griev|died|death|funeral|bereav|lost someone|miss my)\b/i,
    ],
    [
      "work",
      /\b(money|financial|finances|debt|bills|job|work|career|unemploy|rent)\b/i,
    ],
    [
      "discipline",
      /\b(discipline|fitness|gym|exercise|workout|routine|habit|motivation|procrastinat)\b/i,
    ],
    ["faith", /\b(faith|god|prayer|doubt|church|spiritual|believe)\b/i],
    ["purpose", /\b(purpose|direction|stuck|meaning|future|lost my way)\b/i],
    [
      "forgiveness",
      /\b(forgive|forgiveness|apolog|mistake|regret|guilt|ashamed)\b/i,
    ],
    [
      "decision",
      /\b(decision|decide|choice|choose|uncertain|what should i do)\b/i,
    ],
    ["loneliness", /\b(lonely|alone|isolat|no friends|depressed|discourag)\b/i],
    [
      "stress",
      /\b(stress|overwhelm|anxious|anxiety|worried|worry|pressure|exhaust|tired)\b/i,
    ],
  ];
  const crisisPattern =
    /\b(kill myself|end my life|suicid(?:e|al)|self[- ]harm|hurt myself|want to die|don't want to live|do not want to live|kill (?:my wife|my husband|my child|my kids|someone|him|her|them)|hurt (?:my wife|my husband|my child|my kids|someone)|going to hurt someone)\b/i;
  function renderGuideResult(item) {
    const root = $("guideResult");
    clear(root);
    root.hidden = false;
    root.append(
      el("div", "eyebrow", "CURATED GUIDANCE · NOT LIVE AI"),
      el("h3", "", item.title),
      el("p", "", item.message),
      verseBlock(item.verse),
      el("div", "eyebrow", "YOUR NEXT STEP"),
      el("p", "", item.action),
    );
    root.append(
      button("Open the full guidance", () =>
        selectSituation(item.id, { navigate: true }),
      ),
    );
  }
  $("guideSubmit").addEventListener("click", () => {
    const input = $("guideInput").value.trim();
    const root = $("guideResult");
    if (!input) {
      clear(root);
      root.hidden = false;
      root.append(
        el(
          "p",
          "",
          "Write a little about what is weighing on you, or choose a situation from the Facing section.",
        ),
      );
      return;
    }
    if (crisisPattern.test(input)) {
      clear(root);
      root.hidden = false;
      root.append(
        el("div", "eyebrow", "YOUR SAFETY COMES FIRST"),
        el("h3", "", "Get real-world support now."),
        el(
          "p",
          "",
          "If you might act on thoughts of harming yourself or someone else, put distance between yourself and anything you could use to cause harm, and contact someone who can help you stay safe. If there is immediate danger, call emergency services. In the U.S., call or text 988 for crisis support, or call 911 for an immediate emergency. You do not have to handle this moment alone.",
        ),
      );
      return;
    }
    const matched = topicPatterns.find(([id, pattern]) => pattern.test(input));
    const item = C.situations.find(
      (s) => s.id === (matched ? matched[0] : "stress"),
    );
    if (!matched) {
      clear(root);
      root.hidden = false;
      root.append(
        el("div", "eyebrow", "OFFLINE GUIDE"),
        el("h3", "", "Start with what you can name."),
        el(
          "p",
          "",
          "I cannot interpret the details of your situation like a live AI companion. Which area is closest: marriage, fatherhood, anger, stress, grief, purpose, work, discipline, or faith? You can choose a topic below for a concrete next step.",
        ),
      );
      root.append(button("Choose a situation", () => showScreen("facing")));
      return;
    }
    renderGuideResult(item);
  });
  $("guideClear").addEventListener("click", () => {
    $("guideInput").value = "";
    clear($("guideResult"));
    $("guideResult").hidden = true;
    $("guideIntro").textContent =
      "Tell me what is weighing on you, or choose a topic. We can identify what matters and one step you can take.";
  });

  // Journal stays local to this browser. No account, analytics, or network transmission.
  function renderJournal() {
    const root = $("journalEntries");
    clear(root);
    for (const entry of state.journal.slice().reverse()) {
      const card = el("article", "journal-item");
      card.append(
        el("time", "", formatDate(entry.date)),
        el("p", "", entry.text),
      );
      card.append(
        button(
          "Delete this entry",
          () => {
            if (
              !confirm(
                "Delete this journal entry from this browser? This cannot be undone.",
              )
            )
              return;
            state.journal = state.journal.filter((e) => e.id !== entry.id);
            saveState();
            renderJournal();
            $("journalStatus").textContent = "Entry deleted.";
          },
          "",
        ),
      );
      root.append(card);
    }
  }
  $("journalSave").addEventListener("click", () => {
    const text = $("journalInput").value.trim();
    if (!text) {
      $("journalStatus").textContent = "Write a reflection before saving.";
      return;
    }
    const entry = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2),
      date: new Date().toISOString(),
      text,
    };
    state.journal = [...state.journal, entry].slice(-100);
    if (saveState()) {
      $("journalInput").value = "";
      $("journalStatus").textContent = "Saved on this device.";
      renderJournal();
    } else {
      state.journal = state.journal.filter((e) => e.id !== entry.id);
      $("journalStatus").textContent =
        "Unable to save. Browser storage may be unavailable or full. Your draft has been kept.";
    }
  });
  $("journalClear").addEventListener("click", () => {
    if ($("journalInput").value && !confirm("Clear the unsaved draft?")) return;
    $("journalInput").value = "";
    $("journalStatus").textContent = "Draft cleared.";
  });
  renderJournal();

  // Original demo audio. No autoplay, no external media streams, and no hidden paid calls.
  const audio = $("soundtrack");
  let selectedTrack = null;
  let audioVersion = 0;
  const tracks = {
    focus: {
      title: "Focus · Steady Attention (demo)",
      src: "assets/focus-demo.wav",
    },
    power: { title: "Power · Rise with Resolve", src: "assets/original-3.wav" },
    dusk: { title: "Dusk Hush · Breathing Exercise", src: "assets/dusk-hush.mp3" },
  };
  function updateAudioUI() {
    const playing = !audio.paused && !audio.ended;
    $("musicToggle").textContent = playing ? "Ⅱ" : "▶";
    $("musicToggle").setAttribute(
      "aria-label",
      playing ? "Pause music" : "Play music",
    );
    $("musicStatus").textContent = playing
      ? "Playing"
      : audio.currentTime > 0
        ? "Paused"
        : "Ready to play";
    for (const node of document.querySelectorAll(".audio-choice"))
      node.setAttribute(
        "aria-pressed",
        String(node.dataset.track === selectedTrack),
      );
  }
  async function startTrack(name) {
    if (!tracks[name]) return;
    const version = ++audioVersion;
    const changed = selectedTrack !== name;
    if (changed) {
      audio.pause();
      selectedTrack = name;
      audio.src = tracks[name].src;
      audio.load();
    }
    $("musicDock").hidden = false;
    $("musicTitle").textContent = tracks[name].title;
    try {
      await audio.play();
      if (version !== audioVersion) return;
      updateAudioUI();
    } catch {
      if (version !== audioVersion) return;
      $("musicStatus").textContent =
        "Press play to start. Audio may be unavailable.";
      updateAudioUI();
    }
  }
  document.querySelectorAll(".audio-choice").forEach((node) =>
    node.addEventListener("click", () => {
      if (selectedTrack === node.dataset.track && !audio.paused) {
        audio.pause();
        updateAudioUI();
      } else startTrack(node.dataset.track);
    }),
  );
  $("musicToggle").addEventListener("click", () => {
    if (audio.paused) {
      if (selectedTrack) startTrack(selectedTrack);
    } else audio.pause();
    updateAudioUI();
  });
  $("musicRestart").addEventListener("click", () => {
    if (!selectedTrack) return;
    audio.currentTime = 0;
    startTrack(selectedTrack);
  });
  $("musicClose").addEventListener("click", () => {
    ++audioVersion;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    selectedTrack = null;
    $("musicDock").hidden = true;
    updateAudioUI();
  });
  ["play", "pause", "ended", "loadedmetadata"].forEach((event) =>
    audio.addEventListener(event, updateAudioUI),
  );
  audio.addEventListener("error", () => {
    if (selectedTrack)
      $("musicStatus").textContent =
        "Track unavailable. Add the audio file to the media folder.";
  });

  // Optional gentle breathing, four-second inhale and six-second exhale, with no holding.
  function formatClock(seconds) {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }
  function updateBreathing() {
    const remaining = 180 - breathElapsed;
    if (remaining <= 0) {
      stopBreathing(true);
      return;
    }
    const phase = breathElapsed % 10;
    $("breathText").textContent = phase < 4 ? "Breathe in" : "Breathe out";
    $("breathCountdown").textContent = `${formatClock(remaining)} remaining`;
    $("breathStatus").textContent =
      "Follow the rhythm only if it feels comfortable. Breathe naturally at any time.";
  }
  function stopBreathing(completed = false) {
    if (breathTimer !== null) {
      clearInterval(breathTimer);
      breathTimer = null;
    }
    $("resetVisual").classList.remove("running");
    $("breathToggle").textContent = "Start breathing guide";
    $("breathText").textContent = completed ? "Well done." : "Be still.";
    $("breathCountdown").textContent = completed
      ? "Three minutes complete"
      : "At your own pace";
    $("breathStatus").textContent = completed
      ? "Your reset is complete. Take your next step when you are ready."
      : "Ready when you are.";
    breathElapsed = 0;
  }
  $("breathToggle").addEventListener("click", () => {
    if (breathTimer !== null) {
      stopBreathing();
      return;
    }
    breathElapsed = 0;
    updateBreathing();
    startTrack("dusk");
    $("resetVisual").classList.add("running");
    $("breathToggle").textContent = "Pause breathing guide";
    breathTimer = setInterval(() => {
      breathElapsed++;
      updateBreathing();
    }, 1000);
  });
  $("breathReset").addEventListener("click", () => stopBreathing());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopBreathing();
  });

  // Cache the public static shell only; private journal data never enters the service worker cache.
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", () => Promise.resolve().catch(() => {}));
  }
})();
