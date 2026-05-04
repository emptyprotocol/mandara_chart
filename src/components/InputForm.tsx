interface Props {
  mainTheme: string
  onMainThemeChange: (v: string) => void
  selectedModel: string
  models: string[]
  onModelChange: (v: string) => void
  onGenerate: () => void
  onReset: () => void
  isGenerating: boolean
  status: string
  progressText: string
  error: string | null
  hasDone: boolean
}

export default function InputForm({
  mainTheme,
  onMainThemeChange,
  selectedModel,
  models,
  onModelChange,
  onGenerate,
  onReset,
  isGenerating,
  progressText,
  error,
  hasDone,
}: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            メインテーマ・目標
          </label>
          <input
            type="text"
            value={mainTheme}
            onChange={(e) => onMainThemeChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isGenerating && mainTheme.trim() && onGenerate()}
            placeholder="例: プロ野球選手になる、英語をマスターする..."
            disabled={isGenerating}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-100"
          />
        </div>

        <div className="min-w-48">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            モデル
          </label>
          {models.length === 0 ? (
            <div className="border border-red-300 bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2.5">
              Ollamaに接続できません
            </div>
          ) : (
            <select
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              disabled={isGenerating}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-100 bg-white"
            >
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onGenerate}
            disabled={isGenerating || !mainTheme.trim() || !selectedModel}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            {isGenerating ? '生成中...' : '✨ 生成'}
          </button>
          {hasDone && (
            <button
              onClick={onReset}
              disabled={isGenerating}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              リセット
            </button>
          )}
        </div>
      </div>

      {isGenerating && progressText && (
        <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600">
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          {progressText}
        </div>
      )}

      {error && (
        <div className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          ⚠️ {error}
        </div>
      )}
    </div>
  )
}
