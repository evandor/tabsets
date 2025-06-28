<template>
  <q-list style="max-width: 95%">
    <q-item
      v-for="tag in props.tags.keys()"
      dense-toggle
      dense
      hide-expand-icon
      class="darken-on-hover"
      header-class="q-ma-none q-pa-none q-ml-md q-mb-xs">
      <q-item-section class="cursor-pointer q-ma-none q-pa-none" @click="selectTag(tag)">
        <q-item-label>
          <template v-slot>
            <div class="row">
              <div class="col-12 ellipsis">
                <q-icon color="primary" name="o_label" style="position: relative; top: -2px" />
                {{ tag }}
              </div>
            </div>
          </template>
        </q-item-label>
      </q-item-section>
      <q-item-section
        class="text-right q-mx-sm cursor-pointer"
        @mouseover="hoveredTag = tag"
        @mouseleave="hoveredTag = undefined"
        style="max-width: 25px; font-size: 12px; color: #bfbfbf">
        <span v-if="hoveredOver(tag)">
          <q-icon name="more_horiz" color="primary" size="16px" />
        </span>
        <span v-else>
          {{ props.tags.get(tag) }}
        </span>
        <q-menu :offset="[0, 0]">
          <q-list dense style="min-width: 200px">
            <q-item clickable v-close-popup @click="createDynamicTabsetFrom(tag)"> Turn into (dynamic) tabset </q-item>
          </q-list>
        </q-menu>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts" setup>
import { PropType, ref } from 'vue'

const emit = defineEmits(['tagSelected'])

const props = defineProps({
  tags: { type: Object as PropType<Map<string, number>>, required: true },
})

const hoveredTag = ref<string | undefined>(undefined)
const hoveredOver = (tag: string) => hoveredTag.value === tag

const createDynamicTabsetFrom = (tag: string) => {
  //  useCommandExecutor().executeFromUi(new CreateDynamicTabset(tag))
}

const selectTag = (tag: string) => emit('tagSelected', tag)
</script>
