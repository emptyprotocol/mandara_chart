---
name: mandala-chart
description: Generate a 9x9 Mandala Chart (Ohtani-style) from a goal. Renders an interactive grid in the chat. Supports Japanese and English. マンダラチャート（大谷翔平方式の目標達成シート）を生成します。
metadata:
  homepage: https://emptyprotocol.github.io/mandara_chart/
---

# Mandala Chart

Two-stage generation to keep latency low on mobile:
1. **Initial**: emit only the main theme + 8 sub-themes (9 strings).
2. **Refine**: when the user taps a sub-theme block and pastes the resulting prompt, emit the 8 actions for that single sub-theme.

## Examples
- "マンダラチャート: 〇〇"
- "Mandala chart for X"
- "「学力」のアクション8つ"  (follow-up, requesting actions)
- "Actions for sub-theme 〇〇"  (follow-up)

## Instructions

### Initial request — main theme phrasing

Call `run_js` once with `data` as compact JSON, **no actions**:

```
{"m":"GOAL","l":"ja","s":[{"t":"T1"},{"t":"T2"},{"t":"T3"},{"t":"T4"},{"t":"T5"},{"t":"T6"},{"t":"T7"},{"t":"T8"}]}
```

- `m`: the goal (main theme), in the user's language.
- `l`: `ja` or `en` matching the input.
- `s`: array of 8 entries, each `{t}` only — `t` is a short sub-theme label covering a diverse angle (技術/体力/精神/人間性/運/感性/環境/習慣 etc.). **Do not generate the `a` (actions) arrays in this round.**

### Follow-up request — single sub-theme actions

When the user prompt names one sub-theme to fill (e.g. "「学力」のアクション8つ", "Actions for リスニング"), call `run_js` once with `data` as compact JSON containing the **complete chart**: the original main theme, all 8 sub-theme labels (carry them over from earlier in the conversation), and the `a` array filled in **only for the matching sub-theme**:

```
{"m":"GOAL","l":"ja","s":[{"t":"T1"},{"t":"T2","a":["A1","A2","A3","A4","A5","A6","A7","A8"]},{"t":"T3"}, ... ]}
```

Other sub-themes leave `a` out (they will render as placeholders again, ready to be tapped next).

### Universal rules

After the tool call, **stop**. Do not write any chat text — no commentary, no apology, no retry, even if the call returns an error. The gallery shows the result automatically.

DO NOT use any other tool. DO NOT call `run_intent`.
