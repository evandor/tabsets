<template>
  <!-- PopupOpenTabsPage -->
  <q-page class="darkInDarkMode brightInBrightMode" style="padding-top: 40px; min-width: 400px; max-height: 700px">
    <div class="q-ma-sm">
      <div class="row q-ma-none q-pa-none">
        <div class="col-12 q-ma-none q-pa-none">
          <SidePanelOpenTabsListViewer
            v-if="!showDocumentation"
            view-context="popup"
            ref="sidePanelOpenTabsListViewerRef"
            :filterTerm="filterTerm"
            @filtered-tabs="(v) => (searchHits = v)"
            @tab-selection-changed="(v) => tabSelectionChanged(v)" />

          <q-card v-else class="my-card q-ma-sm q-mt-xl documentation">
            <SidePanelOpenTabsPageHelp @close="toggleDocumentation()" />
          </q-card>
        </div>
      </div>
    </div>

    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode q-ma-none q-ml-md">
      <PopupToolbar title="Currently Open Tabs">
        <template v-slot:left>
          <q-icon name="o_keyboard_return" class="cursor-pointer" @click="router.push('/popup')" />
        </template>
      </PopupToolbar>
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import { LocalStorage } from 'quasar'
import PopupToolbar from 'src/core/pages/popup/PopupToolbar.vue'
import Analytics from 'src/core/utils/google-analytics'
import SidePanelOpenTabsPageHelp from 'src/opentabs/pages/help/SidePanelOpenTabsPageHelp.vue'
import SidePanelOpenTabsListViewer from 'src/opentabs/pages/SidePanelOpenTabsListViewer.vue'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const filterTerm = ref<string | undefined>(undefined)
const tabSelection = ref<Set<string>>(new Set<string>())
const sidePanelOpenTabsListViewerRef = ref()
const searchHits = ref(0)
const showDocumentation = ref(LocalStorage.getItem('ui.opentabs.documentation') == null)

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelOpenTabsPage', document.location.href)
})

const tabSelectionChanged = (val: Set<string>) => (tabSelection.value = val)
const toggleDocumentation = () => {
  showDocumentation.value = !showDocumentation.value
  LocalStorage.setItem('ui.opentabs.documentation', 'hide')
}
</script>
