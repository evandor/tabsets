import { ContentBlock, ContentBlockType, ContentContainer } from 'src/tabsets/models/cms/frontend'
import { PropType } from 'vue'

export type DefaultProps = {
  data: ContentContainer
  block: ContentBlock
  editable: boolean
  attributes?: object | undefined
  elements?: ContentBlock[]
  isHovered: Boolean
}

export type DefaultEmits = {
  (e: 'add-block', type: ContentBlockType, position: string, blockId: string): void
  (e: 'hovered', blockId: string): void
  (e: 'delete-block', blockId: string): void
  (e: 'content-changed'): void
  (e: 'convert-to', type: ContentBlockType): void
}

const defaultElementProps = {
  content: {
    type: String,
    required: false,
  },
  editable: {
    type: Boolean,
    default: false,
  },
  block: {
    type: Object as PropType<ContentBlock>,
    required: true,
  },
  attributes: {
    type: Object,
    required: false,
  },
  elements: {
    // to be ignored
    type: Array,
    required: false,
  },
  isHovered: {
    type: Boolean,
    default: false,
  },
}

const dynamicPageClasses = (attributes: any) => {
  const dyncClasses: string[] = []
  if (attributes) {
    if (attributes['padding']) {
      dyncClasses.push('q-pa-' + attributes['padding'])
    }
    if (attributes['margin']) {
      dyncClasses.push('q-ma-' + attributes['margin'])
    }

    dyncClasses.push(attributes['container'])
    dyncClasses.push(attributes['direction'])
    dyncClasses.push(attributes['justifyContent'])
    dyncClasses.push(attributes['border'])
    dyncClasses.push(attributes['fontWeight'])
    dyncClasses.push(attributes['align'])
  }
  return dyncClasses
}

export { defaultElementProps, dynamicPageClasses }
