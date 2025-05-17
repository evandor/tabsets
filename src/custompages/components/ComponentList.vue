<template>
  <!--  <add-component-menu v-if="props.editable" blockId="root" position="before" />-->
  <template v-if="props.page">
    <component
      v-for="c in props.page.elements"
      :key="calcKey(c)"
      :is="getTypeFor(c)"
      :block="c"
      :editable="props.editable"
      :content="c.content"
      :isHovered="isHovered(c)"
      @add-block="addBlock"
      @convert-to="(v: object) => convertTo(v)"
      @hovered="setHovered"
      @delete-block="(blockId: string) => deleteBlock(blockId)"
      @content-changed="emits('content-changed')" />
  </template>
  <!--  <add-component-menu v-if="props.editable" blockId="root" position="after" />-->
  <hr />
  <div v-for="c in props.page?.elements">{{ c }}</div>
</template>
<script setup lang="ts">
import { uid } from 'quasar'
import { Page } from 'src/custompages/models/backend'
import { ContentBlock, ContentBlockType } from 'src/custompages/models/frontend'
import { usePagesStore } from 'src/custompages/stores/pagesStore'
import { ref } from 'vue'

const props = defineProps<{
  page: Page | undefined
  editable: boolean
}>()

const emits = defineEmits(['content-changed'])

const hovered = ref<string | undefined>(undefined)
// const keyCounter = ref(0)

const getTypeFor = (c: ContentBlock): string => {
  return c.type
}

const addBlock = (type: ContentBlockType) => {
  //console.log('adding block', type, props.page)
  if (props.page) {
    props.page?.elements.push(new ContentBlock(uid(), type, 'hallo'))
    usePagesStore().updatePage(props.page)
  }
}

const convertTo = (v: object) => {}

const setHovered = (blockId: string) => {
  hovered.value = blockId
}

const deleteBlock = (blockId: string) => {
  console.log('toDeleteId', blockId)
  if (props.page) {
    props.page.elements = props.page.elements.filter((b: ContentBlock) => b.id !== blockId)
    usePagesStore().updatePage(props.page)
  }
}

const isHovered = (c: ContentBlock) => {
  return hovered.value === c.id
}

const calcKey = (c: ContentBlock) => {
  //keyCounter.value++
  return c.id //+ '_' + keyCounter.value
}
</script>

<style>
[contenteditable] {
  outline: 0 dashed transparent;
}

[contenteditable]:hover {
  outline: 0 dashed transparent;
}
</style>
