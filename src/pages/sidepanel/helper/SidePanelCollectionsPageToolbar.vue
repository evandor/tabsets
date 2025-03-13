<template>
  <!-- SidePanelCollectionsPageToolbar -->
  <q-toolbar class="q-pa-none q-pl-none q-pr-none q-pb-none greyBorderBottom" :style="offsetTop()">
    <q-toolbar-title>
      <div class="row q-ma-none q-pa-none">
        <div class="col-5 q-ma-none q-pa-none">
          <div class="col-12 text-subtitle1">
            <div class="q-ml-md q-mt-sm">
              <template v-if="useFeaturesStore().hasFeature(FeatureIdent.SPACES)">
                <div class="text-caption cursor-pointer" @click.stop="router.push('/sidepanel/spaces')">
                  {{ title() }}
                </div>
              </template>
              <template v-else>
                <div class="text-caption">{{ title() }}</div>
              </template>
              <div class="text-body1 text-bold cursor-pointer" @click="router.push('/sidepanel')">
                {{ currentTabset?.name }}
              </div>
            </div>
          </div>
        </div>

        <div class="col-7 text-subtitle1 text-right q-ma-none q-pa-none q-pr-sm q-pt-sm">
          <slot name="iconsRight">
            <SidePanelToolbarTabNavigationHelper />
            <q-btn
              outline
              dense
              icon="add"
              label="Collection"
              size="sm"
              :class="{ shake: annimateNewTabsetButton }"
              data-testid="addTabsetBtn"
              @click="openNewTabsetDialog()"
              class="q-ma-none q-pl-xs q-pr-sm q-py-xs"
              name="o_bookmark_add" />
          </slot>
        </div>
      </div>
    </q-toolbar-title>
  </q-toolbar>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import SidePanelToolbarTabNavigationHelper from 'src/opentabs/pages/SidePanelToolbarTabNavigationHelper.vue'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import NewTabsetDialog from 'src/tabsets/dialogues/NewTabsetDialog.vue'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n({ useScope: 'global' })

const $q = useQuasar()
const router = useRouter()

const searching = ref(false)
const showFilter = ref(false)
const windowLocation = ref('')
const annimateNewTabsetButton = ref(false)
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab | undefined>(undefined)

const toggleSearch = () => {
  searching.value = !searching.value
  if (searching.value) {
    router.push('/sidepanel/search')
  } else {
    router.push('/sidepanel')
  }
}

windowLocation.value = window.location.href

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
})

watchEffect(() => {
  const windowId = useWindowsStore().currentBrowserWindow?.id || 0
  currentChromeTab.value = useTabsStore2().getCurrentChromeTab(windowId) || useTabsStore2().currentChromeTab
})

watchEffect(() => {
  annimateNewTabsetButton.value = useUiStore().animateNewTabsetButton
})

watchEffect(() => {
  showFilter.value = useUiStore().sidePanelActiveViewIs(SidePanelViews.TABS_LIST) && useUiStore().toolbarFilter
})

// if ($q.platform.is.chrome && $q.platform.is.bex) {
//   chrome.commands.onCommand.addListener((command) => {
//     if (command === 'search') {
//       console.debug(`got Command: ${command}`)
//       toggleSearch()
//     }
//   })
// }

const title = (): string => {
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    return useSpacesStore().space ? useSpacesStore().space.label : 'no_space_selected'
  } else {
    return 'Switch Collection'
  }
}

const openNewTabsetDialog = () => {
  $q.dialog({
    component: NewTabsetDialog,
    componentProps: {
      tabsetId: useTabsetsStore().getCurrentTabset?.id,
      spaceId: useSpacesStore().space?.id,
      fromPanel: true,
    },
  })
}

const offsetTop = () => ($q.platform.is.capacitor || $q.platform.is.cordova ? 'margin-top:40px;' : '')
</script>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 3.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
