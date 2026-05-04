const BASE = '/ollama'

export async function listModels(): Promise<string[]> {
  const res = await fetch(`${BASE}/api/tags`)
  if (!res.ok) throw new Error('Ollamaに接続できません。Ollamaが起動しているか確認してください。')
  const data = await res.json()
  return (data.models ?? []).map((m: { name: string }) => m.name)
}

// format:"json" でモデルに有効なJSONを強制させる
async function generateJson(model: string, prompt: string): Promise<string> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      format: 'json',
      options: { temperature: 0.7, num_predict: 800 },
    }),
  })
  if (!res.ok) throw new Error(`生成エラー: ${res.statusText}`)
  const data = await res.json()
  return data.message?.content ?? ''
}

function repairJsonArray(broken: string): string {
  let s = broken.trim()
  let inStr = false, esc = false
  for (const ch of s) {
    if (esc) { esc = false; continue }
    if (ch === '\\') { esc = true; continue }
    if (ch === '"') inStr = !inStr
  }
  if (inStr) s += '"'
  s = s.replace(/,\s*$/, '')
  if (!s.endsWith(']')) s += ']'
  return s
}

export function extractJsonArray(text: string): string[] {
  // 試行1: テキスト全体を直接 JSON パース（format:"json" 時の理想形）
  try {
    const obj = JSON.parse(text)
    if (Array.isArray(obj) && obj.length > 0) return obj.map(String)
    if (obj && typeof obj === 'object') {
      // {"items": [...]} や {"themes": [...]} など任意のキーを探す
      for (const val of Object.values(obj)) {
        if (Array.isArray(val) && val.length > 0) return (val as unknown[]).map(String)
      }
    }
  } catch { /* 次へ */ }

  // 試行2: テキスト内の JSON 配列を抽出（最長一致）
  const arrayMatch = text.match(/\[[\s\S]*\]/)
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0])
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(String)
    } catch {}
    try {
      const parsed = JSON.parse(repairJsonArray(arrayMatch[0]))
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(String)
    } catch {}
  }

  // 試行3: "..." の文字列をすべて抽出
  const quoted = [...text.matchAll(/"((?:[^"\\]|\\.)*)"/g)]
    .map(m => m[1].trim())
    .filter(s => s.length > 1 && s.length < 60)
  if (quoted.length >= 2) return quoted

  // 試行4: 番号付きリスト (1. / 1) 形式)
  const numbered = [...text.matchAll(/^\s*\d+[\.\)]\s*(.+)$/gm)]
    .map(m => m[1].trim()).filter(s => s.length > 0)
  if (numbered.length >= 2) return numbered

  // 試行5: 箇条書き (- / • / ・ 形式)
  const bulleted = [...text.matchAll(/^\s*[-•*・]\s*(.+)$/gm)]
    .map(m => m[1].trim()).filter(s => s.length > 0)
  if (bulleted.length >= 2) return bulleted

  // 試行6: 2文字以上50文字以下の非空行
  const lines = text.split('\n')
    .map(l => l.replace(/^["'\s*\-・]+/, '').replace(/["',\s]+$/, '').trim())
    .filter(l => l.length >= 2 && l.length <= 50)
  if (lines.length >= 2) return lines

  throw new Error('AIの出力からリストを抽出できませんでした。モデルを変えるか再度お試しください。')
}

export function buildSubThemesPrompt(mainTheme: string): string {
  return `メインテーマ「${mainTheme}」のマンダラチャート用サブテーマを8つ生成してください。

必ず次のJSON形式のみで返答してください:
{"items": ["サブテーマ1", "サブテーマ2", "サブテーマ3", "サブテーマ4", "サブテーマ5", "サブテーマ6", "サブテーマ7", "サブテーマ8"]}`
}

export function buildActionsPrompt(mainTheme: string, subTheme: string): string {
  return `マンダラチャートで「${mainTheme}」のサブテーマ「${subTheme}」に関する具体的なアクションを8つ生成してください。各項目15文字以内。

必ず次のJSON形式のみで返答してください:
{"items": ["アクション1", "アクション2", "アクション3", "アクション4", "アクション5", "アクション6", "アクション7", "アクション8"]}`
}

// リトライ付き生成（失敗時に1回再試行）
export async function generateList(model: string, prompt: string): Promise<string[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await generateJson(model, prompt)
      return extractJsonArray(text)
    } catch (err) {
      if (attempt === 1) throw err
    }
  }
  return []
}
