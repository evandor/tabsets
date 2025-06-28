<template>
  <!--  <add-component-menu v-if="props.editable" blockId="root" position="before" />-->
  <!--  <div v-for="c in props.page?.elements">-->
  <!--    {{ getTypeFor(c) }}-->
  <!--  </div>-->
  <template v-if="props.page">
    <component
      v-for="c in props.page.elements"
      :key="calcKey(c)"
      :is="getTypeFor(c)"
      :block="c"
      :editable="props.editable"
      :data="c.data"
      :isHovered="isHovered(c)"
      @add-block="addBlock"
      @convert-to="(v: object) => convertTo(v)"
      @hovered="setHovered"
      @delete-block="(blockId: string) => deleteBlock(blockId)"
      @content-changed="emits('content-changed')" />
  </template>
  <!--  <add-component-menu v-if="props.editable" blockId="root" position="after" />-->
  <!--  <hr />-->
  <!--  <div v-for="c in props.page?.elements">{{ c }}</div>-->
</template>
<script setup lang="ts">
import { uid } from 'quasar'
import { Page } from 'src/tabsets/models/cms/backend'
import {
  ContentBlock,
  ContentBlockType,
  createBanner,
  createHeading,
  createList,
  createText,
} from 'src/tabsets/models/cms/frontend'
import { ref } from 'vue'

const props = defineProps<{
  page: Page | undefined
  editable: boolean
}>()

const emits = defineEmits(['content-changed'])

const hovered = ref<string | undefined>(undefined)
// const keyCounter = ref(0)

const getTypeFor = (c: ContentBlock): string => {
  return c.data.kind
}

const addBlock = (type: ContentBlockType, position: string, referenceBlockId: string) => {
  console.log('adding block', type, props.page, position, referenceBlockId)
  if (props.page) {
    let newBlock: ContentBlock | undefined = undefined
    switch (type) {
      case ContentBlockType.ContentBlockHeading:
        newBlock = new ContentBlock(uid(), createHeading('hallo'))
        // props.page?.elements.push()
        break
      case ContentBlockType.ContentBlockText:
        // props.page?.elements.push(new ContentBlock(uid(), createText('hallo')))
        newBlock = new ContentBlock(uid(), createText('hallo'))
        break
      case ContentBlockType.ContentBlockList:
        // props.page?.elements.push(new ContentBlock(uid(), createList('hallo')))
        newBlock = new ContentBlock(uid(), createList('hallo'))
        break
      case ContentBlockType.ContentBlockBanner:
        // props.page?.elements.push(new ContentBlock(uid(), createBanner('hallo')))
        newBlock = new ContentBlock(uid(), createBanner('hallo'))
        break
      default:
        console.warn('unknown type', type)
    }
    if (newBlock) {
      const elementIndex = props.page.elements.findIndex((b: ContentBlock) => b.id === referenceBlockId)
      props.page.elements.splice(elementIndex + 1, 0, newBlock)
      emits('content-changed')
    }
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
    // usePagesStore().updatePage(props.page)
    emits('content-changed')
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
