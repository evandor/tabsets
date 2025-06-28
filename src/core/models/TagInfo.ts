export type TagType = 'manual' | 'langDetection' | 'classification'

export type TagInfo = {
  label: string
  type: TagType
  score: number
}
