<template>
  <div :style="`position: absolute; left: -50px; top: ${props.offsetTop}`">
    <cms-add-menu
      :block-id="props.block.id"
      @add-block="
        (type: ContentBlockType, position: string, blockId: string) => emits('add-block', type, position, blockId)
      " />
    <cms-alter-menu
      @delete-block="deleteBlock"
      @convert-to="convertTo"
      @set-class="(cssClass: string) => setClass(cssClass)" />
  </div>
</template>
<script setup lang="ts">
import { DefaultEmits } from 'src/tabsets/components/cms/common'
import { useComponent } from 'src/tabsets/components/cms/useComponent'
import { ContentBlock, ContentBlockType } from 'src/tabsets/models/cms/frontend'
import CmsAddMenu from 'src/tabsets/widgets/cms/cms-add-menu.vue'
import CmsAlterMenu from 'src/tabsets/widgets/cms/cms-alter-menu.vue'
import { Ref } from 'vue'

const props = defineProps<{ block: ContentBlock; htmlRef: Ref<any, any>; offsetTop: string }>()
const emits = defineEmits<DefaultEmits>()
const { deleteBlock, setClass, convertTo } = useComponent(props.block, props.htmlRef, emits)
</script>
