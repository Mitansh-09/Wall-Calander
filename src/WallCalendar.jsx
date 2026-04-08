import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Data ─────────────────────────────────────────────────────────────────── */
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const MONTH_META = [
  { gradient:"linear-gradient(140deg,#e8d5c4 -50%,#c4a882 45%,#8b6f47 100%)", icon:"❄️", sub:"January's quiet mornings" },
  { gradient:"linear-gradient(140deg,#f5e6d3 -50%,#e8b4b8 50%,#d4849a 100%)", icon:"🌸", sub:"February whispers of spring" },
  { gradient:"linear-gradient(140deg,#d4e8c2 -50%,#a8c97a 50%,#6b9e3c 100%)", icon:"🌿", sub:"March brings new life" },
  { gradient:"linear-gradient(140deg,#fff3d6 -50%,#f9d46b 48%,#e6a85a 100%)", icon:"🌼", sub:"April showers, May flowers" },
  { gradient:"linear-gradient(140deg,#c8f0e8 -50%,#7dd4c4 50%,#3aad9a 100%)", icon:"🌺", sub:"May in full colour" },
  { gradient:"linear-gradient(140deg,#ffe8cc -50%,#ff9f43 50%,#e07820 100%)", icon:"☀️",  sub:"June solstice glow" },
  { gradient:"linear-gradient(140deg,#e8f4ff -50%,#74b9ff 50%,#0984e3 100%)", icon:"🌊", sub:"July on the shore" },
  { gradient:"linear-gradient(140deg,#fff8e8 -50%,#fdcb6e 50%,#e17055 100%)", icon:"🌅", sub:"August evenings linger" },
  { gradient:"linear-gradient(140deg,#e8f5e8 -50%,#a8d8a8 50%,#5a9e5a 100%)", icon:"🍂", sub:"September's golden turn" },
  { gradient:"linear-gradient(140deg,#fff0e8 -50%,#e8956d 50%,#c0522c 100%)", icon:"🍁", sub:"October ablaze" },
  { gradient:"linear-gradient(140deg,#e8eef4 -50%,#a8b8c8 50%,#5a7a9e 100%)", icon:"🌫️", sub:"November's quiet grey" },
  { gradient:"linear-gradient(140deg,#e8f0f8 -50%,#b8d0e8 50%,#4a7aaa 100%)", icon:"⛄", sub:"December, still and cold" },
];

const HOLIDAYS = {
  "1-1":"New Year's Day","1-15":"MLK Day","2-14":"Valentine's Day",
  "3-17":"St. Patrick's Day","4-1":"April Fools'","5-27":"Memorial Day",
  "6-19":"Juneteenth","7-4":"Independence Day","9-2":"Labor Day",
  "10-31":"Halloween","11-28":"Thanksgiving","12-25":"Christmas","12-31":"New Year's Eve",
};

const THEMES = {
  warm: {
    "--bg":"#faf6f0","--surface":"#fff9f3","--accent":"#c87941","--accent2":"#8b4513",
    "--text":"#3d2b1a","--muted":"#9a7b5e","--range":"#f5e0cb","--border":"#e8d5c0",
    "--paper":"#f5ede0","--hole":"#f0ebe3","--shadow":"rgba(139,69,19,0.12)",
    "--today-ring":"#c87941",
  },
  cool: {
    "--bg":"#f0f4f8","--surface":"#f8fbff","--accent":"#4a7aaa","--accent2":"#2d5a8a",
    "--text":"#1a2a3a","--muted":"#6a8aaa","--range":"#d0e4f4","--border":"#c0d4e8",
    "--paper":"#e8f0f8","--hole":"#dceef8","--shadow":"rgba(45,90,138,0.12)",
    "--today-ring":"#4a7aaa",
  },
  forest: {
    "--bg":"#f0f5ee","--surface":"#f6faf4","--accent":"#4a8a4a","--accent2":"#2a5e2a",
    "--text":"#1a2e1a","--muted":"#6a8a6a","--range":"#c8e4c8","--border":"#b8d8b8",
    "--paper":"#e4f0e4","--hole":"#d8ecd8","--shadow":"rgba(42,94,42,0.12)",
    "--today-ring":"#4a8a4a",
  },
  midnight: {
    "--bg":"#0e1117","--surface":"#161b22","--accent":"#e8956d","--accent2":"#c0522c",
    "--text":"#e8e0d8","--muted":"#8a7a6a","--range":"#2a1f17","--border":"#2e2418",
    "--paper":"#1a1410","--hole":"#0e1117","--shadow":"rgba(232,149,109,0.15)",
    "--today-ring":"#e8956d",
  },
};


