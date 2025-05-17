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
}

interface HeadingContentContainer {
  kind: ContentBlockType.ContentBlockHeading
  text: string
}

interface TextContentContainer {
  kind: ContentBlockType.ContentBlockText
  text: string
}

interface ListContentContainer {
  kind: ContentBlockType.ContentBlockText
  data: string[]
  type: 'unordered' | 'ordered'
}

type ContentContainer = HeadingContentContainer | TextContentContainer | ListContentContainer

export class ContentBlock {
  id: string
  type: ContentBlockType
  content: string | string[]
  attributes: AttributesType
  classes: ClassesType
  elements: ContentBlock[]
  element: ContentBlock

  constructor(
    id: string,
    type: ContentBlockType,
    content: string | string[],
    attributes?: AttributesType,
    classes?: ClassesType,
    elements?: ContentBlock[],
    element?: ContentBlock,
  ) {
    this.id = id
    this.type = type
    this.content = content
    this.attributes = attributes || {}
    this.classes = classes || {}
    this.elements = elements || []
    this.element = element || (null as unknown as ContentBlock)
  }
}

export class ContentBlockDefinition {
  private type: ContentBlockType

  constructor(type: ContentBlockType) {
    this.type = type
  }

  hasContent(): boolean {
    return true
  }

  getActions(): Array<Object> {
    return []
  }

  getSpecificAttributes(): Array<Object> {
    return []
  }
}

const openEditorAction = { label: 'open editor', key: 'openEditor', icon: 'edit', tooltip: 'open Editor' }
const duplicateAction = { label: 'duplicate', key: 'duplicate', icon: 'content_copy', tooltip: 'make a copy' }
const deleteAction = { label: 'delete', key: 'delete', icon: 'delete', tooltip: 'delete this element' }

export enum ContentBlockPosition {
  AFTER = 'AFTER',
  BEFORE = 'BEFORE',
  IN = 'IN',
  FIRST = 'FIRST',
}

export enum AdminView {
  PAGE = 'PAGE',
  MEDIA = 'MEDIA',
  ICONS = 'ICONS',
}

export enum PageTab {
  CURRENT = 'CURRENT',
  ORIGINAL = 'ORIGINAL',
  SOURCE = 'SOURCE',
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
