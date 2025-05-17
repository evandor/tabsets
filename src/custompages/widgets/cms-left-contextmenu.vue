<template>
  <div style="position: absolute; left: -50px; top: -35px">
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
import { DefaultEmits } from 'src/custompages/components/common'
import { useComponent } from 'src/custompages/components/useComponent'
import { ContentBlock, ContentBlockType } from 'src/custompages/models/frontend'
import CmsAddMenu from 'src/custompages/widgets/cms-add-menu.vue'
import CmsAlterMenu from 'src/custompages/widgets/cms-alter-menu.vue'
import { Ref } from 'vue'

const props = defineProps<{ block: ContentBlock; htmlRef: Ref<any, any> }>()
const emits = defineEmits<DefaultEmits>()
const { deleteBlock, setClass, convertTo } = useComponent(props.block, props.htmlRef, emits)
</script>
