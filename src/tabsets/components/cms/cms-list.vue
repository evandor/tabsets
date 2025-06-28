<template>
  <div v-if="props.isHovered && props.editable" style="position: relative; width: 0; height: 0">
    <cms-left-contextmenu
      offset-top="15px"
      :block="props.block"
      :html-ref="htmlRef"
      @delete-block="deleteBlock"
      @convert-to="convertTo"
      @set-class="(cssClass: string) => setClass(cssClass)"
      @add-block="
        (type: ContentBlockType, position: string, blockId: string) => emits('add-block', type, position, blockId)
      " />
  </div>
  <ul @mouseover="hovered()">
    <li v-for="(line, index) in data.lines">
      <span
        ref="htmlRef"
        :contentEditable="props.editable"
        @keyup.delete="(e: any) => deletePressed(e, index)"
        @keyup.enter="(e: any) => enterPressed(e, index)"
        >{{ line }}</span
      >
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { DefaultEmits, DefaultProps } from 'src/tabsets/components/cms/common'
import { useComponent } from 'src/tabsets/components/cms/useComponent'
import { ContentBlockType, ListContentContainer } from 'src/tabsets/models/cms/frontend'
import CmsLeftContextmenu from 'src/tabsets/widgets/cms/cms-left-contextmenu.vue'
import { ref } from 'vue'

const props = defineProps<DefaultProps>()
const emits = defineEmits<DefaultEmits>()
const htmlRef = ref()
const { getClass, hovered, deleteBlock, convertTo, setClass } = useComponent(props.block, htmlRef, emits)

const data = props.data as ListContentContainer

function update() {
  const newText = htmlRef.value.innerText
  console.log('newtext', newText, props.block.id)
  //data.text = htmlRef.value.innerText.trim()
  emits('content-changed')
}

const deletePressed = (e: any, index: number) => {
  console.log('deletePressed', e, htmlRef.value[index].innerText)
  if (htmlRef.value[index].innerText.trim().length === 0) {
    data.lines.splice(index, 1)
    emits('content-changed')
  }
}

const enterPressed = (e: any, index: number) => {
  console.log('enterPressed', e, htmlRef.value[index].innerText)
  const newText = htmlRef.value[index].innerText
  console.log('newtext', newText, props.block.id)
  const parts = newText.split('\n')
  data.lines.splice(index, 0, parts[0])
  data.lines[index + 1] = parts[1]
  emits('content-changed')
}
</script>
