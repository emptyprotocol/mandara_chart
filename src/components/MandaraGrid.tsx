import { MandalaData, POSITION_TO_INDEX, THEME_HUES } from '../types/mandala'

interface Props {
  data: MandalaData | null
  isGenerating: boolean
}

function getThemeColor(hue: number, lightness: number) {
  return `hsl(${hue}, 65%, ${lightness}%)`
}

interface CellInfo {
  text: string | null
  type: 'main' | 'subTheme' | 'action'
  hue: number | null
  isGenerating: boolean
}

function getCellInfo(
  blockRow: number,
  blockCol: number,
  cellRow: number,
  cellCol: number,
  data: MandalaData | null,
): CellInfo {
  const isCenter = blockRow === 1 && blockCol === 1

  if (isCenter) {
    if (cellRow === 1 && cellCol === 1) {
      return { text: data?.mainTheme ?? null, type: 'main', hue: null, isGenerating: false }
    }
    const idx = POSITION_TO_INDEX[`${cellRow},${cellCol}`]
    const sub = data?.subThemes[idx]
    return { text: sub?.theme ?? null, type: 'subTheme', hue: THEME_HUES[idx], isGenerating: false }
  }

  const subIdx = POSITION_TO_INDEX[`${blockRow},${blockCol}`]
  const sub = data?.subThemes[subIdx]
  const hue = THEME_HUES[subIdx]

  if (cellRow === 1 && cellCol === 1) {
    return { text: sub?.theme ?? null, type: 'subTheme', hue, isGenerating: false }
  }

  const actionIdx = POSITION_TO_INDEX[`${cellRow},${cellCol}`]
  return {
    text: sub?.actions[actionIdx] ?? null,
    type: 'action',
    hue,
    isGenerating: sub?.isGenerating ?? false,
  }
}

function Cell({ info }: { info: CellInfo }) {
  const { text, type, hue, isGenerating } = info

  let bg = '#f8f9fa'
  let border = '#dee2e6'
  let textColor = '#212529'
  let fontWeight: string = 'normal'

  if (type === 'main') {
    bg = '#1a1a2e'
    border = '#16213e'
    textColor = '#e2b96f'
    fontWeight = 'bold'
  } else if (type === 'subTheme' && hue !== null) {
    bg = getThemeColor(hue, 42)
    border = getThemeColor(hue, 35)
    textColor = '#fff'
    fontWeight = '600'
  } else if (type === 'action' && hue !== null) {
    bg = getThemeColor(hue, 95)
    border = getThemeColor(hue, 80)
    textColor = getThemeColor(hue, 22)
  }

  const textClass =
    type === 'main' ? 'cell-text cell-text-main' :
    type === 'subTheme' ? 'cell-text cell-text-sub' :
    'cell-text cell-text-action'

  return (
    <div
      className="mandala-cell"
      style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
        color: textColor,
        fontWeight,
        aspectRatio: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3%',
        transition: 'background-color 0.3s',
        overflow: 'hidden',
      }}
    >
      {isGenerating && !text ? (
        <div
          style={{
            width: '30%',
            aspectRatio: '1',
            border: `2px solid ${hue !== null ? getThemeColor(hue, 70) : '#ccc'}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      ) : (
        <span className={textClass} style={{ lineHeight: '1.35', textAlign: 'center' }}>
          {text ?? ''}
        </span>
      )}
    </div>
  )
}

export default function MandaraGrid({ data, isGenerating }: Props) {
  return (
    <div className="mandala-grid-container">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div
        className="mandala-outer-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'clamp(3px, 0.8%, 8px)',
        }}
      >
        {Array.from({ length: 3 }, (_, blockRow) =>
          Array.from({ length: 3 }, (_, blockCol) => {
            const isCenter = blockRow === 1 && blockCol === 1
            const subIdx = isCenter ? -1 : POSITION_TO_INDEX[`${blockRow},${blockCol}`]
            const hue = subIdx >= 0 ? THEME_HUES[subIdx] : null
            return (
              <div
                key={`${blockRow}-${blockCol}`}
                className="mandala-block"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  aspectRatio: '1',
                  gap: 'clamp(1px, 0.3%, 3px)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: isCenter
                    ? '2px solid #1a1a2e'
                    : hue !== null
                      ? `2px solid ${getThemeColor(hue, 60)}`
                      : '2px solid #dee2e6',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                }}
              >
                {Array.from({ length: 3 }, (_, cellRow) =>
                  Array.from({ length: 3 }, (_, cellCol) => {
                    const info = getCellInfo(blockRow, blockCol, cellRow, cellCol, data)
                    return <Cell key={`${cellRow}-${cellCol}`} info={info} />
                  }),
                )}
              </div>
            )
          }),
        )}
      </div>
      {!data && !isGenerating && (
        <div className="text-center text-gray-400 mt-8 text-sm">
          テーマを入力して「生成」を押すとマンダラチャートが作成されます
        </div>
      )}
    </div>
  )
}
