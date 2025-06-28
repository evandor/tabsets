<template>
  <div class="q-ma-none">
    <div class="row q-ma-none q-pa-none">
      <div class="col-12 q-ma-none q-pa-none q-pt-lg">
        <!--              <InfoMessageWidget-->
        <!--                  v-if="useTabsetsStore().currentTabsetId && tabs.length > 0 && !userCanSelect"-->
        <!--                  :probability="1"-->
        <!--                  css-class="q-pa-sm q-gutter-sm"-->
        <!--                  force-display-->
        <!--                  ident="unassignedAndOpenTabs_userCannotSelect"-->
        <!--                  hint="Tabs with grey background are already contained in the current tabset."/>-->

        <div
          v-if="currentTabsetId && tabs.length > 1 && userCanSelect"
          class="q-ma-none"
          style="border: 1px dotted grey; border-radius: 3px">
          <div class="row">
            <div class="col-6 q-pa-xs">
              <q-btn
                flat
                color="primary"
                size="11px"
                icon="keyboard_double_arrow_left"
                :label="addLabel()"
                @click="saveSelectedTabs()">
                <q-tooltip class="tooltip" v-html="addTooltip()"></q-tooltip>
              </q-btn>
            </div>
            <div class="col q-pa-xs text-right">
              <q-checkbox
                v-if="useSelection"
                @update:model-value="(val: boolean) => toggleInvert(val)"
                rigth-label
                class="text-primary text-uppercase q-mr-lg"
                style="font-size: 11px"
                v-model="invert"
                color="primary"
                size="30px"
                label="invert"
                checked-icon="task_alt"
                unchecked-icon="check_box_outline_blank" />

              <q-checkbox
                left-label
                class="text-primary text-uppercase"
                style="font-size: 11px"
                v-model="useSelection"
                color="primary"
                size="30px"
                :label="checkboxLabel()"
                checked-icon="task_alt"
                unchecked-icon="check_box_outline_blank" />
            </div>
          </div>
        </div>

        <vue-draggable-next :list="tabs" :group="{ name: 'tabs', pull: 'clone', put: false }" :sort="true">
          <div
            class="col-12 q-pa-xs items-center justify-center"
            style="width: 100%; max-width: 300px; cursor: move"
            v-for="tab in tabs"
            :key="tab.id!">
            <OpenTabCard2
              v-on:selectionChanged="tabSelectionChanged"
              v-on:addedToTabset="tabAddedToTabset"
              v-on:hasSelectable="hasSelectable"
              :chromeTab="tab"
              :windowId="useWindowsStore().currentBrowserWindow?.id || 0"
              :useSelection="useSelection" />
          </div>
        </vue-draggable-next>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash'
import Analytics from 'src/core/utils/google-analytics'
import OpenTabCard2 from 'src/opentabs/components/OpenTabCard2.vue'
import TabsetService from 'src/tabsets/services/TabsetService'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { onMounted, ref, watchEffect } from 'vue'
import { VueDraggableNext } from 'vue-draggable-next'

const useSelection = ref(false)
const invert = ref(false)
const userCanSelect = ref(false)
const currentTabsetId = ref<string | undefined>(undefined)

const tabSelection = ref<Set<string>>(new Set<string>())
const tabs = ref<chrome.tabs.Tab[]>([])

onMounted(() => {
  Analytics.firePageViewEvent('OpenTabsView', document.location.href)
})

watchEffect(() => {
  useTabsetsStore()
    .getCurrentTabsetId()
    .then((tsId: string | undefined) => (currentTabsetId.value = tsId))
})

watchEffect(() => {
  tabs.value = useTabsStore2().browserTabs
  const filterTerm = useUiStore().toolbarFilterTerm.toLowerCase()
  if (filterTerm.length > 0) {
    tabs.value = _.filter(
      tabs.value,
      (t: chrome.tabs.Tab) =>
        !!((t.url && t.url?.indexOf(filterTerm) >= 0) || (t.title && t.title.toLowerCase()?.indexOf(filterTerm) >= 0)),
    )
  }
})

watchEffect(() => {
  userCanSelect.value = false
})

const addTooltip = () =>
  useSelection.value
    ? `Add ${tabSelection.value.size} tab(s) to ${useTabsetsStore().currentTabsetName}`
    : `Add all tabs to ${useTabsetsStore().currentTabsetName}`

const addLabel = () => 'add'
const checkboxLabel = () => (useSelection.value ? '' : 'use selection')
const tabSelectionChanged = (a: any) => {
  const { tabId, selected } = a
  if (selected) {
    tabSelection.value.add(tabId)
  } else {
    tabSelection.value.delete(tabId)
  }
}

const tabAddedToTabset = (a: any) => {
  const { tabId } = a
  tabSelection.value.delete(tabId)
}

const hasSelectable = () => (userCanSelect.value = true)

const saveSelectedTabs = () => {
  TabsetService.saveSelectedPendingTabs()
}

const toggleInvert = (invert: boolean) => {
  // tabsStore.pendingTabset?.tabs.forEach(t => {
  //   if (!useTabsetService().urlExistsInCurrentTabset(t.url || '')) {
  //     t.selected = !t.selected
  //     tabSelectionChanged({tabId: t.id, selected: t.selected})
  //   }
  // })
}
</script>
