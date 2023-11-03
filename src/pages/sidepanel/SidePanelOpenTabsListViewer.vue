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
                    :chromeTab="tab"
                    :useSelection="useSelection"/>

              </div>

            </vue-draggable-next>


          </div>
        </div>

      </div>

    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" style="background-color:white">
      <FirstToolbarHelper title="Open Tabs">

        <template v-slot:iconsRight>
          <template v-if="tabs.length > 1">
            <SidePanelToolbarButton icon="filter_list" size="11px" @click="useUiStore().toggleToolbarFilter()"/>
            <span class="q-ma-none q-pa-none q-mx-sm text-grey-5">|</span>
          </template>
          <SidePanelToolbarTabNavigationHelper/>
          <CloseSidePanelViewButton/>
        </template>

      </FirstToolbarHelper>
    </q-page-sticky>

  </q-page>

</template>
<script setup lang="ts">
import {useTabsStore} from "src/stores/tabsStore";
import {Tabset} from "src/models/Tabset";
import _ from "lodash";
import {onMounted, ref, watchEffect} from "vue"
import OpenTabCard from "components/layouts/OpenTabCard.vue";
import {VueDraggableNext} from 'vue-draggable-next'
import TabsetService from "src/services/TabsetService";
import {useTabsetService} from "src/services/TabsetService2";
import InfoMessageWidget from "components/widgets/InfoMessageWidget.vue";
import {useRoute, useRouter} from "vue-router";
import {useUiStore} from "src/stores/uiStore";
import Analytics from "src/utils/google-analytics";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import ToolbarButton from "components/buttons/SidePanelToolbarButton.vue";
import SidePanelToolbarTabNavigationHelper from "pages/sidepanel/helper/SidePanelToolbarTabNavigationHelper.vue";
import CloseSidePanelViewButton from "components/buttons/CloseSidePanelViewButton.vue";
import SidePanelToolbarButton from "components/buttons/SidePanelToolbarButton.vue";

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

watchEffect(() => {
  tabs.value = useTabsStore().tabs
  const filterTerm = useUiStore().toolbarFilterTerm.toLowerCase()
  if (filterTerm.length > 0) {
    tabs.value = _.filter(tabs.value, (t: chrome.tabs.Tab) =>
        !!(t.url && t.url?.indexOf(filterTerm) >= 0 ||
            (t.title && t.title.toLowerCase()?.indexOf(filterTerm) >= 0)))
  }
})

watchEffect(() => {
  userCanSelect.value = false
})

const addTooltip = () => useSelection.value ?
    `Add ${tabSelection.value.size} tab(s) to ${tabsStore.currentTabsetName}` :
    `Add all tabs to ${tabsStore.currentTabsetName}`

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

