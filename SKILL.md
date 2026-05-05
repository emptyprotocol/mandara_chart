---
name: mandala-chart
description: Generate a 9x9 Mandala Chart (Ohtani-style) from a goal. Renders an interactive grid in the chat. Supports Japanese and English. マンダラチャート（大谷翔平方式の目標達成シート）を生成します。
metadata:
  homepage: https://emptyprotocol.github.io/mandara_chart/
---

# Mandala Chart

## Examples
- "マンダラチャート: 〇〇"
- "Mandala chart for X"

## Instructions

Call `run_js` once with `data` set to a compact JSON string (no whitespace, single short keys):

```
{"m":"GOAL","l":"ja","s":[{"t":"THEME","a":["A1","A2","A3","A4","A5","A6","A7","A8"]}, ... 8 entries total]}
```

- `m`: the goal (main theme), in the user's language.
- `l`: `ja` or `en` matching the input.
- `s`: array of 8 entries, each `{t, a}` — `t` is a sub-theme label, `a` is 8 short concrete actions covering that sub-theme.

Keep every string short. Cover diverse angles for `t` (技術/体力/精神/人間性/運/環境 …).

After the tool call, **stop**. Output nothing else — no narration, no apology, no retry.
