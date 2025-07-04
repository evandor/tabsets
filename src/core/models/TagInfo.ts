export type TagType = 'manual' | 'url' | 'hierarchy' | 'keyword' | 'langDetection' | 'classification'

export type TagInfo = {
  label: string
  type: TagType
  score: number
}

export type CategoryInfo = {
  label: string
  weight: number
}
