<template>
  <q-list style="max-width: 95%">
    <q-item
      v-for="t in allTags"
      dense-toggle
      dense
      hide-expand-icon
      class="darken-on-hover"
      header-class="q-ma-none q-pa-none q-ml-md q-mb-xs">
      <q-item-section class="q-ma-none q-pa-none" @click="selectTag(t.tag)">
        <q-item-label>
          <template v-slot>
            <div class="row">
              <div
                class="col-12 ellipsis"
                :class="t.dynamicTsId ? 'text-bold cursor-pointer' : ''"
                @click.stop="openGalleryViewIfApplicable(t.dynamicTsId)">
                <q-icon color="primary" name="o_label" style="position: relative; top: -2px" />
                {{ t.tag }}
              </div>
            </div>
          </template>
        </q-item-label>
      </q-item-section>
      <q-item-section
        class="text-right q-mx-sm cursor-pointer"
        @mouseover="hoveredTag = t.tag"
        @mouseleave="hoveredTag = undefined"
        style="max-width: 25px; font-size: 12px; color: #bfbfbf">
        <span v-if="hoveredOver(t.tag)">
          <q-icon name="more_horiz" color="primary" size="16px" />
        </span>
        <span v-else>
          {{ props.tags.get(t.tag) }}
        </span>
        <q-menu :offset="[0, 0]">
          <q-list dense style="min-width: 200px">
            <q-item v-if="!t.dynamicTsId" clickable v-close-popup @click="createDynamicTabsetFrom(t.tag)">
              Turn into (dynamic) tabset</q-item
            >
            <q-item v-else clickable v-close-popup @click="deleteDynamicTabset(t.dynamicTsId)">
              Delete dynamic tabset</q-item
            >
            <q-item clickable v-close-popup @click="deleteTag(t)"> Delete tag</q-item>
          </q-list>
        </q-menu>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts" setup>
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import NavigationService from 'src/services/NavigationService'
import { CreateDynamicTabset } from 'src/tabsets/commands/CreateDynamicTabset'
import { DeleteTabsetCommand } from 'src/tabsets/commands/DeleteTabsetCommand'
import { DynamicTabSourceType } from 'src/tabsets/models/DynamicTabSource'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTagsService } from 'src/tags/TagsService'
import { PropType, ref, watchEffect } from 'vue'

const emit = defineEmits(['tagSelected'])

const props = defineProps({
  tags: { type: Object as PropType<Map<string, number>>, required: true },
})

const hoveredTag = ref<string | undefined>(undefined)
const dynamicTabsets = ref<{ label: string; tabsetId: string }[]>([])
const allTags = ref<{ tag: string; dynamicTsId: string | undefined }[]>([])

const hoveredOver = (tag: string) => hoveredTag.value === tag

const createDynamicTabsetFrom = (tag: string) => {
  useCommandExecutor().executeFromUi(new CreateDynamicTabset(tag, DynamicTabSourceType.TAG))
}

const selectTag = (tag: string) => emit('tagSelected', tag)

watchEffect(() => {
  if (useTabsetsStore().lastUpdate) {
    dynamicTabsets.value = [...useTabsetsStore().tabsets.values()]
      .filter((ts: Tabset) => ts.type === TabsetType.DYNAMIC)
      .filter((ts: Tabset) => ts.dynamicTabs && ts.dynamicTabs.config && ts.dynamicTabs.config['tags' as keyof object])
      .map((ts: Tabset) => {
        const tagsFromConfig: string[] = ts.dynamicTabs!.config['tags' as keyof object] as string[]
        return {
          label: tagsFromConfig.length > 0 ? tagsFromConfig[0]! : '???',
          tabsetId: ts.id,
        }
      })
  }
})

watchEffect(() => {
  allTags.value = [...props.tags.keys()].map((tag: string) => {
    const match = dynamicTabsets.value.find((o: { label: string; tabsetId: string }) => o.label === tag)
    return {
      tag: tag,
      dynamicTsId: match ? match.tabsetId : undefined,
    }
  })
})

const openGalleryViewIfApplicable = (tabsetId: string | undefined) => {
  if (tabsetId) {
    NavigationService.openOrCreateTab([chrome.runtime.getURL(`www/index.html#/mainpanel/tabsets/overview/${tabsetId}`)])
  }
}

const deleteDynamicTabset = (tabsetId: string) => {
  useCommandExecutor().executeFromUi(new DeleteTabsetCommand(tabsetId))
}
const deleteTag = (t: { tag: string; dynamicTsId: string | undefined }) => {
  console.log('deleteTag', t)
  if (t.dynamicTsId) {
    useCommandExecutor().executeFromUi(new DeleteTabsetCommand(t.dynamicTsId))
  }
  useTagsService().addToIgnored(t.tag)
}
</script>
