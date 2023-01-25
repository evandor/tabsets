<template>

  <div v-if="showMissingSomeTabsAction()"
       class="q-ma-sm bg-white text-grey" style="border: 1px dotted grey; border-radius: 3px">
    <div class="q-pa-sm">
      <div class="col text-caption">Missing some of your tabs? Click
        <span class="cursor-pointer text-blue-6" style="text-decoration: underline" @click="addOpenTabs">here</span>
        to add the open ones of the browser
      </div>
    </div>
  </div>

  <q-input type="textarea" v-model="dragTarget"/>

  <div v-if="tabsStore.currentTabsetId"
       class="q-ma-sm" style="border: 1px dotted grey; border-radius: 3px">
    <!--    <q-banner inline-actions rounded class="bg-white text-grey" style="border: 1px dotted grey">-->
    <div class="row">
      <div class="col-6 q-pa-xs">
        <q-btn flat color="primary" size="11px" icon="keyboard_double_arrow_left"
               :label="addLabel()"
               @click="saveTab(tab)">
          <q-tooltip>Save all {{ tabsStore.pendingTabset?.tabs.length }} tabs to {{
              tabsStore.currentTabsetName
            }}
          </q-tooltip>
        </q-btn>

      </div>
      <div class="col q-pa-xs text-right">
        <!--          @update:model-value="val => selectionChanged(val)"-->
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
        <!--        <q-btn flat round color="warning" size="11px" icon="cancel" @click="saveTab(tab)">-->
        <!--          <q-tooltip>Remove all tabs from this view</q-tooltip>-->
        <!--        </q-btn>-->
      </div>
    </div>
    <!--    </q-banner>-->
  </div>

  <vue-draggable-next
    :list="unassignedTabs()"
    :group="{ name: 'tabs', pull: 'clone', put: false }"
    :sort="true">

    <div
      class="col-12 q-pa-xs items-center justify-center" style="width:100%; max-width: 300px;cursor: move"
      v-for="tab in unassignedTabs()"

      :key="tab.id">

      <OpenTabCard
        v-on:selectionChanged="tabSelectionChanged"
        :tab="tab"
        :useSelection="useSelection"/>

    </div>

  </vue-draggable-next>

</template>
<script setup lang="ts">
import {useTabsStore} from "stores/tabsStore";
import {Tab} from "src/models/Tab";
import {Tabset} from "src/models/Tabset";
import _ from "lodash";
import {ref, watchEffect} from "vue"
import OpenTabCard from "components/layouts/OpenTabCard.vue";
import {VueDraggableNext} from 'vue-draggable-next'
import TabsetService from "src/services/TabsetService";
import {uid, useQuasar} from "quasar";
import AddUrlDialog from "components/dialogues/AddUrlDialog.vue";

const tabsStore = useTabsStore()
const $q = useQuasar()

const useSelection = ref(false)
const dragTarget = ref('')

const tabSelection = ref<Set<string>>(new Set<string>())

function unassignedTabs(): Tab[] {
  return _.filter(
    tabsStore.pendingTabset?.tabs,
    //@ts-ignore
    (t: Tab) => {
      return true
    })
}

watchEffect (() => {
  console.log("d&d", dragTarget.value)
  if (dragTarget.value.trim() === "") {
    return
  }
  try {
    const url = new URL(dragTarget.value)
    $q.dialog({component: AddUrlDialog, componentProps: {providedUrl: url.toString()}})
  } catch (err) {
    console.log("hier", err)
  }
  dragTarget.value = ''
})

const addLabel = () => useSelection.value ? 'add ' + tabSelection.value.size + ' tab(s)' : 'add all'
const checkboxLabel = () => useSelection.value ? '' : 'use selection'
const tabSelectionChanged = (a: any) => {
  console.log("tabSelectionChanged", a)
  const {tabId, selected} = a
  if (selected) {
    tabSelection.value.add(tabId)
  } else {
    tabSelection.value.delete(tabId)
  }
  console.log("tabselection", tabSelection)
}

const handleDragend = (i: any) => console.log("dragend", i)

const showMissingSomeTabsAction = () => {
  if (!tabsStore.pendingTabset || tabsStore.pendingTabset.tabs.length === 0) {
    return true
  }
  return false
}

const addOpenTabs = () => {
  if (process.env.MODE !== 'bex') {
    console.log("useTabsStore().pendingTabset", useTabsStore().pendingTabset)
    useTabsStore().pendingTabset = new Tabset("dummy", "dummy", [])
    useTabsStore().pendingTabset?.tabs.push(new Tab(uid(), {
      id: 10000,
      url: "https://www.example.com",
      title: "example.com",
      index: 1,
      pinned: false,
      highlighted: false,
      windowId: 1,
      active: false,
      incognito: false,
      selected: false,
      discarded: false,
      autoDiscardable: false
    }))
    useTabsStore().pendingTabset?.tabs.push(new Tab(uid(), {
      id: 10001,
      url: "https://www.skysail.io",
      title: "skysail.io",
      index: 2,
      pinned: false,
      highlighted: false,
      windowId: 1,
      active: false,
      incognito: false,
      selected: false,
      discarded: false,
      autoDiscardable: false
    }))
  } else {
    TabsetService.createPendingFromBrowserTabs()
  }
}


</script>
