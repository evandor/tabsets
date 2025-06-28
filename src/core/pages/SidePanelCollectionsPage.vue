<template>
  <q-page class="darkInDarkMode brightInBrightMode" style="padding-top: 90px">
    <div class="row q-ma-none q-pa-none items-start" :class="topLevelSubfolderExist() ? 'q-ml-md' : ''">
      <div>
        <Draggable
          v-if="treeData"
          class="q-pl-none"
          v-model="treeData"
          @change="ondrop2($event)"
          :treeLine="false"
          :tree-line-offset="0"
          :defaultOpen="true"
          :indent="25">
          <template #default="{ node, stat }">
            <q-icon :name="openIndicatorIcon(stat)" @click="stat.open = !stat.open" />
            <span class="mtl-ml cursor-pointer" @click="handleTreeClick(node, '/sidepanel')">
              <q-icon
                v-if="node.level == 0 && node.type === TabsetType.SESSION"
                name="sym_o_new_window"
                color="secondary"
                class="q-mx-sm" />
              <q-icon
                v-else-if="node.level == 0 && node.type === TabsetType.SPECIAL"
                name="o_folder_special"
                color="grey-6"
                class="q-mx-sm" />
              <q-icon
                v-else-if="node.level == 0 && node.type !== TabsetType.SESSION"
                name="o_tab"
                color="primary"
                class="q-mx-sm" />
              <q-icon v-else name="o_folder" color="warning" class="q-mx-sm" />
              <Highlight
                :filter="filter"
                :text="node.text + ' ' + (node.id === currentTabset?.id ? ' (current)' : '')" />
            </span>
          </template>
        </Draggable>
      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <SidePanelCollectionsPageToolbar />
      <SearchToolbarHelper @on-term-changed="(val) => filterTermChanged(val)" />
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import { Draggable } from '@he-tree/vue'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import SidePanelCollectionsPageToolbar from 'src/core/pages/sidepanel/helper/SidePanelCollectionsPageToolbar.vue'
import Analytics from 'src/core/utils/google-analytics'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { onMounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import '@he-tree/vue/style/default.css'
import { NodeTreeObject, useTabsetsFunctions } from 'src/core/pages/common/useTabsetsFunctions'
import SearchToolbarHelper from 'src/core/pages/sidepanel/helper/SearchToolbarHelper.vue'
import Highlight from 'src/tabsets/widgets/Highlight.vue'

const router = useRouter()

const { ondrop2, removeNonMatches, openIndicatorIcon, handleTreeClick, getTreeData, tabsetsForSpace } =
  useTabsetsFunctions()

const tabsets = ref<Tabset[]>([])
const treeData = ref<NodeTreeObject[]>()
const currentTabset = ref<Tabset | undefined>(undefined)
const filter = ref<string | undefined>(undefined)

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelCollectionsPage', document.location.href)
})

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
})

watchEffect(() => {
  if (tabsets.value && tabsets.value.length > 0) {
    treeData.value = getTreeData(tabsets.value)
    if (filter.value && filter.value.trim() !== '') {
      treeData.value = removeNonMatches(treeData.value, filter.value)
    }
  }
})

watchEffect(() => {
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    const currentSpace = useSpacesStore().space
    tabsets.value = tabsetsForSpace(currentSpace)
  } else {
    //console.log("loading from ", [...useTabsetsStore().tabsets.values()])
    tabsets.value = [...useTabsetsStore().tabsets.values()]
  }
})

const topLevelSubfolderExist = () =>
  treeData.value
    ? treeData.value.findIndex((nto: NodeTreeObject) => nto.children && nto.children.length > 0) >= 0
    : false

const filterTermChanged = (val: { term: string }) => (filter.value = val.term)
</script>

<style lang="scss">
.fitpage {
  height: calc(100vh - 130px);
}
</style>
