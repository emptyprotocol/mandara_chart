---
name: mandala-chart
description: Generate a 9x9 Mandala Chart (Ohtani-style) from a goal — 8 sub-themes and 64 actions rendered as an interactive grid. Supports Japanese and English. マンダラチャート（大谷翔平方式の目標達成シート）を生成します。
metadata:
  homepage: https://emptyprotocol.github.io/mandara_chart/
---

# Mandala Chart

A 9x9 grid (81 cells) goal-decomposition framework. Center cell holds the main goal, surrounded by 8 sub-themes; each sub-theme is the center of its own 3x3 block of 8 concrete actions.

## Examples
- "マンダラチャートを作って: 〇〇"
- "Make a mandala chart for becoming a lawyer"

## Instructions

Call `run_js` exactly once with `data` set to a JSON string containing:
- `mainTheme` (string): the user's goal in their input language.
- `language`: `"ja"` or `"en"` matching the input.
- `subThemes`: an array of 8 entries; each entry is `{ theme, actions }` where `actions` is an array of 8 short concrete strings.

Sub-themes should cover diverse angles (技術/体力/精神/人間性/運/感性/環境/習慣).

**After calling `run_js`, stop immediately. Do not write anything else.** The preview card and its result message are shown by the gallery automatically — any extra narration from you wastes tokens, slows the response, and can lock the chat. No apologies, no explanations, no retries even if the call returns an error.

DO NOT use any other tool. DO NOT call `run_intent`.
