<template>
  <div class="doc-note doc-note--tip" @mouseover="hovered()" :contentEditable="props.editable">
    <p class="doc-note__title">TIP</p>
    <p>
      If you’d like <strong>a simpler and more convenient way</strong> to offer an Ajax Bar to your users, have a look
      at the <a href="/quasar-plugins/loading-bar" class="doc-link">Loading Bar Plugin</a>, which is actually
      <strong>the recommended way</strong>.
    </p>
  </div>
  <div v-if="props.isHovered && props.editable" style="position: relative; width: 0; height: 0">
    <cms-left-contextmenu
      :block="props.block"
      :html-ref="htmlRef"
      @delete-block="deleteBlock"
      @convert-to="convertTo"
      @set-class="(cssClass: string) => setClass(cssClass)"
      @add-block="
        (type: ContentBlockType, position: string, blockId: string) => emits('add-block', type, position, blockId)
      " />
  </div>
</template>

<script lang="ts" setup>
import { DefaultEmits, DefaultProps } from 'src/custompages/components/common'
import { useComponent } from 'src/custompages/components/useComponent'
import { ContentBlockType, ListContentContainer } from 'src/custompages/models/frontend'
import CmsLeftContextmenu from 'src/custompages/widgets/cms-left-contextmenu.vue'
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
