import { DefaultEmits } from 'src/tabsets/components/cms/common'
import { ContentBlock, ContentBlockType } from 'src/tabsets/models/cms/frontend'
import { Ref } from 'vue'

export function useComponent(block: ContentBlock, htmlRef: Ref<any, any>, emits: DefaultEmits) {
  const getClass = (defaultClass: string) => {
    // console.log('getClass!', block.classes && Object.keys(block.classes)?.length)
    if (block && block.classes && Object.keys(block.classes).length > 0) {
      return block.classes
    }
    return defaultClass
  }

  const hovered = () => {
    emits('hovered', block.id)
  }

  const deleteBlock = () => {
    console.log('deleting', block.id)
    emits('delete-block', block.id)
  }

  const setClass = (cssClass: string) => {
    console.log('setclass', cssClass)
    block.classes = [cssClass]
    emits('content-changed')
  }

  const convertTo = (type: ContentBlockType) => {
    emits('convert-to', type)
  }

  return { getClass, hovered, deleteBlock, setClass, convertTo }
}
