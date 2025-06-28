<template>
  <div v-if="props.isHovered && props.editable" style="position: relative; width: 0; height: 0">
    <cms-left-contextmenu
      offset-top="-1px"
      :block="props.block"
      :html-ref="htmlRef"
      @delete-block="deleteBlock"
      @convert-to="convertTo"
      @set-class="(cssClass: string) => setClass(cssClass)"
      @add-block="
        (type: ContentBlockType, position: string, blockId: string) => emits('add-block', type, position, blockId)
      " />
  </div>
  <div
    class="q-mb-md"
    :class="getClass('text-body1')"
    ref="htmlRef"
    @blur.stop="update()"
    tabindex="0"
    @mouseover="hovered()"
    :contentEditable="props.editable"
    @pointerup="(e: any) => pointerUpEvent(e)"
    v-html="data.text" />
  <template v-if="selection && selectionText">
    <span
      class="q-ma-none q-pa-none"
      id="control"
      ref="controlRef"
      style="border: 1px solid #bfbfbf; background: white; border-radius: 3px">
      <q-btn
        icon="o_format_bold"
        class="q-ma-none q-pa-none"
        size="md"
        style="max-width: 30px"
        flat
        @click="format('b')" />
      <q-btn
        icon="o_format_italic"
        class="q-ma-none q-pa-none"
        size="md"
        style="max-width: 30px"
        flat
        @click="format('i')" />
    </span>
  </template>
</template>

<script lang="ts" setup>
import { DefaultEmits, DefaultProps } from 'src/tabsets/components/cms/common'
import { useComponent } from 'src/tabsets/components/cms/useComponent'
import { ContentBlockType, TextContentContainer } from 'src/tabsets/models/cms/frontend'
import CmsLeftContextmenu from 'src/tabsets/widgets/cms/cms-left-contextmenu.vue'
import { ref } from 'vue'

const props = defineProps<DefaultProps>()
const emits = defineEmits<DefaultEmits>()
const htmlRef = ref()
const controlRef = ref()
const { getClass, hovered, deleteBlock, convertTo, setClass } = useComponent(props.block, htmlRef, emits)

const data = props.data as TextContentContainer

const selection = ref<Selection | undefined>(undefined)
const selectionText = ref<string | undefined>(undefined)
const selectionTextStart = ref<number>(0)
const selectionTextEnd = ref<number>(0)

function update() {
  if (htmlRef.value.innerText) {
    data.text = htmlRef.value.innerHTML.replaceAll('\n', '<br>').trim()
    emits('content-changed')
  }
}

const pointerUpEvent = (e: any) => {
  console.log('poinerupevetn', e, e.selection)
  selection.value = window.getSelection() || undefined
  selectionText.value = selection.value?.toString()
  console.log('selection', selection.value)
  if (selectionText.value && selection.value) {
    selectionTextStart.value = Math.min(selection.value.anchorOffset, selection.value.focusOffset)
    selectionTextEnd.value = Math.max(selection.value.anchorOffset, selection.value.focusOffset)
    console.log('*', selection.value, data.text)
    console.log('*', selection.value.getRangeAt(0))
    console.log('anchorNode', selection.value.anchorNode)
    console.log('focusNode', selection.value.focusNode)
    //console.log('parentNode', selection.value.focusNode?.parentNode?.innerHTML)
    //console.log("-", Math.min(selection.value.get, selection.value.focusOffset))
    // console.log('**', selection.value.anchorNode?.textContent?.substring(start, end))
  }
  let text = window.getSelection()?.toString()
  if (text !== '' && selection.value && controlRef.value) {
    let rect = selection.value.getRangeAt(0).getBoundingClientRect()
    //console.log('rect', rect, controlRef.value.style)
    controlRef.value.style.top = `calc(${rect.top}px - 58px)`
    controlRef.value.style.left = `calc(${rect.left}px + calc(${rect.width}px / 2) - 40px)`
    //controlRef.value['text'] = 'text'
    //document.body.appendChild(controlRef.value)
  }
}

const format = (tag: string) => {
  if (selectionText.value && selection.value && selection.value.rangeCount) {
    // const wholeText = selection.value.anchorNode?.textContent
    // if (!wholeText) {
    //   return
    // }
    // console.log('format Bold', data.text, selectionTextStart.value, selectionTextEnd.value)
    // console.log('----', data.text)
    // console.log('**', originalText)
    // console.log('**', selection.value.getRangeAt(0))
    //
    // const range = selection.value.getRangeAt(0)
    // console.log('*range*', range.toString())
    // const startContainer: Node = range.startContainer
    // console.log('startContainer', startContainer)
    //
    // let prefix = startContainer.textContent!.substring(0, range.startOffset)
    // let text = selectionText.value
    // let postfix = startContainer.textContent!.toString().substring(range.endOffset)
    // console.log('=>1', `${prefix}|${text}|${postfix}`)
    //
    // const newText = `${prefix}<${tag}>${text}</${tag}>${postfix}`
    // console.log('=>2', newText)
    switch (tag) {
      case 'b':
        document.execCommand('bold')
        break
      case 'i':
        document.execCommand('italic')
        break
    }
    // startContainer.textContent = newText
    // startContainer.

    // const start = Math.min(selection.value.anchorOffset, selection.value.focusOffset)
    // const end = Math.max(selection.value.anchorOffset, selection.value.focusOffset)
    // console.log('!', selection.value.anchorOffset, selection.value.focusOffset, start, length)
    //   console.log('!!', selection.value.anchorNode?.textContent?.substring(start, end))
    //
    // console.log('*', selectionText.value.substring(selection.value.anchorOffset, 1))

    // let prefix = data.text.substring(0, selectionTextStart.value)
    // let text = selectionText.value
    // let postfix = data.text.substring(selectionTextEnd.value)
    // console.log('=>', `${prefix}|${text}|${postfix}`)

    // data.text = `${prefix}<${tag}>${text}</${tag}>${postfix}`
    //
    // data.text = data.text
    //   .replaceAll('\n', '<br>')
    //   //.replace(selectionText.value, `<${tag}>` + selectionText.value + `</${tag}>`)
    //   .trim()
    // emits('content-changed')
    selection.value = undefined
    selectionText.value = undefined
  }
}
</script>

<style>
#control {
  cursor: pointer;
  position: absolute;
}
</style>
