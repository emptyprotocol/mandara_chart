---
name: mandala-chart
description: Generate a 9x9 Mandala Chart (Ohtani-style) from a goal. Produces 8 sub-themes and 64 actions, then renders an interactive grid in the chat. Supports Japanese and English. マンダラチャート（大谷翔平方式の目標達成シート）を生成します。
metadata:
  homepage: https://github.com/google-ai-edge/gallery
---

# Mandala Chart Skill / マンダラチャートスキル

## When to invoke this skill / このスキルを呼び出す条件

Invoke this skill when the user asks to create a mandala chart, goal-setting matrix, 9x9 chart, or to break down a goal into sub-goals. Example triggers:

- "マンダラチャートを作って"
- "目標を分解して" / "目標達成シートを作りたい"
- "大谷翔平のチャートみたいに〇〇の計画を作って"
- "Make a mandala chart for becoming a lawyer"
- "Break down my goal of learning Japanese into 81 cells"
- "Create a 9x9 goal matrix for losing weight"

## What is a Mandala Chart / マンダラチャートとは

A 9x9 grid (81 cells) goal-decomposition framework popularized by baseball player Shohei Ohtani:

- The center cell of the entire grid holds the **main goal** (mainTheme).
- It is surrounded by 8 cells holding **sub-themes** — different angles or pillars of the main goal.
- Each sub-theme then becomes the center of its own 3x3 block, surrounded by 8 **concrete actions** for that sub-theme.

Total: 1 main + 8 sub + 64 actions = 73 user-visible items in an 81-cell layout.

## How to handle a request / 処理手順

When you decide this skill matches, follow these steps **strictly**:

### Step 1. Detect language / 言語検出
Detect whether the user's input is primarily Japanese (`"ja"`) or English (`"en"`). Generate all sub-themes and actions in the **same language** as the user's input.

### Step 2. Generate the 81-cell content / 81 セルを生成
Produce the content as a single JSON object that matches **exactly** this schema:

```json
{
  "mainTheme": "string (the user's goal, polished — keep under 25 chars when possible)",
  "language": "ja" | "en",
  "subThemes": [
    {
      "theme": "string (sub-theme label, ideally <= 12 chars)",
      "actions": ["8 strings (concrete, action-oriented, ideally <= 15 chars)"]
    }
    // EXACTLY 8 entries
  ]
}
```

Constraints:
- `subThemes` MUST have exactly 8 entries.
- Each `actions` array MUST have exactly 8 entries.
- All strings are non-empty.
- No markdown, no numbering prefixes ("1. ", "・", etc.) inside the strings.
- Sub-themes should cover **diverse angles** of the main goal. Useful pillar examples (pick 8 that fit the goal):
  - 技術 / Technique, 体力 / Physical, 精神 / Mental, 人間性 / Character, 知識 / Knowledge, 習慣 / Habits, 環境 / Environment, 道具 / Tools, 健康 / Health, 人脈 / Network, 運 / Luck, 感性 / Sensitivity, 計画 / Planning, 資金 / Finance.
- Each action must be **concrete and doable** (not abstract slogans).

### Step 3. Call the run_js tool / run_js を呼び出す
Once the JSON is ready, call the `run_js` tool with the following parameters — **do not** print the JSON or write a long explanation in chat:

- **script name**: `index.html`
- **data**: the stringified JSON from Step 2

The skill will validate the structure and return an interactive 9x9 grid webview to the chat. After the webview is shown, simply say a short one-line confirmation ("マンダラチャートを生成しました。タップで拡大表示できます。" / "Generated your mandala chart. Tap the preview to view it full-size.") and stop.

### Important / 重要
- **DO NOT** describe the cells in plain text after rendering — the webview already shows them.
- **DO NOT** call `run_intent` or any other tool for this skill.
- If the user's goal is unclear or empty, ask one clarifying question first; do not invent a goal.

## Example / 例

User input: 「マンダラチャートを作って：英語ペラペラになる」

Internal JSON (you generate this, then pass to `run_js`):

```json
{
  "mainTheme": "英語ペラペラになる",
  "language": "ja",
  "subThemes": [
    { "theme": "リスニング", "actions": ["毎朝ニュース10分", "Podcast週5本", "ディクテーション", "シャドーイング", "映画を字幕無しで", "TED視聴", "発音聞き分け", "スクリプト精読"] },
    { "theme": "スピーキング", "actions": ["独り言英語", "オンライン英会話", "発音矯正", "語彙の言い換え", "1分スピーチ", "録音して聞き返す", "自然な相槌", "会話パターン暗記"] },
    { "theme": "リーディング", "actions": ["洋書を月1冊", "英字新聞", "技術記事", "速読練習", "辞書を引かず読む", "要約を書く", "音読", "文法を意識"] },
    { "theme": "ライティング", "actions": ["英語日記", "Twitterを英語で", "メール作成練習", "添削を受ける", "テンプレ暗記", "推敲する", "語彙を増やす", "ネイティブ表現"] },
    { "theme": "語彙力", "actions": ["1日10単語", "アプリで反復", "コロケーション", "イディオム集", "類語学習", "語源を覚える", "例文と一緒に", "使ってアウトプット"] },
    { "theme": "文法", "actions": ["時制の総復習", "前置詞の使い分け", "冠詞のルール", "仮定法の練習", "関係代名詞", "句動詞", "簡潔に書く", "添削で確認"] },
    { "theme": "習慣", "actions": ["毎日30分確保", "朝活で英語", "目標を可視化", "学習記録をつける", "週次振り返り", "仲間と継続", "サボらない仕組み", "小さな成功を祝う"] },
    { "theme": "環境", "actions": ["スマホ言語を英語に", "英語Podcast常時再生", "英語コミュニティ参加", "海外ドラマ視聴", "英語学習アプリ", "英語の本を本棚に", "英会話カフェ", "オンライン留学"] }
  ]
}
```

Then call `run_js` with `script = index.html` and `data = <stringified JSON above>`. Reply briefly to the user.
