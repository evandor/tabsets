//https://stackoverflow.com/questions/12710905/how-do-i-dynamically-assign-properties-to-an-object-in-typescript
export interface AttributesType {
  [key: string]: any
}

export interface ClassesType {
  [key: string]: any
}

export enum ContentBlockType {
  ContentBlockHeading = 'CmsHeading',
  ContentBlockText = 'CmsText',
  ContentBlockList = 'CmsList',
  ContentBlockBanner = 'CmsBanner',
}

export interface HeadingContentContainer {
  kind: ContentBlockType.ContentBlockHeading
  text: string
}

export function createHeading(heading: string): HeadingContentContainer {
  return { text: heading, kind: ContentBlockType.ContentBlockHeading }
}

export interface TextContentContainer {
  kind: ContentBlockType.ContentBlockText
  text: string
}

export function createText(text: string): TextContentContainer {
  return { text, kind: ContentBlockType.ContentBlockText }
}

export interface ListContentContainer {
  kind: ContentBlockType.ContentBlockList
  lines: string[]
  type: 'unordered' | 'ordered'
}

export function createList(firstLine: string): ListContentContainer {
  return { lines: [firstLine], type: 'unordered', kind: ContentBlockType.ContentBlockList }
}

export interface BannerContentContainer {
  kind: ContentBlockType.ContentBlockBanner
  text: string
}

export function createBanner(text: string): BannerContentContainer {
  return { text, kind: ContentBlockType.ContentBlockBanner }
}

export type ContentContainer =
  | HeadingContentContainer
  | TextContentContainer
  | ListContentContainer
  | BannerContentContainer

export class ContentBlock {
  id: string
  data: ContentContainer
  attributes: AttributesType
  classes: ClassesType
  elements: ContentBlock[]
  element: ContentBlock

  constructor(
    id: string,
    data: ContentContainer,
    attributes?: AttributesType,
    classes?: ClassesType,
    elements?: ContentBlock[],
    element?: ContentBlock,
  ) {
    this.id = id
    this.data = data
    this.attributes = attributes || {}
    this.classes = classes || {}
    this.elements = elements || []
    this.element = element || (null as unknown as ContentBlock)
  }
}

export enum LayoutPart {
  PAGE = 'PAGE',
  FOOTER = 'FOOTER',
  HEADER = 'HEADER',
}

export class ContentContext {
  element: ContentBlock
  parent: ContentBlock
  layoutPart: LayoutPart

  constructor(element: ContentBlock, parent?: ContentBlock, layoutPart?: LayoutPart) {
    this.element = element
    this.parent = parent || (null as unknown as ContentBlock)
    this.layoutPart = layoutPart || LayoutPart.PAGE
  }
}
