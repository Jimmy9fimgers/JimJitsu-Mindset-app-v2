export const KEY = "stand-firm-v2";
export const LEGACY = "stand-firm-prototype-v1";
export const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function parseDay(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) throw Error("Invalid calendar date");
  const [y, m, d] = key.split("-").map(Number),
    result = new Date(y, m - 1, d, 12);
  if (dateKey(result) !== key) throw Error("Invalid calendar date");
  return result;
}
export function addDays(key, n) {
  const d = parseDay(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}
export function weekStart(key = dateKey()) {
  const d = parseDay(key);
  return addDays(key, -((d.getDay() + 6) % 7));
}
export function missionFor(key, missions) {
  const d = parseDay(key),
    ordinal = Math.floor(
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000,
    );
  return missions[
    ((ordinal % missions.length) + missions.length) % missions.length
  ];
}
export function emptyState() {
  return {
    schemaVersion: 2,
    days: {},
    programs: {},
    journal: [],
    reviews: {},
    mission: { statement: "", values: "", goals: "", plan: "" },
    commitments: [],
    body: { limits: "", routine: "" },
    bookmarks: [],
    reading: [],
    settings: { reminder: false, time: "08:00" },
    legacy: {},
    imports: [],
  };
}
export function validateState(s) {
  const unsafe = (value) =>
    value &&
    typeof value === "object" &&
    Object.entries(value).some(
      ([key, v]) =>
        ["__proto__", "constructor", "prototype"].includes(key) || unsafe(v),
    );
  if (unsafe(s)) throw Error("Unsafe backup field. Original kept.");
  if (!s || s.schemaVersion !== 2)
    throw Error("Unsupported data version. Your original data has been kept.");
  for (const k of [
    "days",
    "programs",
    "reviews",
    "mission",
    "body",
    "settings",
    "legacy",
  ])
    if (!s[k] || typeof s[k] !== "object" || Array.isArray(s[k]))
      throw Error(`Invalid ${k} data. Original kept.`);
  for (const k of ["journal", "commitments", "bookmarks", "reading", "imports"])
    if (!Array.isArray(s[k])) throw Error(`Invalid ${k} data. Original kept.`);
  for (const [day, r] of Object.entries(s.days)) {
    parseDay(day);
    if (
      !r ||
      typeof r.intention !== "string" ||
      typeof r.missionId !== "string"
    )
      throw Error("Invalid daily record. Original kept.");
    for (const phase of ["morning", "evening"]) {
      const checkin = r[phase];
      if (!checkin || typeof checkin !== "object" || Array.isArray(checkin))
        throw Error("Invalid check-in. Original kept.");
      if (
        checkin.reflection !== undefined &&
        typeof checkin.reflection !== "string"
      )
        throw Error("Invalid reflection. Original kept.");
      for (const rating of ["mood", "energy", "stress"])
        if (
          checkin[rating] != null &&
          ![1, 2, 3, 4, 5].includes(checkin[rating])
        )
          throw Error("Invalid emotional rating. Original kept.");
    }
    if (
      !Array.isArray(r.objectives) ||
      r.objectives.some(
        (o) =>
          typeof o.text !== "string" ||
          !["pending", "done", "skipped", "carried"].includes(o.status),
      )
    )
      throw Error("Invalid objective data. Original kept.");
  }
  for (const j of s.journal)
    if (
      typeof j.id !== "string" ||
      typeof j.text !== "string" ||
      !Array.isArray(j.tags) ||
      j.tags.some((tag) => typeof tag !== "string")
    )
      throw Error("Invalid journal data. Original kept.");
  for (const p of Object.values(s.programs)) {
    if (
      !p ||
      typeof p !== "object" ||
      !p.completed ||
      !p.notes ||
      typeof p.completed !== "object" ||
      typeof p.notes !== "object" ||
      Array.isArray(p.completed) ||
      Array.isArray(p.notes)
    )
      throw Error("Invalid program data. Original kept.");
    for (const day of Object.values(p.completed)) parseDay(day);
    for (const note of Object.values(p.notes))
      if (typeof note !== "string") throw Error("Invalid lesson note.");
  }
  for (const [day, r] of Object.entries(s.reviews)) {
    parseDay(day);
    if (
      !Array.isArray(r.answers) ||
      r.answers.some((x) => typeof x !== "string") ||
      typeof r.focus !== "string" ||
      typeof r.plan !== "string"
    )
      throw Error("Invalid review data. Original kept.");
  }
  for (const c of s.commitments) {
    if (typeof c.id !== "string" || typeof c.text !== "string")
      throw Error("Invalid commitment.");
    parseDay(c.due);
    if (c.completedAt) parseDay(c.completedAt);
  }
  for (const list of [s.bookmarks, s.reading])
    if (list.some((x) => typeof x !== "string"))
      throw Error("Invalid library data.");
  return s;
}
export function migrateLegacy(raw) {
  const old = JSON.parse(raw);
  if (!old || typeof old !== "object" || Array.isArray(old))
    throw Error("Invalid old data.");
  const s = emptyState();
  s.legacy = structuredClone(old);
  s.journal = (Array.isArray(old.journal) ? old.journal : [])
    .filter((j) => typeof j.text === "string")
    .map((j, i) => ({
      schemaVersion: 1,
      id: String(j.id || `legacy-${i}`),
      date: j.date || new Date(0).toISOString(),
      text: j.text,
      tags: [],
      favorite: false,
      origin: "legacy",
    }));
  s.bookmarks = Array.isArray(old.saved)
    ? old.saved.filter((x) => typeof x === "string")
    : [];
  return s;
}
export function load(storage) {
  const current = storage.getItem(KEY);
  if (current) return validateState(JSON.parse(current));
  const old = storage.getItem(LEGACY);
  const s = old ? migrateLegacy(old) : emptyState();
  // Keep the old key byte-for-byte; only commit migration after it is valid.
  storage.setItem(KEY, JSON.stringify(validateState(s)));
  return s;
}
export function transact(state, storage, fn) {
  const stored = storage.getItem?.(KEY);
  if (stored && stored !== JSON.stringify(state))
    throw Error("Another tab changed the data. Reload before saving.");
  const next = structuredClone(state);
  fn(next);
  validateState(next);
  storage.setItem(KEY, JSON.stringify(next));
  return next;
}
export function ensureDay(s, key, missions) {
  if (!s.days[key]) {
    const m = missionFor(key, missions);
    s.days[key] = {
      schemaVersion: 1,
      missionId: m.id,
      intention: "",
      morning: {},
      evening: {},
      objectives: m.objectives.map((o) => ({ ...o, status: "pending" })),
    };
  }
  return s.days[key];
}
export function carry(s, from, id, missions) {
  const item = s.days[from]?.objectives.find((o) => o.id === id);
  if (
    !item ||
    !item.carryAllowed ||
    !["pending", "skipped"].includes(item.status)
  )
    throw Error("This objective cannot be carried forward.");
  const to = addDays(from, 1),
    target = ensureDay(s, to, missions),
    copyId = `${id}@${to}`;
  if (!target.objectives.some((o) => o.id === copyId))
    target.objectives.push({
      ...item,
      id: copyId,
      status: "pending",
      carriedFrom: { date: from, id },
    });
  item.status = "carried";
  item.carriedTo = to;
}
export function completeLesson(s, program, lesson, key = dateKey()) {
  if (
    program.status !== "available" ||
    !program.lessons.some((l) => l.id === lesson.id)
  )
    throw Error("Lesson is unavailable.");
  const p = (s.programs[program.id] ??= {
    completed: {},
    notes: {},
    lastLesson: lesson.id,
  });
  p.lastLesson = lesson.id;
  // Re-reading is allowed; the first completion remains the source of weekly counts.
  if (!p.completed[lesson.id]) p.completed[lesson.id] = key;
}
export function metrics(s, start) {
  const end = addDays(start, 7),
    dates = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const days = dates.map((date) => {
    const d = s.days[date],
      o = d?.objectives || [];
    return {
      date,
      done: o.filter((x) => x.status === "done").length,
      total: o.length,
      skipped: o.filter((x) => x.status === "skipped").length,
      carried: o.filter((x) => x.status === "carried").length,
      checkIn: !!(d?.morning.savedAt || d?.evening.savedAt),
    };
  });
  const lessons = Object.values(s.programs)
    .flatMap((p) => Object.entries(p.completed || {}))
    .filter(([, d]) => d >= start && d < end);
  const commitments = s.commitments.filter(
    (c) => c.completedAt >= start && c.completedAt < end,
  ).length;
  return {
    days,
    completed: days.reduce((n, d) => n + d.done, 0),
    total: days.reduce((n, d) => n + d.total, 0),
    lessons: lessons.length,
    commitments,
    activeDays: days.filter(
      (d) => d.done || d.checkIn || lessons.some(([, x]) => x === d.date),
    ).length,
  };
}
export const reviewPrompts = [
  "What went well?",
  "What did I avoid?",
  "What did I learn?",
  "Who did I serve?",
  "What needs repair?",
  "What is my next objective?",
];
export function reportText(s, start) {
  const m = metrics(s, start),
    r = s.reviews[start] || {};
  return `STAND FIRM — Weekly review\n${start} through ${addDays(start, 6)}\n\nDaily objectives completed: ${m.completed} of ${m.total} recorded\nPrivate commitments completed: ${m.commitments}\nLessons first completed: ${m.lessons}\nDays with recorded practice: ${m.activeDays} of 7\n\n${reviewPrompts.map((q, i) => q + "\n" + (r.answers?.[i] || "Not recorded")).join("\n\n")}\n\nNext-week focus: ${r.focus || "Not recorded"}\nAction plan: ${r.plan || "Not recorded"}\n\nDaily reflections\n${m.days
    .map(({ date }) => {
      const d = s.days[date];
      return (
        date +
        "\nMorning: " +
        (d?.morning.reflection || "Not recorded") +
        "\nEvening: " +
        (d?.evening.reflection || "Not recorded")
      );
    })
    .join("\n\n")}`;
}