const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const getFirstDay   = (y, m) => new Date(y, m, 1).getDay();
const sameDay = (a, b) =>
  a && b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const inRange = (d, s, e) => {
  if (!s || !e) return false;
  const [lo, hi] = s <= e ? [s, e] : [e, s];
  return d > lo && d < hi;
};
const fmtDate = (d) =>
  d
    ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";
const noteKey = (y, m, day) => (day ? `${y}-${m}-${day}` : `${y}-${m}`);


export default function WallCalendar() {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd,   setRangeEnd]   = useState(null);
  const [hovered,    setHovered]    = useState(null);
  const [tipDay,     setTipDay]     = useState(null);
  const [notes,      setNotes]      = useState(() => {
    try { return JSON.parse(localStorage.getItem("wcal_notes") || "{}"); }
    catch { return {}; }
  });
  const [noteText,   setNoteText]   = useState("");
  const [theme,      setTheme]      = useState("warm");
  const [savedFlash, setSavedFlash] = useState(false);
  const [animDir,    setAnimDir]    = useState(0);
  const [animKey,    setAnimKey]    = useState(0);

  const textareaRef = useRef(null);

  /* Persist notes */
  useEffect(() => {
    localStorage.setItem("wcal_notes", JSON.stringify(notes));
  }, [notes]);

  /* Sync textarea with selection */
  const activeKey = rangeStart
    ? noteKey(viewYear, viewMonth, rangeStart.getDate())
    : noteKey(viewYear, viewMonth, null);

  useEffect(() => {
    setNoteText(notes[activeKey] || "");
  }, [activeKey]);

  /* Keyboard nav */
  useEffect(() => {
    const handler = (e) => {
      if (document.activeElement === textareaRef.current) return;
      if (e.key === "ArrowLeft")  changeMonth(-1);
      if (e.key === "ArrowRight") changeMonth(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [viewYear, viewMonth]);

  /* ── Navigation ── */
  const changeMonth = useCallback((dir) => {
    setAnimDir(dir);
    setAnimKey(k => k + 1);
    setViewMonth(m => {
      const nm = m + dir;
      if (nm < 0)  { setViewYear(y => y - 1); return 11; }
      if (nm > 11) { setViewYear(y => y + 1); return 0; }
      return nm;
    });
    setRangeStart(null);
    setRangeEnd(null);
  }, []);

  /* ── Day click ── */
  const handleDayClick = (day) => {
    const clicked = new Date(viewYear, viewMonth, day);
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(clicked);
      setRangeEnd(null);
    } else {
      if (clicked < rangeStart) { setRangeEnd(rangeStart); setRangeStart(clicked); }
      else setRangeEnd(clicked);
    }
  };

  /* ── Notes ── */
  const saveNote = () => {
    setNotes(prev => {
      const next = { ...prev };
      if (noteText.trim()) next[activeKey] = noteText;
      else delete next[activeKey];
      return next;
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  };

  const deleteNote = (k) => {
    setNotes(prev => { const n = { ...prev }; delete n[k]; return n; });
  };

  /* ── Derived ── */
  const meta     = MONTH_META[viewMonth];
  const dim      = getDaysInMonth(viewYear, viewMonth);
  const fd       = getFirstDay(viewYear, viewMonth);
  const rangeLen = rangeStart && rangeEnd
    ? Math.abs(Math.round((rangeEnd - rangeStart) / 86400000)) + 1
    : null;

  const monthNotes = Object.entries(notes)
    .filter(([k, v]) => k.startsWith(`${viewYear}-${viewMonth}`) && v.trim())
    .sort();

  const cells = [...Array(fd).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];

  const getDayState = (day) => {
    if (!day) return "empty";
    const d = new Date(viewYear, viewMonth, day);
    if (sameDay(d, rangeStart)) return "start";
    if (sameDay(d, rangeEnd))   return "end";
    const hovD = hovered ? new Date(viewYear, viewMonth, hovered) : null;
    if (rangeStart && !rangeEnd && hovD && inRange(d, rangeStart, hovD)) return "hov-range";
    if (rangeStart && rangeEnd && inRange(d, rangeStart, rangeEnd)) return "in-range";
    if (sameDay(d, today) && viewYear === today.getFullYear() && viewMonth === today.getMonth())
      return "today";
    return "normal";
  };

  const cssVars = THEMES[theme];
  const appStyle = { ...cssVars, background: "var(--bg)" };

  /* ── Render ── */
  return (
    <div style={appStyle} className="wc-app">
      <style>{CSS}</style>

      <div className="wc-wrap">
        {/* ── Punch holes ── */}
        <div className="wc-holes">
          {[...Array(6)].map((_, i) => <div key={i} className="wc-hole" />)}
        </div>

        {/* ── Hero ── */}
        <div className="wc-hero">
          <div
            className="wc-hero-grad"
            style={{ background: meta.gradient }}
          >
            <div className="wc-hero-icon">{meta.icon}</div>
            <p className="wc-hero-sub">{meta.sub}</p>
            <h1 className="wc-hero-month">{MONTHS[viewMonth]}</h1>
          </div>
          <div className="wc-nav">
            <button className="wc-nav-btn" onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
            <span className="wc-year">{viewYear}</span>
            <button className="wc-nav-btn" onClick={() => changeMonth(1)} aria-label="Next month">›</button>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="wc-stats">
          <span className="wc-chip"><b>{dim}</b> days</span>
          {rangeLen && <span className="wc-chip wc-chip-accent"><b>{rangeLen}</b> selected</span>}
          <span className="wc-chip"><b>{monthNotes.length}</b> {monthNotes.length === 1 ? "note" : "notes"}</span>
          <span className="wc-chip wc-chip-hint">← → keys to navigate</span>
        </div>

        <div className="wc-body">
          {/* ── Calendar grid ── */}
          <div className="wc-grid-panel">
            {/* Day labels */}
            <div className="wc-day-labels">
              {DAYS_SHORT.map(d => (
                <div key={d} className="wc-day-label">{d}</div>
              ))}
            </div>

            {/* Cells */}
            <div
              key={animKey}
              className={`wc-days-grid wc-slide${animDir >= 0 ? "-fwd" : "-bwd"}`}
            >
              {cells.map((day, idx) => {
                const state   = getDayState(day);
                const hk      = day ? `${viewMonth + 1}-${day}` : null;
                const holiday = hk ? HOLIDAYS[hk] : null;
                const hasNote = day ? !!notes[noteKey(viewYear, viewMonth, day)]?.trim() : false;
                const isStart = state === "start";
                const isEnd   = state === "end";

                return (
                  <div
                    key={idx}
                    className={`wc-day wc-day-${state}${day && sameDay(new Date(viewYear, viewMonth, day), rangeStart) ? " wc-day-start-sel" : ""}`}
                    onClick={() => day && handleDayClick(day)}
                    onMouseEnter={() => day && setHovered(day)}
                    onMouseLeave={() => { setHovered(null); setTipDay(null); }}
                    role={day ? "button" : undefined}
                    tabIndex={day ? 0 : undefined}
                    onKeyDown={e => e.key === "Enter" && day && handleDayClick(day)}
                    aria-label={day ? `${MONTHS[viewMonth]} ${day}${holiday ? ", " + holiday : ""}` : undefined}
                  >
                    {tipDay === day && holiday && (
                      <div className="wc-tip" role="tooltip">{holiday}</div>
                    )}
                    <span className="wc-day-num">{day}</span>
                    <div className="wc-day-dots">
                      {holiday && (
                        <span
                          className={`wc-hdot${isStart || isEnd ? " wc-hdot-inv" : ""}`}
                          onMouseEnter={() => setTipDay(day)}
                          onMouseLeave={() => setTipDay(null)}
                        />
                      )}
                      {hasNote && <span className="wc-ndot" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="wc-legend">
              <span className="wc-leg-item"><span className="wc-leg-dot wc-leg-start" />Start / End</span>
              <span className="wc-leg-item"><span className="wc-leg-dot wc-leg-range" />Range</span>
              <span className="wc-leg-item"><span className="wc-leg-dot wc-leg-today" />Today</span>
              <span className="wc-leg-item"><span className="wc-leg-hdot" />Holiday</span>
              <span className="wc-leg-item"><span className="wc-leg-ndot" />Note</span>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="wc-sidebar">
            {/* Range info */}
            <div className="wc-sb-section">
              <p className="wc-sb-title">Selected Range</p>
              <div className="wc-range-cards">
                <div className="wc-rcard">
                  <span className="wc-rl">Start date</span>
                  <span className="wc-rv">{rangeStart ? fmtDate(rangeStart) : "—"}</span>
                </div>
                <div className="wc-rcard">
                  <span className="wc-rl">End date</span>
                  <span className="wc-rv">{rangeEnd ? fmtDate(rangeEnd) : "—"}</span>
                  {rangeLen && <span className="wc-rd">↔ {rangeLen} {rangeLen === 1 ? "day" : "days"}</span>}
                </div>
              </div>
              {(rangeStart || rangeEnd) && (
                <button
                  className="wc-clear-btn"
                  onClick={() => { setRangeStart(null); setRangeEnd(null); }}
                >
                  ✕ Clear selection
                </button>
              )}
            </div>

            {/* Notes */}
            <div className="wc-sb-section wc-notes-section">
              <div className="wc-notes-header">
                <div>
                  <p className="wc-sb-title">Notes</p>
                  <p className="wc-notes-for">
                    {rangeStart ? fmtDate(rangeStart) : `${MONTHS[viewMonth]} ${viewYear}`}
                  </p>
                </div>
                <button
                  className={`wc-save-btn${savedFlash ? " wc-save-flash" : ""}`}
                  onClick={saveNote}
                >
                  {savedFlash ? "✓ Saved" : "Save"}
                </button>
              </div>

              <textarea
                ref={textareaRef}
                className="wc-textarea wc-lined"
                placeholder="Jot anything for this date… (⌘S to save)"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "s") {
                    e.preventDefault();
                    saveNote();
                  }
                }}
              />
            </div>

            {/* Saved notes list */}
            {monthNotes.length > 0 && (
              <div className="wc-sb-section wc-saved-section">
                <p className="wc-sb-title">Saved This Month</p>
                <div className="wc-saved-list">
                  {monthNotes.map(([k, v]) => {
                    const parts = k.split("-");
                    const d = parts[2];
                    const lbl = d
                      ? `${MONTHS[viewMonth]} ${d}`
                      : `${MONTHS[viewMonth]} (month)`;
                    return (
                      <div
                        key={k}
                        className={`wc-sni${k === activeKey ? " wc-sni-active" : ""}`}
                        onClick={() => {
                          if (d) setRangeStart(new Date(viewYear, viewMonth, parseInt(d)));
                        }}
                      >
                        <div className="wc-sni-row">
                          <span className="wc-sni-date">{lbl}</span>
                          <button
                            className="wc-sni-del"
                            onClick={e => { e.stopPropagation(); deleteNote(k); }}
                            aria-label="Delete note"
                          >×</button>
                        </div>
                        <p className="wc-sni-preview">{v}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Theme picker */}
            <div className="wc-theme-strip">
              <span className="wc-theme-label">Theme</span>
              <div className="wc-theme-dots">
                {[
                  { id:"warm",     bg:"#c87941", label:"Warm" },
                  { id:"cool",     bg:"#4a7aaa", label:"Cool" },
                  { id:"forest",   bg:"#4a8a4a", label:"Forest" },
                  { id:"midnight", bg:"#161b22", label:"Midnight" },
                ].map(t => (
                  <button
                    key={t.id}
                    className={`wc-theme-dot${theme === t.id ? " wc-theme-dot-active" : ""}`}
                    style={{ background: t.bg }}
                    onClick={() => setTheme(t.id)}
                    aria-label={`${t.label} theme`}
                    title={t.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Playfair+Display:wght@700;900&family=DM+Mono:wght@300;400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.wc-app {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(10px, 3vw, 32px);
  font-family: 'Lora', Georgia, serif;
  transition: background 0.4s;
}

.wc-wrap {
  width: 100%;
  max-width: 1040px;
  background: var(--surface);
  border-radius: 3px;
  box-shadow:
    0 2px 0 var(--border),
    0 12px 50px var(--shadow),
    0 4px 16px rgba(0,0,0,0.08);
  overflow: hidden;
  transition: background 0.4s, box-shadow 0.4s;
}

/* Holes bar */
.wc-holes {
  height: 28px;
  background: var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(40px, 8vw, 90px);
  transition: background 0.4s;
}
.wc-hole {
  width: 17px; height: 17px;
  border-radius: 50%;
  background: var(--hole);
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.28);
  transition: background 0.4s;
}

/* Hero */
.wc-hero {
  position: relative;
  overflow: hidden;
}
.wc-hero-grad {
  min-height: clamp(140px, 20vw, 210px);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: clamp(16px, 3vw, 28px) clamp(20px, 4vw, 36px);
  transition: background 0.9s ease;
}
.wc-hero-icon {
  font-size: clamp(40px, 7vw, 64px);
  position: absolute;
  top: clamp(12px, 2vw, 20px);
  right: clamp(20px, 4vw, 36px);
  filter: drop-shadow(0 4px 10px rgba(0,0,0,0.22));
  animation: wc-float 5s ease-in-out infinite;
  pointer-events: none;
}
@keyframes wc-float {
  0%, 100% { transform: translateY(0) rotate(-4deg); }
  50%       { transform: translateY(-10px) rotate(4deg); }
}
.wc-hero-sub {
  font-style: italic;
  font-size: clamp(11px, 1.4vw, 13px);
  color: rgba(255,255,255,0.72);
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}
.wc-hero-month {
  font-family: 'Playfair Display', serif;
  font-weight: 900;
  font-size: clamp(28px, 5.5vw, 52px);
  color: rgba(255,255,255,0.96);
  text-shadow: 0 2px 14px rgba(0,0,0,0.28);
  line-height: 1;
  letter-spacing: -0.01em;
}

/* Nav */
.wc-nav {
  position: absolute;
  top: 0; left: 0; right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(12px, 2vw, 18px) clamp(16px, 3vw, 28px);
}
.wc-nav-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 1.5px solid rgba(255,255,255,0.38);
  background: rgba(255,255,255,0.18);
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s, transform 0.15s;
  backdrop-filter: blur(6px);
  line-height: 1;
}
.wc-nav-btn:hover { background: rgba(255,255,255,0.36); transform: scale(1.1); }
.wc-nav-btn:active { transform: scale(0.95); }
.wc-year {
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: rgba(255,255,255,0.78);
  background: rgba(0,0,0,0.18);
  padding: 4px 16px;
  border-radius: 20px;
  letter-spacing: 0.12em;
  backdrop-filter: blur(4px);
}

/* Stats strip */
.wc-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px clamp(16px, 3vw, 28px);
  flex-wrap: wrap;
  border-bottom: 1px solid var(--border);
  transition: border-color 0.4s;
}
.wc-chip {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: var(--muted);
  background: var(--border);
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 0.05em;
  transition: background 0.4s, color 0.4s;
}
.wc-chip b { color: var(--accent); }
.wc-chip-accent { background: var(--range); }
.wc-chip-hint { margin-left: auto; opacity: 0.6; }

/* Body layout */
.wc-body {
  display: grid;
  grid-template-columns: 1fr 320px;
}

/* Grid panel */
.wc-grid-panel {
  padding: clamp(12px, 2vw, 20px) clamp(16px, 3vw, 28px) clamp(16px, 2.5vw, 24px);
  border-right: 1px solid var(--border);
  transition: border-color 0.4s;
}

.wc-day-labels {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 6px;
}
.wc-day-label {
  text-align: center;
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: var(--muted);
  letter-spacing: 0.1em;
  padding: 4px 0;
  transition: color 0.4s;
}

.wc-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
}
@keyframes wc-slide-fwd {
  from { opacity: 0; transform: translateX(18px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes wc-slide-bwd {
  from { opacity: 0; transform: translateX(-18px); }
  to   { opacity: 1; transform: translateX(0); }
}
.wc-slide-fwd { animation: wc-slide-fwd 0.3s cubic-bezier(0.34,1.4,0.64,1); }
.wc-slide-bwd { animation: wc-slide-bwd 0.3s cubic-bezier(0.34,1.4,0.64,1); }

/* Day cells */
.wc-day {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  cursor: pointer;
  color: var(--text);
  transition: background 0.12s, color 0.12s;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.wc-day:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}
.wc-day-empty { cursor: default; opacity: 0; pointer-events: none; }
.wc-day-normal:hover { background: var(--range); }
.wc-day-today .wc-day-num { font-weight: 700; }
.wc-day-today::before {
  content: '';
  position: absolute;
  inset: 1px;
  border: 1.5px solid var(--today-ring);
  border-radius: 6px;
  opacity: 0.6;
}
.wc-day-start,
.wc-day-end {
  background: var(--accent) !important;
  color: white !important;
  font-weight: 700;
  box-shadow: 0 3px 10px var(--shadow);
  z-index: 2;
}
.wc-day-end { background: var(--accent2) !important; }
.wc-day-in-range {
  background: var(--range);
  border-radius: 0;
  color: var(--accent2);
}
.wc-days-grid > .wc-day-in-range:first-child { border-radius: 7px 0 0 7px; }
.wc-day-hov-range {
  background: var(--range);
  opacity: 0.55;
  border-radius: 0;
}

.wc-day-num {
  font-size: clamp(12px, 1.8vw, 15px);
  line-height: 1;
}
.wc-day-dots {
  display: flex;
  gap: 3px;
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
}
.wc-hdot {
  width: 3.5px; height: 3.5px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
  cursor: help;
  transition: background 0.2s;
}
.wc-hdot-inv { background: rgba(255,255,255,0.8); }
.wc-ndot {
  width: 3.5px; height: 3.5px;
  border-radius: 50%;
  background: #74b9ff;
  flex-shrink: 0;
}
.wc-day-start .wc-ndot,
.wc-day-end .wc-ndot { background: rgba(255,255,255,0.7); }

/* Tooltip */
.wc-tip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--text);
  color: var(--bg);
  font-size: 9px;
  font-family: 'DM Mono', monospace;
  padding: 4px 10px;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 30;
  pointer-events: none;
  letter-spacing: 0.04em;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.wc-tip::after {
  content: '';
  position: absolute;
  top: 100%; left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: var(--text);
}

/* Legend */
.wc-legend {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 14px;
  flex-wrap: wrap;
}
.wc-leg-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: var(--muted);
  letter-spacing: 0.06em;
}
.wc-leg-dot {
  width: 10px; height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}
.wc-leg-start { background: var(--accent); }
.wc-leg-range { background: var(--range); border: 1px solid var(--border); }
.wc-leg-today { background: transparent; border: 1.5px solid var(--accent); border-radius: 3px; }
.wc-leg-hdot  { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
.wc-leg-ndot  { width: 7px; height: 7px; border-radius: 50%; background: #74b9ff; flex-shrink: 0; }

/* Sidebar */
.wc-sidebar {
  display: flex;
  flex-direction: column;
  background: var(--paper);
  transition: background 0.4s;
  min-width: 0;
  overflow: hidden;
}
.wc-sb-section {
  padding: 18px 20px;
  border-bottom: 1px dashed var(--border);
  transition: border-color 0.4s;
}
.wc-sb-title {
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 12px;
  transition: color 0.4s;
}

/* Range cards */
.wc-range-cards { display: flex; flex-direction: column; gap: 8px; }
.wc-rcard {
  padding: 11px 13px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 7px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: background 0.4s, border-color 0.4s;
}
.wc-rl { font-family: 'DM Mono', monospace; font-size: 9px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; }
.wc-rv { font-size: 13px; font-weight: 600; color: var(--text); }
.wc-rd { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--accent); }
.wc-clear-btn {
  margin-top: 10px;
  width: 100%;
  background: none;
  border: 1px solid var(--border);
  color: var(--muted);
  padding: 7px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 11px;
  font-family: 'DM Mono', monospace;
  letter-spacing: 0.05em;
  transition: all 0.2s;
}
.wc-clear-btn:hover { border-color: var(--accent); color: var(--accent); }

/* Notes */
.wc-notes-section { flex: 1; display: flex; flex-direction: column; border-bottom: none; }
.wc-notes-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; gap: 8px; }
.wc-notes-for { font-size: 12px; color: var(--accent); font-weight: 600; margin-top: 2px; }
.wc-save-btn {
  background: var(--accent);
  color: white;
  border: none;
  padding: 7px 15px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 10px;
  font-family: 'DM Mono', monospace;
  letter-spacing: 0.05em;
  transition: all 0.25s;
  white-space: nowrap;
  flex-shrink: 0;
}
.wc-save-btn:hover { background: var(--accent2); transform: translateY(-1px); box-shadow: 0 4px 12px var(--shadow); }
.wc-save-btn:active { transform: translateY(0); }
.wc-save-flash { background: #27ae60 !important; }

.wc-textarea {
  flex: 1;
  min-height: 110px;
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 7px;
  padding: 12px 13px;
  font-family: 'Lora', serif;
  font-size: 12.5px;
  line-height: 1.75em;
  color: var(--text);
  resize: none;
  outline: none;
  transition: border-color 0.2s, background 0.4s;
}
.wc-textarea:focus { border-color: var(--accent); }
.wc-textarea::placeholder { color: var(--muted); font-style: italic; }
.wc-lined {
  background-image: repeating-linear-gradient(
    to bottom,
    transparent,
    transparent calc(1.75em - 1px),
    var(--border) calc(1.75em - 1px),
    var(--border) 1.75em
  );
  background-size: 100% 1.75em;
  background-position: 0 12px;
  background-attachment: local;
}

/* Saved notes */
.wc-saved-section { max-height: 200px; overflow: hidden; }
.wc-saved-list { overflow-y: auto; max-height: 140px; display: flex; flex-direction: column; gap: 6px; }
.wc-saved-list::-webkit-scrollbar { width: 3px; }
.wc-saved-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
.wc-sni {
  padding: 9px 11px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  flex-shrink: 0;
}
.wc-sni:hover { border-color: var(--accent); }
.wc-sni-active { border-color: var(--accent); background: var(--range); }
.wc-sni-row { display: flex; align-items: center; justify-content: space-between; }
.wc-sni-date { font-family: 'DM Mono', monospace; font-size: 9px; color: var(--accent); letter-spacing: 0.07em; }
.wc-sni-del { background: none; border: none; cursor: pointer; color: var(--muted); font-size: 14px; line-height: 1; padding: 0 2px; transition: color 0.15s; }
.wc-sni-del:hover { color: #e74c3c; }
.wc-sni-preview { font-size: 11px; color: var(--muted); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Theme strip */
.wc-theme-strip {
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-top: 1px dashed var(--border);
  margin-top: auto;
  transition: border-color 0.4s;
}
.wc-theme-label { font-family: 'DM Mono', monospace; font-size: 9px; color: var(--muted); letter-spacing: 0.12em; text-transform: uppercase; }
.wc-theme-dots { display: flex; gap: 8px; }
.wc-theme-dot {
  width: 20px; height: 20px;
  border-radius: 50%;
  border: 2.5px solid transparent;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s;
  outline: none;
}
.wc-theme-dot:hover { transform: scale(1.15); }
.wc-theme-dot-active { border-color: var(--text) !important; transform: scale(1.1); }

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 700px) {
  .wc-body { grid-template-columns: 1fr; }
  .wc-grid-panel { border-right: none; border-bottom: 1px solid var(--border); }
  .wc-sidebar { border-top: none; }
  .wc-chip-hint { display: none; }
  .wc-notes-section { min-height: 220px; }
  .wc-saved-section { max-height: none; }
}
@media (max-width: 420px) {
  .wc-day-label { font-size: 9px; letter-spacing: 0; }
  .wc-nav-btn { width: 30px; height: 30px; font-size: 17px; }
  .wc-legend { gap: 9px; }
}
`;
