<template>
  <div
    :class="getClass('text-h3')"
    ref="htmlRef"
    @blur.stop="update()"
    tabindex="0"
    @mouseover="hovered()"
    :contentEditable="props.editable">
    {{ props.content }}
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
import { ContentBlockType } from 'src/custompages/models/frontend'
import CmsLeftContextmenu from 'src/custompages/widgets/cms-left-contextmenu.vue'
import { ref } from 'vue'

const props = defineProps<DefaultProps>()
const emits = defineEmits<DefaultEmits>()
const htmlRef = ref()
const { getClass, update, hovered, deleteBlock, convertTo, setClass } = useComponent(props.block, htmlRef, emits)
</script>
