# 🗓 Wall Calendar — Interactive React Component

> A polished, responsive wall calendar built for the Frontend Engineering Challenge.  
> Zero UI libraries. Pure React + CSS custom properties.

---

## Live Demo

Deploy the `dist/` folder to Vercel / Netlify with one click — no server config needed.

---

## Running Locally

```bash
git clone <your-repo-url>
cd wall-calendar
npm install
npm run dev        # → http://localhost:5173
```

### Build for production
```bash
npm run build      # output → dist/
npm run preview    # preview the production build
```

**Requirements:** Node 18+

---

## Features

### Core (all requirements met)

| Requirement | Implementation |
|---|---|
| Wall Calendar Aesthetic | Punched-hole top bar, monthly hero gradient panel with floating emoji, physical layout proportions |
| Day Range Selector | Click → start, click again → end. Visual states: start (accent), end (dark accent), in-range fill, live hover preview |
| Integrated Notes | Per-day or per-month notes on lined paper, persisted to `localStorage`. Saved notes list with delete. |
| Fully Responsive | Desktop: side-by-side panels. Mobile (≤700px): stacked vertically, touch-friendly |

### Extras (standing out)

- **4 Themes** — Warm terracotta · Cool slate · Forest green · Midnight dark — toggle at bottom of sidebar
- **12 Seasonal Months** — each month has a unique gradient, animated floating emoji, and flavour text
- **Holiday Markers** — dot on US public holidays, hover tooltip on the dot
- **Note Dots** — blue dot on dates with saved notes (distinct from holiday dots)
- **Stats Bar** — shows days in month, selected range length, notes count
- **Keyboard Navigation** — `←` `→` to flip months · `⌘S` / `Ctrl+S` to save notes
- **Slide animation** — grid slides in direction of navigation on month change
- **Full accessibility** — `aria-label` on all interactive elements, `role="button"` on day cells, `:focus-visible` ring
- **Legend** — visual key explaining all dot/ring states

---

## Architecture

```
src/
├── main.jsx           # React entry point
└── WallCalendar.jsx   # Single self-contained component
```

The entire component lives in one file — intentional. It makes it trivial to drop into any existing React project.

### State (all local `useState`)

| State | Purpose |
|---|---|
| `viewYear`, `viewMonth` | Which month is shown |
| `rangeStart`, `rangeEnd` | Selected date range |
| `hovered` | Day under cursor (hover preview) |
| `tipDay` | Which day's holiday tooltip is open |
| `notes` | `{ [key]: string }` — synced to `localStorage` |
| `noteText` | Controlled textarea value |
| `theme` | Active CSS theme name |
| `savedFlash` | Green flash on save button |
| `animDir`, `animKey` | Slide animation direction + re-mount trigger |

No Redux, no Context, no external state library — this component's state is entirely self-contained.

### Theming

Four themes are plain objects of CSS custom property values, applied inline on the root element. Switching is instant with no re-render cost beyond the style flush.

```js
const THEMES = {
  warm:     { "--accent": "#c87941", "--bg": "#faf6f0", ... },
  cool:     { "--accent": "#4a7aaa", "--bg": "#f0f4f8", ... },
  forest:   { "--accent": "#4a8a4a", "--bg": "#f0f5ee", ... },
  midnight: { "--accent": "#e8956d", "--bg": "#0e1117", ... },
}
```

### Data Persistence

Notes use `localStorage` keyed as `${year}-${month}-${day}` (or `${year}-${month}` for month-level notes). No backend, no cookies.

---

## Design Decisions

| Choice | Reason |
|---|---|
| **Playfair Display** for month name | Evokes editorial magazine / luxury planner — immediately distinguished |
| **DM Mono** for labels, stats, date tags | Clean mechanical contrast against serif body copy |
| **Lora** for body + notes text | Warm, readable serif; feels slightly hand-crafted |
| **Punched-hole top bar** | The single strongest physical calendar cue — sets the aesthetic immediately |
| **Per-month gradients** (not images) | Seasonal personality without heavy assets; fast, themeable |
| **Scoped `<style>` tag in component** | Zero global CSS leakage — component is fully portable |
| **No UI libraries** | Demonstrates CSS and layout fundamentals directly |

---

## Browser Support

Tested in Chrome 124+, Firefox 126+, Safari 17+, iOS Safari 17+.  
Uses: CSS Grid, CSS custom properties, `aspect-ratio`, `backdrop-filter`.
