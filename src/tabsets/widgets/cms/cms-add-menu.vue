<template>
  <q-btn icon="add" class="q-ma-none q-pa-none q-mr-xs" flat size="sm">
    <q-menu>
      <q-list dense style="min-width: 100px">
        <q-item dense clickable v-close-popup @click="addBlock(ContentBlockType.ContentBlockHeading)">
          <q-item-section>Add Heading</q-item-section>
        </q-item>
        <q-item dense clickable v-close-popup @click="addBlock(ContentBlockType.ContentBlockText)">
          <q-item-section>Add Text</q-item-section>
        </q-item>
        <q-item dense clickable v-close-popup @click="addBlock(ContentBlockType.ContentBlockList)">
          <q-item-section>Add List</q-item-section>
        </q-item>
        <q-item dense clickable v-close-popup @click="addBlock(ContentBlockType.ContentBlockBanner)">
          <q-item-section>Add Banner</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>
<script setup lang="ts">
import { ContentBlockType } from 'src/tabsets/models/cms/frontend'

const props = defineProps<{ blockId: string }>()

const emits = defineEmits<{ (e: 'add-block', type: ContentBlockType, position: string, blockId: string): void }>()

const addBlock = (type: ContentBlockType) => {
  emits('add-block', type, 'after', props.blockId)
}
</script>
