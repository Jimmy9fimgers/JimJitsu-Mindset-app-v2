import {
  KEY,
  LEGACY,
  dateKey,
  addDays,
  weekStart,
  missionFor,
  load,
  transact,
  ensureDay,
  carry,
  completeLesson,
  metrics,
  reviewPrompts,
  reportText,
  migrateLegacy,
  validateState,
} from "./core.js";
const $ = (id) => document.getElementById(id),
  esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const field = (id, label, value = "", type = "textarea") =>
  `<label for="${id}">${esc(label)}</label>${type === "textarea" ? `<textarea id="${id}" maxlength="12000">${esc(value)}</textarea>` : `<input id="${id}" type="${type}" value="${esc(value)}" ${type === "text" ? 'maxlength="500"' : ""}>`}`;
const btn = (text, id, primary = false) =>
  `<button type="button" class="${primary ? "primary" : "secondary"}" id="${id}">${esc(text)}</button>`;
const heading = (tag, title, copy = "") =>
  `<div class="eyebrow">${esc(tag)}</div><h2>${esc(title)}</h2>${copy ? `<p class="muted">${esc(copy)}</p>` : ""}`;
const method = `<div class="method" aria-label="Jimjitsu Mindset method">${["Recognize", "Separate", "Choose", "Act", "Review"].map((x, i) => `<span>${i + 1} · ${x}</span>`).join("")}</div>`;
const on = (id, fn, event = "click") => $(id)?.addEventListener(event, fn);
let state,
  missions,
  programs,
  verses,
  scripture,
  active = "mission",
  selectedProgram = null,
  selectedLesson = null,
  missionDate = dateKey(),
  reviewWeek = weekStart(),
  timer;
