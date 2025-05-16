<template>
  <div
    :class="getClass()"
    ref="htmlRef"
    @blur.stop="update"
    tabindex="0"
    @mouseover="hovered()"
    :contentEditable="editable">
    {{ content }}
  </div>
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
            <q-item dense clickable v-close-popup @click="addBlock(ContentBlockType.ContentBlockSpan)">
              <q-item-section>Add Span</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
      <cms-alter-menu @delete-block="deleteBlock" @convert-to="convertTo" @set-class="setClass" />
    </div>
  </div>
</template>

<script lang="ts">
import { defaultElementProps } from 'src/custompages/components/common'
import { ContentBlockType } from 'src/custompages/models/frontend'
import CmsAlterMenu from 'src/custompages/widgets/cms-alter-menu.vue'
import { defineComponent, ref } from 'vue'

export default defineComponent({
  components: { CmsAlterMenu },
  computed: {
    ContentBlockType() {
      return ContentBlockType
    },
  },
  setup(props, ctx) {
    const htmlRef = ref()

    //const isHovered = ref(props.)

    function update(v: any) {
      const newText = htmlRef.value.innerText
      console.log('newtext', newText, props.block!.id)
      props.block!.content = htmlRef.value.innerText.trim()
      ctx.emit('content-changed')
    }

    function getClass() {
      if (props.block && props.block.classes) {
        return props.block.classes
      }
      return 'text-h3'
    }

    function addBlock(type: ContentBlockType) {
      ctx.emit('add-block', { type, position: 'after', blockId: props.block!.id })
    }

    function hovered() {
      if (props.editable) {
        ctx.emit('hovered', { blockId: props.block!.id })
      }
    }

    function deleteBlock() {
      console.log('deleting', props.block)
      ctx.emit('delete-block', { blockId: props.block!.id })
    }

    function convertTo() {
      ctx.emit('convert-to', { blockId: props.block!.id })
    }

    function setClass(cssClass: string) {
      console.log('setclass', cssClass)
      props.block!.classes = [cssClass]
    }

    return {
      htmlRef,
      getClass,
      update,
      addBlock,
      hovered,
      deleteBlock,
      convertTo,
      setClass,
    }
  },
  props: defaultElementProps,
  emits: ['content-changed', 'add-block', 'hovered', 'delete-block', 'convert-to'],
})
</script>
