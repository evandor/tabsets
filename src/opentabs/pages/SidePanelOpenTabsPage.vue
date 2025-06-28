<template>
  <!-- SidePanelOpenTabsPage -->
  <q-page padding style="padding-top: 86px">
    <div class="q-ma-none">
      <div class="row q-ma-none q-pa-none">
        <div class="col-12 q-ma-none q-pa-none">
          <transition
            :name="showDocumentation ? 'q-transition--jump-right' : 'q-transition--jump-left'"
            :class="showDocumentation ? 'documentation' : 'box'">
            <SidePanelOpenTabsListViewer
              v-if="!showDocumentation"
              ref="sidePanelOpenTabsListViewerRef"
              :filterTerm="filterTerm"
              @filtered-tabs="(v) => (searchHits = v)"
              @tab-selection-changed="(v) => tabSelectionChanged(v)" />

            <q-card v-else class="my-card q-ma-sm q-mt-xl documentation">
              <SidePanelOpenTabsPageHelp @close="toggleDocumentation()" />
            </q-card>
          </transition>
        </div>
      </div>
    </div>

    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <ViewToolbarHelper title="Open Tabs">
        <template v-slot:iconsRight>
          <q-icon name="sym_o_help" class="q-ma-sm cursor-pointer" @click="toggleDocumentation()" />
        </template>
      </ViewToolbarHelper>
      <OpenTabsFilterToolbarHelper
        v-if="!showDocumentation"
        @on-term-changed="(val) => termChanged(val)"
        @tab-selection-inverted="selectionInverted()"
        :search-hits="searchHits"
        :tabSelection="tabSelection" />
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import { LocalStorage } from 'quasar'
import OpenTabsFilterToolbarHelper from 'src/core/pages/sidepanel/helper/OpenTabsFilterToolbarHelper.vue'
import ViewToolbarHelper from 'src/core/pages/sidepanel/helper/ViewToolbarHelper.vue'
import Analytics from 'src/core/utils/google-analytics'
import SidePanelOpenTabsPageHelp from 'src/opentabs/pages/help/SidePanelOpenTabsPageHelp.vue'
import SidePanelOpenTabsListViewer from 'src/opentabs/pages/SidePanelOpenTabsListViewer.vue'
import { onMounted, ref } from 'vue'

const filterTerm = ref<string | undefined>(undefined)
const tabSelection = ref<Set<string>>(new Set<string>())
const sidePanelOpenTabsListViewerRef = ref()
const searchHits = ref(0)
const showDocumentation = ref(LocalStorage.getItem('ui.opentabs.documentation') == null)

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelOpenTabsPage', document.location.href)
})

const termChanged = (val: { term: string }) => (filterTerm.value = val.term)
const selectionInverted = () => sidePanelOpenTabsListViewerRef.value!.invertSelection()
const tabSelectionChanged = (val: Set<string>) => (tabSelection.value = val)
const toggleDocumentation = () => {
  showDocumentation.value = !showDocumentation.value
  LocalStorage.setItem('ui.opentabs.documentation', 'hide')
}
</script>
