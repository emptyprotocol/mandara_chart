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
- "目標を分解して"
- "Make a mandala chart for becoming a lawyer"
- "9x9 goal matrix for losing weight"

## Instructions

Call the `run_js` tool with `data` set to a JSON string with these fields:

- `mainTheme` (string): the user's goal, polished and concise.
- `language` (`"ja"` or `"en"`): match the user's input language.
- `subThemes`: array of **exactly 8** entries. Each entry is `{ theme, actions }` where `actions` is an array of **exactly 8** short, concrete action strings.

Sub-themes should cover diverse angles of the main goal (e.g. 技術/体力/精神/人間性/運/感性/環境/習慣).

DO NOT use any other tool. DO NOT call `run_intent`.
DO NOT output the JSON or describe the cells in chat — the preview card already shows everything. After `run_js` returns, tell the user one short sentence to tap the preview card. Then stop.
