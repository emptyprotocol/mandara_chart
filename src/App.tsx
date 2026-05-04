import { useEffect, useState, useCallback } from 'react'
import InputForm from './components/InputForm'
import MandaraGrid from './components/MandaraGrid'
import {
  listModels,
  generateList,
  buildSubThemesPrompt,
  buildActionsPrompt,
} from './services/ollama'
import { MandalaData, GenerationStatus } from './types/mandala'

export default function App() {
  const [mainTheme, setMainTheme] = useState('')
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [status, setStatus] = useState<GenerationStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [progressText, setProgressText] = useState('')
  const [data, setData] = useState<MandalaData | null>(null)

  useEffect(() => {
    listModels()
      .then((ms) => {
        setModels(ms)
        if (ms.length > 0) setSelectedModel(ms[0])
      })
      .catch(() => setError('Ollamaへの接続に失敗しました。Ollamaが起動していることを確認してください。'))
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!mainTheme.trim() || !selectedModel) return
    setError(null)
    setData(null)
    setStatus('generating-themes')
    setProgressText('サブテーマを生成中...')

    try {
      // Step 1: generate 8 sub-themes
      const subThemeTexts = (await generateList(selectedModel, buildSubThemesPrompt(mainTheme))).slice(0, 8)
      while (subThemeTexts.length < 8) subThemeTexts.push(`テーマ${subThemeTexts.length + 1}`)

      const initial: MandalaData = {
        mainTheme: mainTheme.trim(),
        subThemes: subThemeTexts.map((t) => ({
          theme: t,
          actions: Array(8).fill(null),
          isGenerating: false,
          isGenerated: false,
        })),
      }
      setData({ ...initial })
      setStatus('generating-actions')

      // Step 2: generate 8 actions for each sub-theme sequentially
      for (let i = 0; i < 8; i++) {
        const sub = initial.subThemes[i]!
        setProgressText(`アクションを生成中... (${i + 1}/8) — ${sub.theme}`)

        setData((prev) => {
          if (!prev) return prev
          const updated = [...prev.subThemes]
          updated[i] = { ...sub, isGenerating: true }
          return { ...prev, subThemes: updated }
        })

        const actionTexts = (await generateList(
          selectedModel,
          buildActionsPrompt(mainTheme.trim(), sub.theme),
        )).slice(0, 8)
        while (actionTexts.length < 8) actionTexts.push(`アクション${actionTexts.length + 1}`)

        initial.subThemes[i] = {
          ...sub,
          actions: actionTexts,
          isGenerating: false,
          isGenerated: true,
        }
        setData({ ...initial, subThemes: [...initial.subThemes] })
      }

      setStatus('done')
      setProgressText('')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : '生成中にエラーが発生しました')
      setProgressText('')
      // isGenerating フラグが残ったままになるのを防ぐ
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          subThemes: prev.subThemes.map((s) => s ? { ...s, isGenerating: false } : s),
        }
      })
    }
  }, [mainTheme, selectedModel])

  const handleReset = () => {
    setData(null)
    setStatus('idle')
    setError(null)
    setProgressText('')
  }

  const isGenerating = status === 'generating-themes' || status === 'generating-actions'

  return (
    <div className="app-wrapper min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="app-content max-w-5xl mx-auto px-4 py-8">
        {/* Header — hidden during print */}
        <div className="no-print text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            🎯 AI マンダラチャート
          </h1>
          <p className="text-gray-500 text-sm">
            目標を入力するとOllamaがサブテーマ・アクションを自動生成します
          </p>
        </div>

        {/* Input form — hidden during print */}
        <div className="no-print">
          <InputForm
            mainTheme={mainTheme}
            onMainThemeChange={setMainTheme}
            selectedModel={selectedModel}
            models={models}
            onModelChange={setSelectedModel}
            onGenerate={handleGenerate}
            onReset={handleReset}
            isGenerating={isGenerating}
            status={status}
            progressText={progressText}
            error={error}
            hasDone={status === 'done'}
          />
        </div>

        {/* Print-only title */}
        {data && (
          <div className="print-only">
            マンダラチャート — {data.mainTheme}
          </div>
        )}

        <MandaraGrid data={data} isGenerating={isGenerating} />

        {status === 'done' && (
          <div className="no-print text-center mt-6">
            <button
              onClick={() => window.print()}
              className="px-5 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              🖨️ 印刷 / PDF保存
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
