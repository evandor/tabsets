<template>
  <q-btn icon="drag_indicator" class="q-ma-none q-pa-none q-mr-xs" flat size="sm">
    <q-menu>
      <q-list dense style="min-width: 100px">
        <q-item dense clickable v-close-popup @click="emits('set-class', 'text-h1')">
          <q-item-section>H1</q-item-section>
        </q-item>
        <q-item dense clickable v-close-popup @click="emits('set-class', 'text-h2')">
          <q-item-section>H2</q-item-section>
        </q-item>
        <q-item dense clickable v-close-popup @click="emits('set-class', 'text-h6')">
          <q-item-section>H6</q-item-section>
        </q-item>
        <q-item dense clickable v-close-popup @click="emits('set-class', 'text-h5')">
          <q-item-section>H5</q-item-section>
        </q-item>
        <q-separator inset />
        <ContextMenuItem icon="open_in_new" label="Convert to...">
          <q-item-section side>
            <q-icon name="keyboard_arrow_right" />
          </q-item-section>
          <q-menu :offset="[-182, -32]">
            <q-list>
              <q-item dense clickable v-close-popup @click="emits('convert-to', ContentBlockType.ContentBlockText)">
                <q-item-section>Text</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </ContextMenuItem>
        <q-separator inset />
        <q-item dense clickable v-close-popup @click="emits('delete-block')">
          <q-item-section>Delete</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>
<script setup lang="ts">
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { ContentBlockType } from 'src/tabsets/models/cms/frontend'

const emits = defineEmits<{
  (e: 'delete-block'): void
  (e: 'set-class', cssClass: string): void
  (e: 'convert-to', type: ContentBlockType): void
}>()
</script>
