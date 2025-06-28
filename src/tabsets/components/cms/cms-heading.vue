<template>
  <div v-if="props.isHovered && props.editable" style="position: relative; width: 0; height: 0">
    <cms-left-contextmenu
      offset-top="10px"
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
    :class="getClass('text-h3')"
    ref="htmlRef"
    @blur.stop="update()"
    tabindex="0"
    @mouseover="hovered()"
    :contentEditable="props.editable">
    {{ data.text }}
  </div>
</template>

<script lang="ts" setup>
import { DefaultEmits, DefaultProps } from 'src/tabsets/components/cms/common'
import { useComponent } from 'src/tabsets/components/cms/useComponent'
import { ContentBlockType, HeadingContentContainer } from 'src/tabsets/models/cms/frontend'
import CmsLeftContextmenu from 'src/tabsets/widgets/cms/cms-left-contextmenu.vue'
import { ref } from 'vue'

const props = defineProps<DefaultProps>()
const emits = defineEmits<DefaultEmits>()
const htmlRef = ref()
const { getClass, hovered, deleteBlock, convertTo, setClass } = useComponent(props.block, htmlRef, emits)

const data = props.data as HeadingContentContainer

function update() {
  const newText = htmlRef.value.innerText
  console.log('newtext', newText, props.block.id)
  data.text = htmlRef.value.innerText.trim()
  emits('content-changed')
}
</script>
