# Mandala Chart / マンダラチャート

A goal-decomposition framework popularized by baseball player Shohei Ohtani: a 9×9 grid (81 cells) where the centre cell holds a main goal, surrounded by 8 sub-themes, and each sub-theme expands into 8 concrete actions.

This repository provides two ways to generate one:

1. **Web version** (`/src`) — React + Vite + Tailwind, talks to a local Ollama instance.
2. **Google AI Edge Gallery skill** (`/edge-skill`) — runs entirely on-device through the [AI Edge Gallery](https://github.com/google-ai-edge/gallery) Android / iOS app, powered by on-device Gemma.

---

## 🚀 Try the Skill (Mobile)

The skill is hosted on GitHub Pages and can be installed directly from the AI Edge Gallery app:

> **`https://emptyprotocol.github.io/mandara_chart/`**

In the Gallery app: **Skills → ＋ → Add from URL** → paste the URL above.

### How it works (2-stage flow)

The skill emits a small JSON payload to keep on-device generation fast:

#### 1️⃣ Initial — main theme + 8 sub-themes only

```
User: マンダラチャート: 京大経済学部に合格するには
```

Gemma generates only 9 strings (1 main + 8 sub-themes), the chart shows the centre 3×3 block filled and the 8 outer blocks as `＋` placeholders.

#### 2️⃣ Tap a `＋` block → fill that section

Tap an empty block → a modal appears with a copy-ready prompt:

```
「学力」のアクション8つ
```

Paste it back into the chat and send. Gemma replies with 8 actions for that single sub-theme, the chart re-renders with that block fully filled.

Repeat per block as needed. This avoids generating all 73 strings in one shot — the source of timeouts and freezes on lower-RAM devices.

---

## 📱 iPad / iOS notes (known limitation)

The Gallery app's iOS build accumulates embedded WebViews per preview card. After several skill calls in the same chat session, memory pressure can freeze the chat or the whole device — especially with `Gemma-4-E2B-it` already resident. The HTML / CSS / JS itself is fine and verified to load correctly in iPad Safari directly.

### Recommended workflow on iPad

| Symptom | Workaround |
|---|---|
| Preview card stays black, "View in full screen" button shows but Gallery is locked | Force-quit Gallery, restart iPad, retry with a **fresh chat** |
| Want to view the chart even if the embedded preview fails | Tap the **▼** next to "Called JS skill" to expand. Copy the `data` JSON, then open the chart in Safari directly using the link in [Safari direct-open](#safari-direct-open) below |
| Repeated freezes after 2-3 turns | Switch to a smaller model (Gemma 3 1B etc.) or test on Android |

### Safari direct-open

The same `mandala.html` and `preview.html` files served to the Gallery work just as well in regular Safari:

- Preview card: `https://emptyprotocol.github.io/mandara_chart/assets/preview.html?t=テスト&l=ja&d=<base64>`
- Full grid: `https://emptyprotocol.github.io/mandara_chart/assets/mandala.html?d=<base64>`

Where `<base64>` is `btoa(unescape(encodeURIComponent(JSON.stringify(payload))))` of:

```json
{
  "mainTheme": "GOAL",
  "language": "ja",
  "subThemes": [
    { "theme": "サブテーマ1", "actions": ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8"] }
    /* exactly 8 entries */
  ]
}
```

---

## 🤖 Skill internals

```
edge-skill/
├── .nojekyll                  # GitHub Pages: serve _-prefixed files as-is
├── SKILL.md                   # Frontmatter + LLM instructions (loaded by Gallery)
├── scripts/
│   ├── index.html             # Loader for index.js
│   └── index.js               # window['ai_edge_gallery_get_result'] entry
└── assets/
    ├── preview.html           # Preview card (the "tap me" surface in chat)
    └── mandala.html           # Full 9×9 interactive grid
```

### `scripts/index.js` highlights

- Lenient JSON parser: tolerates LLM glitches (smart quotes, trailing commas, prose preamble around the `{}`).
- Pads short arrays / truncates long ones — never returns an error to the LLM, never triggers a retry loop.
- Accepts both **short keys** (`m`, `l`, `s`, `t`, `a`) and legacy long keys (`mainTheme`, …) — short keys reduce Gemma's output tokens by ~20 %.

### `assets/mandala.html` highlights

- 9×9 CSS grid, 8 hue palette (0°/30°/60°/120°/175°/210°/260°/320°).
- Empty action cells render as dashed-border placeholders inside an `empty-block` overlay marked with `＋`.
- Tap an empty block → modal with a copy-to-clipboard prompt (`「<theme>」のアクション8つ`) for the next round-trip.
- Tap a filled cell → text-only modal with the cell content (label + value).
- "Save as image" exports the entire grid as a PNG via SVG → canvas.

---

## 🌐 Web version (Ollama)

The original React web app lives in `/src`. It uses a local [Ollama](https://ollama.ai) install for generation and exports to PDF via the browser print dialog.

```bash
npm install
npm run dev   # http://localhost:5173
```

The web version generates all 73 strings up front (no 2-stage flow) since a desktop machine can comfortably handle the full payload.

---

## 🛠️ Development

### Test the skill locally without the Gallery app

```bash
# Serve the edge-skill folder over HTTP
npx http-server edge-skill -p 5174 -c-1
```

Then open:

- `http://localhost:5174/scripts/index.html` — load it once, then in DevTools call `await ai_edge_gallery_get_result(JSON.stringify(samplePayload))` to see the returned webview URL.
- `http://localhost:5174/assets/preview.html?t=テスト&l=ja&d=<base64>` — preview card render.
- `http://localhost:5174/assets/mandala.html?d=<base64>` — full grid render.

### Branches

- **`main`** — full repo (React web app + edge-skill source).
- **`gh-pages`** — the contents of `edge-skill/` flattened to the root, served by GitHub Pages at the URL above.

---

## 📄 License

The Web version, the skill, and the assets in this repo are MIT-licensed. The Mandala Chart concept itself is in the public domain (a centuries-old visualisation technique).
