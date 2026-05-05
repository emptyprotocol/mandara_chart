import { useEffect, useState, useCallback, useMemo } from 'react'
import InputForm from './components/InputForm'
import MandaraGrid from './components/MandaraGrid'
import HistoryTree, { TreeNode } from './components/HistoryTree'
import {
  listModels,
  generateList,
  buildSubThemesPrompt,
  buildActionsPrompt,
} from './services/ollama'
import { MandalaData, GenerationStatus } from './types/mandala'

let nodeCounter = 0
const newId = () => `n${++nodeCounter}_${Date.now().toString(36)}`

export default function App() {
  const [mainTheme, setMainTheme] = useState('')
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [status, setStatus] = useState<GenerationStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [progressText, setProgressText] = useState('')
  const [data, setData] = useState<MandalaData | null>(null)

  // ツリー履歴
  const [nodes, setNodes] = useState<Record<string, TreeNode>>({})
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null)

  useEffect(() => {
    listModels()
      .then((ms) => {
        setModels(ms)
        if (ms.length > 0) setSelectedModel(ms[0])
      })
      .catch(() => setError('Ollamaへの接続に失敗しました。Ollamaが起動していることを確認してください。'))
  }, [])

  // 生成本体
  const generate = useCallback(async (theme: string, parentId: string | null) => {
    if (!theme.trim() || !selectedModel) return
    setMainTheme(theme)
    setError(null)
    setData(null)
    setStatus('generating-themes')
    setProgressText('サブテーマを生成中...')

    try {
      const subThemeTexts = (await generateList(selectedModel, buildSubThemesPrompt(theme))).slice(0, 8)
      while (subThemeTexts.length < 8) subThemeTexts.push(`テーマ${subThemeTexts.length + 1}`)

      const initial: MandalaData = {
        mainTheme: theme,
        subThemes: subThemeTexts.map((t) => ({
          theme: t,
          actions: Array(8).fill(null),
          isGenerating: false,
          isGenerated: false,
        })),
      }
      setData({ ...initial })
      setStatus('generating-actions')

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
          buildActionsPrompt(theme, sub.theme),
        )).slice(0, 8)
        while (actionTexts.length < 8) actionTexts.push(`アクション${actionTexts.length + 1}`)

        initial.subThemes[i] = { ...sub, actions: actionTexts, isGenerating: false, isGenerated: true }
        setData({ ...initial, subThemes: [...initial.subThemes] })
      }

      // 完成したらツリーに追加
      const id = newId()
      const node: TreeNode = {
        id,
        theme,
        data: { ...initial, subThemes: [...initial.subThemes] },
        parentId,
        childIds: [],
      }
      setNodes((prev) => {
        const updated: Record<string, TreeNode> = { ...prev, [id]: node }
        if (parentId && updated[parentId]) {
          updated[parentId] = {
            ...updated[parentId],
            childIds: [...updated[parentId].childIds, id],
          }
        }
        return updated
      })
      setCurrentNodeId(id)

      setStatus('done')
      setProgressText('')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : '生成中にエラーが発生しました')
      setProgressText('')
      setData((prev) => {
        if (!prev) return prev
        return { ...prev, subThemes: prev.subThemes.map((s) => s ? { ...s, isGenerating: false } : s) }
      })
    }
  }, [selectedModel])

  // 入力フォームの「生成」ボタン → 新しいルートとして追加
  const handleGenerate = useCallback(() => generate(mainTheme, null), [generate, mainTheme])

  // セルクリック → 既存子があればそれに切替、無ければ生成して子として追加
  const handleCellClick = useCallback((text: string) => {
    if (currentNodeId && nodes[currentNodeId]) {
      const existing = nodes[currentNodeId].childIds
        .map((id) => nodes[id])
        .find((n) => n && n.theme === text)
      if (existing) {
        setCurrentNodeId(existing.id)
        setMainTheme(existing.theme)
        setData(existing.data)
        setStatus('done')
        setError(null)
        return
      }
    }
    generate(text, currentNodeId)
  }, [generate, currentNodeId, nodes])

  // ツリーノードクリック → そのノードに切替（再生成なし）
  const handleNodeClick = useCallback((id: string) => {
    const node = nodes[id]
    if (!node) return
    setCurrentNodeId(id)
    setMainTheme(node.theme)
    setData(node.data)
    setStatus('done')
    setError(null)
    setProgressText('')
  }, [nodes])

  // ツリーノード削除（子孫も再帰的に削除）
  const handleNodeDelete = useCallback((id: string) => {
    setNodes((prev) => {
      const updated = { ...prev }
      const toDelete: string[] = []
      const collect = (nid: string) => {
        toDelete.push(nid)
        const n = updated[nid]
        if (n) n.childIds.forEach(collect)
      }
      collect(id)

      // 親から自分を削除
      const target = updated[id]
      if (target?.parentId && updated[target.parentId]) {
        updated[target.parentId] = {
          ...updated[target.parentId],
          childIds: updated[target.parentId].childIds.filter((c) => c !== id),
        }
      }
      toDelete.forEach((d) => delete updated[d])
      return updated
    })

    // 削除したのが現在表示中なら親に切替
    if (currentNodeId && (id === currentNodeId || isAncestor(nodes, id, currentNodeId))) {
      const parent = nodes[id]?.parentId
      if (parent && nodes[parent]) {
        handleNodeClick(parent)
      } else {
        setCurrentNodeId(null)
        setData(null)
        setMainTheme('')
        setStatus('idle')
      }
    }
  }, [nodes, currentNodeId, handleNodeClick])

  const handleReset = () => {
    setData(null)
    setStatus('idle')
    setError(null)
    setProgressText('')
    setNodes({})
    setCurrentNodeId(null)
    setMainTheme('')
  }

  // ルートノード（parentId が null）
  const rootIds = useMemo(
    () => Object.values(nodes).filter((n) => n.parentId === null).map((n) => n.id),
    [nodes],
  )

  // 現在ノードからルートまでのパス
  const breadcrumbPath = useMemo(() => {
    const path: TreeNode[] = []
    let cur: TreeNode | undefined = currentNodeId ? nodes[currentNodeId] : undefined
    while (cur) {
      path.unshift(cur)
      cur = cur.parentId ? nodes[cur.parentId] : undefined
    }
    return path
  }, [nodes, currentNodeId])

  const isGenerating = status === 'generating-themes' || status === 'generating-actions'

  return (
    <div className="app-wrapper min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="app-content max-w-5xl mx-auto px-4 py-8">

        {/* ヘッダー */}
        <div className="no-print text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">🎯 AI マンダラチャート</h1>
          <p className="text-gray-500 text-sm">
            目標を入力するとOllamaがサブテーマ・アクションを自動生成します
          </p>
        </div>

        {/* 入力フォーム */}
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

        {/* パンくずナビ（ツリーパスから生成） */}
        {breadcrumbPath.length > 1 && (
          <nav className="no-print flex items-center gap-1 flex-wrap text-sm mb-4 px-1">
            {breadcrumbPath.map((node, i) => {
              const isLast = i === breadcrumbPath.length - 1
              return (
                <span key={node.id} className="flex items-center gap-1">
                  {isLast ? (
                    <span className="font-semibold text-gray-700 max-w-[200px] truncate" title={node.theme}>
                      {node.theme}
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleNodeClick(node.id)}
                        disabled={isGenerating}
                        className="text-indigo-500 hover:text-indigo-700 hover:underline disabled:opacity-40 max-w-[160px] truncate"
                        title={node.theme}
                      >
                        {node.theme}
                      </button>
                      <span className="text-gray-300">›</span>
                    </>
                  )}
                </span>
              )
            })}
          </nav>
        )}

        {/* 印刷時タイトル */}
        {data && (
          <div className="print-only">
            {breadcrumbPath.length > 1 && (
              <span className="text-gray-500 font-normal">
                {breadcrumbPath.slice(0, -1).map(n => n.theme).join(' › ')} ›{' '}
              </span>
            )}
            {data.mainTheme}
          </div>
        )}

        <MandaraGrid
          data={data}
          isGenerating={isGenerating}
          onCellClick={isGenerating ? undefined : handleCellClick}
        />

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

        {/* 履歴ツリー（画面下部） */}
        <HistoryTree
          nodes={nodes}
          rootIds={rootIds}
          currentId={currentNodeId}
          onNodeClick={handleNodeClick}
          onNodeDelete={handleNodeDelete}
        />
      </div>
    </div>
  )
}

function isAncestor(
  nodes: Record<string, TreeNode>,
  ancestorId: string,
  descendantId: string,
): boolean {
  let cur = nodes[descendantId]?.parentId
  while (cur) {
    if (cur === ancestorId) return true
    cur = nodes[cur]?.parentId ?? null
  }
  return false
}
