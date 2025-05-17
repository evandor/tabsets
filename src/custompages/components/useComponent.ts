import { DefaultEmits } from 'src/custompages/components/common'
import { ContentBlock, ContentBlockType } from 'src/custompages/models/frontend'
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
    // if (editable) {
    console.log('emitting hovered', block.id)
    emits('hovered', block.id)
    // }
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
