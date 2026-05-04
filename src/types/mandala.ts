export interface SubTheme {
  theme: string
  actions: (string | null)[]
  isGenerating: boolean
  isGenerated: boolean
}

export interface MandalaData {
  mainTheme: string
  subThemes: (SubTheme | null)[]
}

export type GenerationStatus =
  | 'idle'
  | 'generating-themes'
  | 'generating-actions'
  | 'done'
  | 'error'

// Mapping from (row, col) excluding center (1,1) to index 0-7
export const POSITION_TO_INDEX: Record<string, number> = {
  '0,0': 0, '0,1': 1, '0,2': 2,
  '1,0': 3,            '1,2': 4,
  '2,0': 5, '2,1': 6, '2,2': 7,
}

export const THEME_HUES = [0, 30, 60, 120, 175, 210, 260, 320]
