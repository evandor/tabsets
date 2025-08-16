export type ContentTemplates = 'recipe' | 'news' | 'shopping' | 'restaurant' | 'travel'

// we have templates for those
export type SystemContentClassification = `system:${ContentTemplates}`

// no template (i.e. the default template) is used for those:
export type UserContentClassification = `user:${string}`

export type ContentClassification = SystemContentClassification | UserContentClassification

export type ClassificationResult = {
  classification: 'unclassified' | ContentClassification
  matchedFrom: string | undefined
}
