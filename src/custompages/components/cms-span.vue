<template>
  <span
    :class="getClass()"
    ref="htmlRef"
    @blur.stop="update"
    tabindex="0"
    @mouseover="hovered()"
    :contentEditable="editable">
    {{ content }}
  </span>
  <!--  <span v-if="isHovered" style="position: relative; left: 80px">-->

  <!--  </span>-->
  <div v-if="isHovered && editable" style="position: relative; width: 0; height: 0">
    <div style="position: absolute; left: -50px; top: -35px">
      <q-btn icon="add" class="q-ma-none q-pa-none q-mr-xs" flat size="sm">
        <q-menu>
          <q-list dense style="min-width: 100px">
            <q-item dense clickable v-close-popup @click="addBlock(ContentBlockType.ContentBlockHeading)">
              <q-item-section>Add Heading</q-item-section>
            </q-item>
            <q-item dense clickable v-close-popup @click="addBlock(ContentBlockType.ContentBlockText)">
              <q-item-section>Add Text</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
      <q-btn icon="drag_indicator" class="q-ma-none q-pa-none q-mr-xs" flat size="sm">
        <q-menu>
          <q-list dense style="min-width: 100px">
            <q-item dense clickable v-close-popup @click="deleteBlock()">
              <q-item-section>Delete</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ContentBlock, ContentBlockType } from 'src/custompages/models/frontend'
import { ref } from 'vue'

const props = defineProps<{
  content: string
  block: ContentBlock
  editable: boolean
  attributes: object
  elements: ContentBlock[]
  isHovered: Boolean
}>()

const emits = defineEmits<{
  (e: 'add-block', type: ContentBlockType): void
  (e: 'hovered', blockId: string): void
  (e: 'delete-block', blockId: string): void
  (e: 'content-changed'): void
}>()

const htmlRef = ref()

const addBlock = (type: ContentBlockType) => {
  emits('add-block', type)
}

const hovered = () => {
  if (props.editable) {
    emits('hovered', props.block.id)
  }
}

const deleteBlock = () => {
  console.log('deleting', props.block)
  emits('delete-block', props.block.id)
}

const update = (v: any) => {
  const newText = htmlRef.value.innerText
  console.log('newtext', newText, props.block.id)
  props.block.content = htmlRef.value.innerText.trim()
  emits('content-changed')
}

function getClass() {
  return ''
}
</script>