function status(text) {
  $("saveStatus").textContent = text;
  clearTimeout(timer);
  timer = setTimeout(() => ($("saveStatus").textContent = ""), 7000);
}
function save(fn, message = "Saved on this device.") {
  try {
    state = transact(state, localStorage, fn);
    if (message) status(message);
    return true;
  } catch (e) {
    status("Could not save. Your draft is still here. " + e.message);
    return false;
  }
}
function download(name, text, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function go(name) {
  window.standFirmNavigate(name);
}
function verse(id) {
  const v = verses[id];
  return v
    ? `<div class="verse"><span>${esc(v.ref)}</span><blockquote>${esc(v.text)}</blockquote><span class="translation">World English Bible · Scripture</span><p class="small"><a href="${esc(v.source)}" target="_blank" rel="noopener noreferrer">Read chapter at eBible.org</a></p></div>`
    : '<p role="alert">Passage unavailable. No quotation substituted.</p>';
}
const formDrafts = new Map();
function root(name, html) {
  const node = $(name + "Screen"),
    keep = ["mission", "review", "training", "personal", "body"].includes(name);
  if (keep && node.dataset.record) {
    const fields = {};
    node
      .querySelectorAll("textarea,input[type=text],select")
      .forEach((n) => (fields[n.id] = n.value));
    formDrafts.set(node.dataset.record, fields);
  }
  const record =
    name +
    ":" +
    (name === "mission"
      ? missionDate
      : name === "review"
        ? reviewWeek
        : name === "training"
          ? selectedLesson
          : "main");
  node.innerHTML = html;
  node.dataset.record = record;
  if (keep)
    for (const [id, value] of Object.entries(formDrafts.get(record) || {})) {
      const field = document.getElementById(id);
      if (field && node.contains(field)) field.value = value;
    }
}
async function init() {
  try {
    const content = await Promise.all(
      ["missions", "programs", "scripture"].map(async (n) => {
        const r = await fetch(`content/${n}.json`);
        if (!r.ok) throw Error(`${n} could not load`);
        return r.json();
      }),
    );
    [missions, programs, scripture] = content;
    verses = Object.fromEntries(scripture.map((v) => [v.id, v]));
    state = load(localStorage);
    window.addEventListener("standfirm:navigate", (e) => {
      active = e.detail;
      render();
    });
    active = location.hash.slice(1) || "mission";
    enhanceLegacy();
    render();
    if (
      "serviceWorker" in navigator &&
      (location.protocol === "https:" ||
        ["localhost", "127.0.0.1"].includes(location.hostname))
    )
      navigator.serviceWorker
        .register("sw.js")
        .catch(() =>
          status(
            "Offline installation could not finish. The app is available while connected.",
          ),
        );
    // Calendar rollover never discards a form being edited. Date choice remains explicit until navigation.
    setInterval(checkReminder, 30000);
    checkReminder();
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && missionDate !== dateKey())
        status(
          "A new local day is available. Choose Today in Daily Mission when you are ready.",
        );
    });
    window.addEventListener("storage", (e) => {
      if (e.key === KEY)
        status(
          "Another tab changed your data. Reload before editing further to avoid overwriting it.",
        );
    });
  } catch (e) {
    for (const name of ["mission", "training", "review", "more", "settings"])
      root(
        name,
        heading("Data preserved", "The workspace could not open.") +
          `<p role="alert">${esc(e.message)}</p><p>Your stored data has not been cleared. Download it before troubleshooting.</p>${btn("Download stored data", name + "Recovery")}${btn("Try again", name + "Retry")}`,
      );
    for (const name of ["mission", "training", "review", "more", "settings"]) {
      on(name + "Recovery", () => {
        let raw = "";
        try {
          raw = localStorage.getItem(KEY) || localStorage.getItem(LEGACY) || "";
        } catch {}
        download("stand-firm-recovery.txt", raw);
      });
      on(name + "Retry", () => location.reload());
    }
  }
}
function render() {
  if (!state) return;
  (
    ({
      mission: renderMission,
      training: renderTraining,
      review: renderReview,
      personal: renderPersonal,
      journal: renderJournal,
      library: renderLibrary,
      accountability: renderAccountability,
      body: renderBody,
      settings: renderSettings,
      more: renderMore,
    })[active] || (() => {})
  )();
}
function checkin(which, data) {
  return `<details class="card" ${which === "morning" ? "open" : ""}><summary><strong>${which === "morning" ? "Morning check-in" : "Evening review"}</strong> · ${data.savedAt ? "Saved" : "Optional"}</summary><p class="small">These optional ratings describe how you feel; they are not diagnoses.</p><div class="rating-grid">${["mood", "energy", "stress"].map((k) => `<div><label for="${which}-${k}">${k[0].toUpperCase() + k.slice(1)}</label><select id="${which}-${k}"><option value="">Not recorded</option>${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${String(data[k]) === String(n) ? "selected" : ""}>${n}${n === 1 ? " · Low" : n === 5 ? " · High" : ""}</option>`).join("")}</select></div>`).join("")}</div>${field(which + "-reflection", which === "morning" ? "Private reflection: What am I bringing into today?" : "Private reflection: What happened, what did I learn, and what needs care?", data.reflection)}${btn("Save " + (which === "morning" ? "morning check-in" : "evening review"), which + "-save", true)}</details>`;
}
function renderMission() {
  const key = missionDate;
  if (!state.days[key] && !save((s) => ensureDay(s, key, missions), "")) return;
  const day = state.days[key],
    m =
      missions.find((m) => m.id === day.missionId) || missionFor(key, missions),
    done = day.objectives.filter((o) => o.status === "done").length;
  root(
    "mission",
    `<div class="actions"><div>${field("mission-date", "Local calendar day", key, "date")}</div>${btn("Today", "mission-today")}</div><div class="mission-banner"><img class="mission-banner-logo" src="assets/jimjitsu-brand.jpg" alt="Jimjitsu Mindset. One faithful step at a time."><div class="mission-copy"><div class="eyebrow">DAILY MISSION · ${esc(key)}</div><h1>${esc(m.title)}</h1><p>${esc(m.briefing)}</p><div class="actions">${btn("Set my intention", "intention-jump", true)}${btn("Continue training", "training-jump")}</div></div></div>${method}<div class="release-grid"><article class="card"><div class="eyebrow">Scripture for today</div>${verse(m.scriptureId)}</article><article class="card"><div class="eyebrow">Original mindset lesson</div><p>${esc(m.teaching)}</p><h3>Consider this</h3><p>${esc(m.reflection)}</p></article></div><article class="card"><h3>My intention</h3>${field("intention", "How do I want to meet this day?", day.intention)}${btn("Save intention", "intention-save", true)}</article><article class="card"><div class="eyebrow">Commitments for today</div><h3>${done} of ${day.objectives.length} objectives complete</h3><p class="small">Choose realistic actions. A skip or a missed day does not erase your progress.</p>${day.objectives.map((o, i) => `<div class="objective"><span class="badge">${esc(o.category)}</span><span class="badge">${esc(o.status)}</span>${o.carriedFrom ? `<small>Carried from ${esc(o.carriedFrom.date)}</small>` : ""}${field("objective-" + i, "Objective " + (i + 1), o.text)}<div class="actions">${btn("Save edit", "edit-" + i)}${o.status !== "carried" ? btn(o.status === "done" ? "Mark incomplete" : "Complete", "complete-" + i, o.status !== "done") + btn(o.status === "skipped" ? "Restore" : "Skip", "skip-" + i) : ""}${o.carryAllowed && ["pending", "skipped"].includes(o.status) ? btn("Carry to tomorrow", "carry-" + i) : ""}</div>${o.carriedTo ? `<p class="small">Moved to ${esc(o.carriedTo)}; counted as carried here, not completed.</p>` : ""}</div>`).join("")}</article>${checkin("morning", day.morning)}${checkin("evening", day.evening)}`,
  );
  on(
    "mission-date",
    (e) => {
      if (e.target.value) {
        missionDate = e.target.value;
        renderMission();
      }
    },
    "change",
  );
  on("mission-today", () => {
    missionDate = dateKey();
    renderMission();
  });
  on("intention-jump", () => $("intention").focus());
  on("training-jump", () => go("training"));
  on("intention-save", () =>
    save((s) => (s.days[key].intention = $("intention").value)),
  );
  day.objectives.forEach((o, i) => {
    on("edit-" + i, () => {
      const text = $("objective-" + i).value.trim();
      if (!text) return status("Give the objective a clear action.");
      save((s) => (s.days[key].objectives[i].text = text));
    });
    on("complete-" + i, () => {
      if (
        save((s) => {
          s.days[key].objectives[i].status =
            o.status === "done" ? "pending" : "done";
          s.days[key].objectives[i].text =
            $("objective-" + i).value.trim() || o.text;
        })
      )
        renderMission();
    });
    on("skip-" + i, () => {
      if (
        save(
          (s) =>
            (s.days[key].objectives[i].status =
              o.status === "skipped" ? "pending" : "skipped"),
        )
      )
        renderMission();
    });
    on("carry-" + i, () => {
      if (
        save(
          (s) => {
            s.days[key].objectives[i].text =
              $("objective-" + i).value.trim() || o.text;
            carry(s, key, o.id, missions);
          },
          "Carried to " + addDays(key, 1) + ".",
        )
      )
        renderMission();
    });
  });
  for (const which of ["morning", "evening"])
    on(which + "-save", () => {
      const data = {
        reflection: $(which + "-reflection").value,
        savedAt: new Date().toISOString(),
      };
      for (const k of ["mood", "energy", "stress"])
        data[k] = $(which + "-" + k).value
          ? Number($(which + "-" + k).value)
          : null;
      if (save((s) => (s.days[key][which] = data))) renderMission();
    });
}
function renderTraining() {
  const p = programs.find((p) => p.id === selectedProgram);
  if (!p) {
    root(
      "training",
      heading(
        "Training Ground",
        "Practice for real life.",
        "Two complete programs. Learn at your pace, repeat lessons, and keep more than one program in progress.",
      ) +
        method +
        `<div class="release-grid">${programs
          .map((p) => {
            const n = Object.keys(state.programs[p.id]?.completed || {}).length;
            return `<article class="card"><span class="badge">${p.status === "available" ? `${p.durationDays} lessons · Available` : "Draft · Not yet available"}</span><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>${p.status === "available" ? `<p>${n} of ${p.durationDays} lessons completed</p><progress max="${p.durationDays}" value="${n}" aria-label="${esc(p.title)} progress"></progress>${btn(n || state.programs[p.id] ? "Resume program" : "Explore program", "program-" + p.id, true)}` : `<p class="small">Planned ${p.durationDays}-day program. Lessons are still being authored.</p>`}</article>`;
          })
          .join("")}</div>`,
    );
    for (const p of programs)
      on("program-" + p.id, () => {
        selectedProgram = p.id;
        selectedLesson = state.programs[p.id]?.lastLesson || null;
        renderTraining();
      });
    return;
  }
  const l = p.lessons.find((l) => l.id === selectedLesson),
    progress = state.programs[p.id] || { completed: {}, notes: {} };
  if (!l) {
    root(
      "training",
      btn("All programs", "all-programs") +
        heading(`${p.durationDays}-day program`, p.title, p.description) +
        `<p>${Object.keys(progress.completed).length} of ${p.durationDays} completed. Your place is saved independently for each program.</p><div class="lesson-list">${p.lessons.map((l, i) => btn(`${i + 1}. ${l.title}${progress.completed[l.id] ? " · Completed" : ""}`, "lesson-" + l.id)).join("")}</div>`,
    );
    on("all-programs", () => {
      selectedProgram = null;
      renderTraining();
    });
    for (const l of p.lessons) on("lesson-" + l.id, () => openLesson(p, l));
    return;
  }
  root(
    "training",
    `<div class="reader">${btn("Program overview", "overview")}${heading(`${p.title} · Lesson ${p.lessons.indexOf(l) + 1} · About ${l.minutes} minutes`, l.title)}${method}${verse(l.scriptureId)}<div class="teaching"><div class="eyebrow">Original teaching · Application, not Scripture</div>${l.teaching.map((x) => `<p>${esc(x)}</p>`).join("")}</div><article class="card"><h3>Recognize & reflect</h3><p>${esc(l.reflection)}</p>${field("lesson-note", "Private lesson reflection", progress.notes?.[l.id])}${btn("Save reflection", "lesson-save")}</article><article class="card"><h3>Practice the method</h3><p>${esc(l.exercise)}</p><div class="eyebrow">Your concrete action</div><p>${esc(l.action)}</p><details><summary>Optional prayer</summary><p>${esc(l.prayer)}</p></details></article><p>${progress.completed[l.id] ? "First completed " + esc(progress.completed[l.id]) + ". You can read and practice this lesson again." : "Complete when you have read the lesson and tried its exercise."}</p><div class="actions">${btn(progress.completed[l.id] ? "Save repeat reflection" : "Complete lesson", "lesson-complete", true)}${p.lessons.indexOf(l) < p.lessons.length - 1 ? btn("Next lesson", "lesson-next") : btn("Review my week", "lesson-review")}</div></div>`,
  );
  on("overview", () => {
    if (
      save((s) => {
        const q = (s.programs[p.id] ??= {
          completed: {},
          notes: {},
          lastLesson: l.id,
        });
        q.notes[l.id] = $("lesson-note").value;
      }, "")
    ) {
      selectedLesson = null;
      renderTraining();
    }
  });
  const note = (s) => {
    const q = (s.programs[p.id] ??= {
      completed: {},
      notes: {},
      lastLesson: l.id,
    });
    q.notes[l.id] = $("lesson-note").value;
    q.lastLesson = l.id;
  };
  on("lesson-save", () => save(note));
  on("lesson-complete", () => {
    if (
      save((s) => {
        note(s);
        completeLesson(s, p, l);
      })
    )
      renderTraining();
  });
  on("lesson-next", () => {
    if (save(note, "")) openLesson(p, p.lessons[p.lessons.indexOf(l) + 1]);
  });
  on("lesson-review", () => go("review"));
}
function openLesson(p, l) {
  if (
    save((s) => {
      const q = (s.programs[p.id] ??= { completed: {}, notes: {} });
      q.lastLesson = l.id;
    }, "")
  ) {
    selectedLesson = l.id;
    renderTraining();
    window.scrollTo(0, 0);
  }
}
function renderReview() {
  const start = reviewWeek,
    m = metrics(state, start),
    r = state.reviews[start] || {};
  root(
    "review",
    heading(
      "After-Action Report",
      "Look back. Choose what comes next.",
      "A factual record of practice, with room for unfinished work. Weeks run Monday through Sunday in your local calendar.",
    ) +
      field("review-date", "Week containing", start, "date") +
      `<p>${start} through ${addDays(start, 6)}</p><div class="stat-grid">${[
        [m.completed, "Daily objectives complete"],
        [m.commitments, "Private commitments complete"],
        [m.lessons, "Lessons first completed"],
        [m.activeDays + " / 7", "Days with recorded practice"],
      ]
        .map(
          ([n, t]) =>
            `<div class="stat"><strong>${n}</strong><span>${t}</span></div>`,
        )
        .join(
          "",
        )}</div><div class="card"><h3>Consistency over this week</h3><div class="week-bars">${m.days.map((d) => `<div class="week-day"><span>${new Date(d.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" })}</span><strong>${d.done}</strong><span>objectives<br>${d.checkIn ? "Check-in saved" : "No check-in"}</span></div>`).join("")}</div><p class="small">${m.total} daily objectives recorded, ${m.days.reduce((n, d) => n + d.skipped, 0)} skipped, ${m.days.reduce((n, d) => n + d.carried, 0)} carried forward. Empty days mean no recorded activity, not failure. A day counts as practice when it has a completed daily objective, check-in, or first lesson completion.</p></div><article class="card"><h3>Your review</h3>${reviewPrompts.map((q, i) => field("review-" + i, q, r.answers?.[i])).join("")}${field("review-focus", "One focus for next week", r.focus, "text")}${field("review-plan", "My action plan: what, when, and support needed", r.plan)}<div class="actions">${btn("Save weekly review", "review-save", true)}${btn("Export report", "review-export")}${btn("Print report", "review-print")}</div></article><details class="card"><summary>Your reflections from this week</summary>${m.days
        .map(({ date }) => {
          const d = state.days[date];
          return `<h3>${date}</h3><p>Morning: ${esc(d?.morning.reflection || "Not recorded")}</p><p>Evening: ${esc(d?.evening.reflection || "Not recorded")}</p>`;
        })
        .join("")}</details><article class="card"><h3>Review history</h3>${
        Object.keys(state.reviews)
          .sort()
          .reverse()
          .map((k) => btn("Week of " + k, "history-" + k))
          .join("") || "<p>No saved weekly reports yet.</p>"
      }</article>`,
  );
  on(
    "review-date",
    (e) => {
      if (e.target.value) {
        reviewWeek = weekStart(e.target.value);
        renderReview();
      }
    },
    "change",
  );
  const persist = () =>
    save(
      (s) =>
        (s.reviews[start] = {
          schemaVersion: 1,
          answers: reviewPrompts.map((_, i) => $("review-" + i).value),
          focus: $("review-focus").value,
          plan: $("review-plan").value,
          updatedAt: new Date().toISOString(),
        }),
    );
  on("review-save", persist);
  on("review-export", () => {
    if (persist())
      download("stand-firm-review-" + start + ".txt", reportText(state, start));
  });
  on("review-print", () => {
    if (!persist()) return;
    let node = $("printReport");
    if (!node) {
      node = document.createElement("pre");
      node.id = "printReport";
      node.className = "print-report";
      document.body.append(node);
    }
    node.textContent = reportText(state, start);
    window.print();
  });
  for (const k of Object.keys(state.reviews))
    on("history-" + k, () => {
      reviewWeek = k;
      renderReview();
    });
}
function renderPersonal() {
  root(
    "personal",
    heading(
      "My Mission",
      "Put your values into words.",
      "Keep your direction clear, and revise it as you learn.",
    ) +
      `<article class="card">${[
        ["statement", "Personal mission statement"],
        ["values", "My values"],
        ["goals", "Long-term goals"],
        ["plan", "Action plan: next steps and dates"],
      ]
        .map(([k, l]) => field("personal-" + k, l, state.mission[k]))
        .join("")}${btn("Save my mission", "personal-save", true)}</article>`,
  );
  on("personal-save", () =>
    save((s) => {
      for (const k of ["statement", "values", "goals", "plan"])
        s.mission[k] = $("personal-" + k).value;
    }),
  );
}
function renderJournal() {
  root(
    "journal",
    heading(
      "Private Journal",
      "A place for honest words.",
      "Stored in this browser, never automatically shared with AI. Anyone with access to this browser profile can read it; export a backup before clearing browser data.",
    ) +
      `<article class="card">${field("journal-new", "New reflection")}${field("journal-tags", "Tags, separated by commas", "", "text")}${btn("Save entry", "journal-new-save", true)}</article>${field("journal-search", "Search entries and tags", "", "search")}<label><input id="journal-favorites" type="checkbox">Favorites only</label>${btn("Export journal", "journal-export")}<div id="journal-results"></div>`,
  );
  on("journal-new-save", () => {
    const text = $("journal-new").value.trim();
    if (!text) return status("Write a reflection before saving.");
    if (
      save((s) =>
        s.journal.push({
          schemaVersion: 1,
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          text,
          tags: $("journal-tags")
            .value.split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          favorite: false,
          origin: "user",
        }),
      )
    )
      renderJournal();
  });
  on("journal-search", journalResults, "input");
  on("journal-favorites", journalResults, "change");
  on("journal-export", () =>
    download(
      "stand-firm-journal.json",
      JSON.stringify({ schemaVersion: 1, entries: state.journal }, null, 2),
      "application/json",
    ),
  );
  journalResults();
}
function journalResults() {
  const q = $("journal-search").value.toLowerCase(),
    f = $("journal-favorites").checked,
    list = state.journal
      .filter(
        (j) =>
          (!f || j.favorite) &&
          (j.text + " " + j.tags.join(" ")).toLowerCase().includes(q),
      )
      .slice()
      .reverse();
  $("journal-results").innerHTML =
    list
      .map(
        (j, i) =>
          `<article class="card"><time>${esc(new Date(j.date).toLocaleString())}</time><p style="white-space:pre-wrap">${esc(j.text)}</p><p class="small">${j.tags.map(esc).join(" · ")}</p>${btn(j.favorite ? "Remove favorite" : "Favorite", "favorite-" + i)}</article>`,
      )
      .join("") || "<p>No matching entries.</p>";
  list.forEach((j, i) =>
    on("favorite-" + i, () => {
      if (
        save(
          (s) => (s.journal.find((x) => x.id === j.id).favorite = !j.favorite),
        )
      )
        journalResults();
    }),
  );
}
function renderLibrary() {
  root(
    "library",
    heading(
      "Scripture Library",
      "Read. Reflect. Return.",
      "World English Bible, public domain. Quotations are imported from eBible.org; teaching elsewhere in the app is original interpretation.",
    ) +
      field(
        "scripture-search",
        "Search passages, references, or categories",
        "",
        "search",
      ) +
      `<label for="scripture-category">Category</label><select id="scripture-category"><option value="">All categories</option>${[
        ...new Set(scripture.map((v) => v.category)),
      ]
        .sort()
        .map((c) => `<option>${esc(c)}</option>`)
        .join(
          "",
        )}</select><label><input type="checkbox" id="scripture-bookmarks">Bookmarks only</label><article class="card"><h3>Seven readings: The Foundation</h3><p>A flexible reading plan. Repeat or pause whenever needed.</p>${programs[0].lessons.map((l, i) => `<label><input type="checkbox" data-reading="${l.scriptureId}" ${state.reading.includes(l.scriptureId) ? "checked" : ""}>Reading ${i + 1}: ${esc(verses[l.scriptureId].ref)} · ${esc(l.title)}</label>`).join("")}</article><div id="library-results"></div>`,
  );
  on("scripture-search", libraryResults, "input");
  on("scripture-category", libraryResults, "change");
  on("scripture-bookmarks", libraryResults, "change");
  document.querySelectorAll("[data-reading]").forEach((n) =>
    n.addEventListener("change", () => {
      if (
        !save(
          (s) =>
            (s.reading = n.checked
              ? [...new Set([...s.reading, n.dataset.reading])]
              : s.reading.filter((x) => x !== n.dataset.reading)),
        )
      )
        n.checked = !n.checked;
    }),
  );
  libraryResults();
}
function libraryResults() {
  const q = $("scripture-search").value.toLowerCase(),
    c = $("scripture-category").value,
    b = $("scripture-bookmarks").checked;
  const list = scripture.filter(
    (v) =>
      (!c || v.category === c) &&
      (!b || state.bookmarks.includes(v.id)) &&
      (v.ref + " " + v.text + " " + v.category).toLowerCase().includes(q),
  );
  $("library-results").innerHTML =
    list
      .map(
        (v) =>
          `<article class="card"><span class="badge">${esc(v.category)}</span>${verse(v.id)}${btn(state.bookmarks.includes(v.id) ? "Remove bookmark" : "Bookmark", "bookmark-" + v.id)}</article>`,
      )
      .join("") || "<p>No matching passages.</p>";
  for (const v of list)
    on("bookmark-" + v.id, () => {
      if (
        save(
          (s) =>
            (s.bookmarks = s.bookmarks.includes(v.id)
              ? s.bookmarks.filter((x) => x !== v.id)
              : [...s.bookmarks, v.id]),
        )
      )
        libraryResults();
    });
}
function renderAccountability() {
  root(
    "accountability",
    heading(
      "Accountability",
      "Keep a clear commitment.",
      "Your private tracker. Optional partner invitations and sharing are planned; nothing is sent to anyone.",
    ) +
      `<article class="card">${field("commitment-text", "My commitment", "", "text")}${field("commitment-due", "Target date", dateKey(), "date")}${btn("Add commitment", "commitment-add", true)}</article><div>${state.commitments.map((c, i) => `<article class="card"><h3>${esc(c.text)}</h3><p>Target ${esc(c.due)} · ${c.completedAt ? "Completed " + esc(c.completedAt) : "Open"}</p>${btn(c.completedAt ? "Reopen" : "Complete", "commitment-" + i)}</article>`).join("")}</div>`,
  );
  on("commitment-add", () => {
    const text = $("commitment-text").value.trim(),
      due = $("commitment-due").value;
    if (!text || !due) return status("Add a commitment and target date.");
    if (
      save((s) =>
        s.commitments.push({
          schemaVersion: 1,
          id: crypto.randomUUID(),
          text,
          due,
          completedAt: null,
        }),
      )
    )
      renderAccountability();
  });
  state.commitments.forEach((c, i) =>
    on("commitment-" + i, () => {
      if (
        save(
          (s) =>
            (s.commitments[i].completedAt = c.completedAt ? null : dateKey()),
        )
      )
        renderAccountability();
    }),
  );
}
function renderBody() {
  root(
    "body",
    heading(
      "Body & Discipline",
      "Build a routine that fits you.",
      "Set your own limitations and choose comfortable, adaptable practices. Guided movement programs are planned.",
    ) +
      `<article class="card">${field("body-limits", "My limitations and preferences", state.body.limits)}${field("body-routine", "My movement, recovery, or sleep routine", state.body.routine)}${btn("Save routine", "body-save", true)}<p class="small">This is a planning space, not a prescription. Rest and recovery are valid choices.</p></article>`,
  );
  on("body-save", () =>
    save(
      (s) =>
        (s.body = {
          limits: $("body-limits").value,
          routine: $("body-routine").value,
        }),
    ),
  );
}
function renderMore() {
  const routes = [
    ["personal", "My Mission", "Values, goals, and action plans"],
    ["journal", "Journal", "Private reflections, tags, and export"],
    ["library", "Scripture Library", "Verified passages and reading plan"],
    ["facing", "Facing the Fire", "Guidance for difficult moments"],
    ["reset", "Audio & Find Peace", "Original demo loops and breathing reset"],
    ["accountability", "Accountability", "Private commitments"],
    ["body", "Body & Discipline", "Your limits and routines"],
    ["guide", "Offline Guide", "Curated topic guidance"],
    ["settings", "Settings & Backup", "Reminders, appearance, and data"],
  ];
  root(
    "more",
    heading("Your practice", "Support for the whole day.") +
      `<div class="release-grid">${routes.map(([id, title, desc]) => `<article class="card"><h3>${title}</h3><p>${desc}</p>${btn("Open " + title, "more-" + id)}</article>`).join("")}</div>`,
  );
  routes.forEach(([id]) => on("more-" + id, () => go(id)));
}
function renderSettings() {
  root(
    "settings",
    heading("Settings", "Make this practice yours.") +
      `<article class="card"><h3>Appearance</h3>${btn("Switch light / dark mode", "settings-theme")}</article><article class="card"><h3>Optional daily reminder</h3><p>Your timezone: ${esc(Intl.DateTimeFormat().resolvedOptions().timeZone)}. Reminders appear only while the app is open. Background push reminders are planned.</p>${field("reminder-time", "Local reminder time", state.settings.time, "time")}<div class="actions">${btn("Enable reminder", "reminder-enable", true)}${btn("Disable notifications", "reminder-disable")}</div><p>App reminders are ${state.settings.reminder ? "enabled" : "disabled"}. Browser permission: ${"Notification" in window ? Notification.permission : "unavailable"}.</p></article><article class="card"><h3>Your data</h3><p>Download a full backup including private reflections. Store the file somewhere private. Data is local to this browser origin; a different port or browser has separate storage.</p>${btn("Export full backup", "backup-export")}<label for="backup-import">Import a Stand Firm backup or v1 saved-data JSON</label><input type="file" id="backup-import" accept=".json,application/json"><p class="small">Import merges new journal entries and bookmarks. Existing days and reviews win conflicts, so current records are preserved. It never clears the old prototype key.</p><p>The original preview’s file:// storage cannot be read from this local server. To transfer it, open the original preview and export its localStorage key “stand-firm-prototype-v1” as JSON; see the migration guide.</p></article><article class="card"><h3>AI companion</h3><p>The app's primary practice and curated guide work offline. A server-side provider and evaluation suite are included in source. Live coaching is not enabled in this release; no reflections are sent to an AI provider.</p></article>`,
  );
  on("settings-theme", () => $("themeToggle").click());
  on("reminder-enable", async () => {
    const time = $("reminder-time").value;
    if (!/^\d{2}:\d{2}$/.test(time)) return status("Choose a reminder time.");
    if (!("Notification" in window))
      return status("This browser does not support notifications.");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted")
        return status(
          "Notifications were not enabled. You can continue without reminders.",
        );
      if (save((s) => (s.settings = { ...s.settings, reminder: true, time })))
        renderSettings();
    } catch {
      status("Notification permission could not be requested.");
    }
  });
  on("reminder-disable", () => {
    if (save((s) => (s.settings.reminder = false))) {
      navigator.serviceWorker
        ?.getRegistration()
        .then((r) => r?.getNotifications())
        .then((ns) => ns?.forEach((n) => n.close()));
      renderSettings();
    }
  });
  on("backup-export", () =>
    download(
      "stand-firm-backup-" + dateKey() + ".json",
      JSON.stringify(state, null, 2),
      "application/json",
    ),
  );
  on(
    "backup-import",
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        if (file.size > 10000000)
          throw Error("Backup is too large (10 MB maximum).");
        const raw = await file.text(),
          obj = JSON.parse(raw),
          incoming =
            obj.schemaVersion === 2 ? validateState(obj) : migrateLegacy(raw);
        if (
          save((s) => {
            const ids = new Set(s.journal.map((j) => j.id));
            s.journal.push(...incoming.journal.filter((j) => !ids.has(j.id)));
            s.bookmarks = [...new Set([...s.bookmarks, ...incoming.bookmarks])];
            s.reading = [...new Set([...s.reading, ...incoming.reading])];
            for (const k of ["days", "reviews"])
              s[k] = { ...incoming[k], ...s[k] };
            for (const [id, p] of Object.entries(incoming.programs)) {
              const current = s.programs[id];
              s.programs[id] = current
                ? {
                    ...p,
                    ...current,
                    completed: { ...p.completed, ...current.completed },
                    notes: { ...p.notes, ...current.notes },
                  }
                : p;
            }
            if (!Object.keys(s.legacy).length) s.legacy = incoming.legacy;
            const cids = new Set(s.commitments.map((c) => c.id));
            s.commitments.push(
              ...incoming.commitments.filter((c) => !cids.has(c.id)),
            );
            for (const k of ["statement", "values", "goals", "plan"])
              if (!s.mission[k]) s.mission[k] = incoming.mission[k] || "";
            for (const k of ["limits", "routine"])
              if (!s.body[k]) s.body[k] = incoming.body[k] || "";
            s.imports.push({ name: file.name, date: new Date().toISOString() });
          }, "Backup merged. Existing records were preserved.")
        )
          renderSettings();
      } catch (e) {
        status("Import was not applied: " + e.message);
      }
    },
    "change",
  );
}
async function checkReminder() {
  if (
    !state?.settings.reminder ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  )
    return;
  const now = new Date(),
    today = dateKey(now),
    time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  if (time < state.settings.time || state.settings.lastReminder === today)
    return;
  try {
    const registration = await navigator.serviceWorker?.ready;
    if (!registration) return;
    await registration.showNotification("Stand Firm", {
      body: "Your daily mission is ready when you are.",
      tag: "stand-firm-daily",
      icon: "assets/original-1.png",
      data: { url: "./#mission" },
    });
    save((s) => (s.settings.lastReminder = today), "");
  } catch {
    status(
      "The reminder could not be shown. Your practice is still available.",
    );
  }
}
function enhanceLegacy() {
  on("saveGuidance", () => {
    const passage = scripture.find(
      (v) => v.ref === $("guidanceRef").textContent,
    );
    if (passage)
      save((s) => {
        if (!s.bookmarks.includes(passage.id)) s.bookmarks.push(passage.id);
      }, "Passage saved to Scripture Library.");
  });
  // Route legacy journal users into the lossless versioned journal while keeping old code and data intact.
  const journalInput = $("journalInput"),
    journalCard = journalInput.closest(".card");
  journalCard.hidden = true;
  const link = document.createElement("button");
  link.className = "primary";
  link.textContent = "Open private journal";
  link.onclick = () => go("journal");
  journalCard.before(link);
  const oldDaily = $("completeDaily").closest("article");
  oldDaily.hidden = true;
  const dailyLink = document.createElement("button");
  dailyLink.className = "primary";
  dailyLink.textContent = "Open Daily Mission";
  dailyLink.onclick = () => go("mission");
  oldDaily.before(dailyLink);
  // Replace display quotations with publisher-verified WEB while retaining stable legacy bookmark ids.
  const C = window.StandFirmContent;
  for (const [id, v] of Object.entries(C.verses))
    if (verses[id]) {
      v.text = verses[id].text;
      v.ref = verses[id].ref;
    }
  document
    .querySelectorAll(".translation")
    .forEach((n) => (n.textContent = "World English Bible"));
  const fixText = () => {
    document.querySelectorAll(".translation").forEach((n) => {
      if (n.textContent.includes("KING JAMES"))
        n.textContent = "World English Bible";
    });
  };
  new MutationObserver(fixText).observe($("guideResult"), {
    childList: true,
    subtree: true,
  });
  const guidance = $("guidancePanel"),
    tools = document.createElement("article");
  tools.className = "card";
  tools.innerHTML = `<h3>Work through this moment</h3>${method}<p>If there are threats, coercion, or abuse, prioritize safety and outside support. You do not need to confront someone or reconcile to use this tool.</p><div id="fire-fields">${[
    ["recognize", "What happened, and what am I feeling?"],
    ["separate", "What can I control, and what is outside my control?"],
    ["choose", "What response fits Scripture, responsibility, and my values?"],
    ["act", "What safe, concrete action will I take?"],
    ["review", "What happened afterward, and what did I learn?"],
  ]
    .map(([id, l]) => field("fire-" + id, l))
    .join(
      "",
    )}</div>${btn("Save to private journal", "fire-save", true)}<p class="small">For immediate danger, contact local emergency services. In the U.S., call or text 988 for crisis support; call 911 for an immediate emergency.</p>`;
  guidance.after(tools);
  on("fire-save", () => {
    const keys = ["recognize", "separate", "choose", "act", "review"],
      text = keys
        .map((k) => k.toUpperCase() + ": " + $("fire-" + k).value)
        .join("\n\n");
    if (keys.every((k) => !$("fire-" + k).value.trim()))
      return status("Write a reflection before saving.");
    if (
      save((s) =>
        s.journal.push({
          schemaVersion: 1,
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          text,
          tags: ["Jimjitsu", "Facing the Fire"],
          favorite: false,
          origin: "user",
        }),
      )
    )
      keys.forEach((k) => ($("fire-" + k).value = ""));
  });
  const temptation = document.createElement("button");
  temptation.className = "situation";
  temptation.innerHTML =
    "<strong>Temptation</strong><span>Pause and choose the next step</span>";
  temptation.onclick = () => {
    guidance.hidden = false;
    $("guidanceLabel").textContent = "Temptation";
    $("guidanceTitle").textContent = "Create room for a wise choice.";
    $("guidanceMessage").textContent =
      "Recognize the urge without treating it as an instruction. Move away from a cue when possible, choose a response that fits your values, and seek trusted support if the pattern is difficult to manage alone.";
    $("guidanceRef").textContent = verses.prov1632.ref;
    $("guidanceVerse").textContent = verses.prov1632.text;
    $("guidanceAction").textContent =
      "Pause, change the immediate setting if helpful, and name one alternative action you can take now.";
    $("guidancePrayer").textContent =
      "God, help me choose with wisdom and receive support. Amen.";
    $("saveGuidance").hidden = true;
    $("guideFromSituation").hidden = true;
  };
  $("situationGrid").append(temptation);
  document.querySelectorAll("[data-situation]").forEach((n) =>
    n.addEventListener("click", () => {
      $("saveGuidance").hidden = false;
      $("guideFromSituation").hidden = false;
    }),
  );
  const audioCard =
      $("resetScreen") || document.querySelector('[data-screen="reset"]'),
    volume = document.createElement("div");
  volume.className = "card";
  volume.innerHTML =
    '<label for="volume">Audio volume</label><input id="volume" type="range" min="0" max="1" step="0.05" value="0.5"><p class="small">Dusk Hush starts with the breathing guide. Power uses a recovered original demo loop, and Focus uses an original synthesized ambient sketch.</p>';
  audioCard.append(volume);
  $("soundtrack").volume = 0.5;
  on(
    "volume",
    (e) => ($("soundtrack").volume = Number(e.target.value)),
    "input",
  );
}
init();
