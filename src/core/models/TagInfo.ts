export type TagType =
  | 'manual'
  | 'url'
  | 'hierarchy'
  | 'languageModel'
  | 'keyword'
  | 'langDetection'
  | 'classification'
  | 'linkingData'

export type TagInfo = {
  label: string
  type: TagType
  score: number
}

export type CategoryInfo = {
  label: string
  weight: number
}
