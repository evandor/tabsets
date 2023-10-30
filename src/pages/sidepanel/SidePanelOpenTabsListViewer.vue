<template>

  <q-page padding style="padding-top: 45px">

    <div class="q-ma-none">


      <div class="q-ma-none">
        <div class="row q-ma-none q-pa-none">
          <div class="col-12 q-ma-none q-pa-none q-pt-lg">

            <InfoMessageWidget
                v-if="tabsStore.currentTabsetId && tabs.length > 0 && !userCanSelect"
                :probability="1"
                css-class="q-pa-sm q-gutter-sm"
                force-display
                ident="unassignedAndOpenTabs_userCannotSelect"
                hint="Tabs with grey background are already contained in the current tabset."/>

            <div v-if="tabsStore.currentTabsetId && tabs.length > 1 && userCanSelect"
                 class="q-ma-none" style="border: 1px dotted grey; border-radius: 3px">
              <div class="row">
                <div class="col-6 q-pa-xs">
                  <q-btn flat color="primary" size="11px" icon="keyboard_double_arrow_left"
                         :label="addLabel()"
                         @click="saveSelectedTabs()">
                    <q-tooltip class="tooltip" v-html="addTooltip()"></q-tooltip>
                  </q-btn>

                </div>
                <div class="col q-pa-xs text-right">

                  <q-checkbox v-if="useSelection"
                              @update:model-value="val => toggleInvert(val)"
                              rigth-label
                              class="text-primary text-uppercase q-mr-lg"
                              style="font-size: 11px"
                              v-model="invert"
                              color="primary"
                              size="30px"
                              label="invert"
                              checked-icon="task_alt"
                              unchecked-icon="check_box_outline_blank"
                  />

                  <q-checkbox
                      left-label
                      class="text-primary text-uppercase"
                      style="font-size: 11px"
                      v-model="useSelection"
                      color="primary"
                      size="30px"
                      :label="checkboxLabel()"
                      checked-icon="task_alt"
                      unchecked-icon="check_box_outline_blank"
                  />
                </div>
              </div>
            </div>

            <vue-draggable-next
                :list="tabs"
                :group="{ name: 'tabs', pull: 'clone', put: false }"
                :sort="true">

              <div
                  class="col-12 q-pa-xs items-center justify-center" style="width:100%; max-width: 300px;cursor: move"
                  v-for="tab in tabs"
                  :key="tab.id">

                <OpenTabCard
                    v-on:selectionChanged="tabSelectionChanged"
                    v-on:addedToTabset="tabAddedToTabset"
                    v-on:hasSelectable="hasSelectable"
                    :tab="tab"
                    :useSelection="useSelection"/>

              </div>

            </vue-draggable-next>


          </div>
        </div>

      </div>

      <!--      <div>-->
      <!--        {{ useTabsStore().chromeTabsHistory}}-->
      <!--      </div>-->
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" style="background-color:white">
      <FirstToolbarHelper title="Open Tabs">

        <template v-slot:iconsRight>
          <SidePanelToolbarTabNavigationHelper/>
          <CloseSidePanelViewButton />
        </template>

      </FirstToolbarHelper>
    </q-page-sticky>

  </q-page>

</template>
<script setup lang="ts">
import {useTabsStore} from "src/stores/tabsStore";
import {Tab} from "src/models/Tab";
import {Tabset} from "src/models/Tabset";
import _ from "lodash";
import {onMounted, ref, watchEffect} from "vue"
import OpenTabCard from "components/layouts/OpenTabCard.vue";
import {VueDraggableNext} from 'vue-draggable-next'
import TabsetService from "src/services/TabsetService";
import {useTabsetService} from "src/services/TabsetService2";
import InfoMessageWidget from "components/widgets/InfoMessageWidget.vue";
import {useRoute, useRouter} from "vue-router";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {SidePanelView, useUiStore} from "src/stores/uiStore";
import Analytics from "src/utils/google-analytics";
import NavigationService from "src/services/NavigationService";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import ToolbarButton from "components/buttons/ToolbarButton.vue";
import SidePanelToolbarTabNavigationHelper from "pages/sidepanel/helper/SidePanelToolbarTabNavigationHelper.vue";
import CloseSidePanelViewButton from "components/buttons/CloseSidePanelViewButton.vue";

const tabsStore = useTabsStore()
const route = useRoute()

const useSelection = ref(false)
const invert = ref(false)
const userCanSelect = ref(false)

const tabSelection = ref<Set<string>>(new Set<string>())
const tabs = ref<chrome.tabs.Tab[]>([])

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelOpenTabsListViewer', document.location.href);
})


function unassignedTabs(): Tab[] {
  return _.filter(
      tabsStore.pendingTabset?.tabs,
      (tab: Tab) => {
        if (usePermissionsStore().hasFeature(FeatureIdent.IGNORE)) {
          const ignoreTS = useTabsetService().getTabset('IGNORE')
          if (ignoreTS && tab.url !== undefined) {
            const foundIndex = ignoreTS.tabs.findIndex((ignoreTab: Tab) =>
                tab.url?.startsWith(ignoreTab.url || 'somestrangestring'))
            if (foundIndex >= 0) {
              console.log("ignoring", tab.url, ignoreTS.tabs[foundIndex].url)
              return false
            }
          }
        }
        return true
      })
}

watchEffect(() => {
  tabs.value = useTabsStore().tabs
})

watchEffect(() => {
  userCanSelect.value = false
})

const addTooltip = () => useSelection.value ?
    `Add ${tabSelection.value.size} tab(s) to ${tabsStore.currentTabsetName}` :
    `Add all tabs to ${tabsStore.currentTabsetName}`

const deleteTabset = () => useSelection.value ?
    `Remove ${tabSelection.value.size} tabs from this view` :
    `Remove all tabs from this view`

// const addLabel = () => useSelection.value ? 'add ' + tabSelection.value.size + ' tabs' : 'add'
const addLabel = () => 'add'
const checkboxLabel = () => useSelection.value ? '' : 'use selection'
const tabSelectionChanged = (a: any) => {
  const {tabId, selected} = a
  if (selected) {
    tabSelection.value.add(tabId)
  } else {
    tabSelection.value.delete(tabId)
  }
}

const tabAddedToTabset = (a: any) => {
  const {tabId, tabUrl} = a
  tabSelection.value.delete(tabId)
}

const hasSelectable = () => userCanSelect.value = true


const showMissingSomeTabsAction = () => {
  if (process.env.MODE !== 'bex') {
    return false
  }
  if (route?.query?.first) {
    return false
  }
  if ((!tabsStore.pendingTabset || tabsStore.pendingTabset.tabs.length === 0) && tabsStore.tabs.length > 1) {
    return true
  }
  return false
}

const showStartingHint = () => !showMissingSomeTabsAction() && tabsStore.pendingTabset?.tabs.length <= 1

const saveSelectedTabs = () => {
  TabsetService.saveSelectedPendingTabs()
}

const toggleInvert = (invert: boolean) => {
  tabsStore.pendingTabset?.tabs.forEach(t => {
    if (!useTabsetService().urlExistsInCurrentTabset(t.url || '')) {
      t.selected = !t.selected
      tabSelectionChanged({tabId: t.id, selected: t.selected})
    }
  })
}

const addOpenTabs = () => {
  if (process.env.MODE !== 'bex') {
    console.log("useTabsStore().pendingTabset", useTabsStore().pendingTabset)
    useTabsStore().pendingTabset = new Tabset("dummy", "dummy", [])
  } else {
    TabsetService.createPendingFromBrowserTabs()
  }
}

</script>

