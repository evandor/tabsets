<template>

  <!-- pending tabs -->
  <q-expansion-item v-if="tabsStore.pendingTabset?.tabs.length > 0"
                    header-class="bg-amber-1 text-black"
                    expand-icon-class="text-black"
                    default-opened>
    <template v-slot:header="{ expanded }">
      <q-item-section avatar>
        <q-icon name="push_pin"/>
      </q-item-section>
      <q-item-section>
        <div>
          <span class="text-weight-bold">Open Tabs</span>
          <div class="text-caption">Decide which tabs you want to put into your tabset
          </div>
        </div>
      </q-item-section>
      <q-item-section>{{ pendingTabsCount() }}</q-item-section>
    </template>

    <!--        <q-card style="background: radial-gradient(circle, #35a2ff 0%, #014a88 100%)">-->

    <q-card>
      <q-card-section>
        <TabcardsPending :tabs="_.filter(tabsStore.pendingTabset?.tabs, (t: Tab) => !t.isDuplicate)" v-on:selectionChanged="updateSelectionCount"/>
      </q-card-section>
    </q-card>
  </q-expansion-item>


  <!-- "Arrows" part -->
  <div class="justify-center row q-ma-md q-pa-xl" style="border: 3px dotted grey; border-radius:8px;" v-if="tabsStore.pendingTabset?.tabs.length > 0">

    <span v-if="TabsetService.getSelectedPendingTabs().length === 0">
      <q-btn icon="file_download" label="Save all" class="q-mx-lg" color="positive"
             @click="saveAllPendingTabs()"></q-btn>
      <q-btn icon="delete_outline" label="Remove all" class="q-mx-lg" color="negative" @click="removeAllPendingTabs()"></q-btn>
    </span>
    <span v-else>
      <q-btn icon="file_download" label="save selected" class="q-mx-lg" @click="saveSelectedPendingTabs()"></q-btn>
       <q-btn icon="delete_outline" label="remove selected" class="q-mx-lg" @click="removeSelectedPendingTabs()"></q-btn>
    </span>
  </div>

  <!-- banners -->
  <q-banner rounded class="bg-amber-1 text-black q-ma-md" v-if="!tabsStore.currentTabsetId && tabsStore.tabsets.size === 0">
    <div class="text-body2">
      To get started, add a new tabset by clicking on the plus sign at the lower right page.
    </div>
  </q-banner>

  <q-banner rounded class="bg-amber-1 text-black q-ma-md" v-if="!tabsStore.currentTabsetId && tabsStore.tabsets.size > 0">
    <div class="text-body2">
      Select an existing tabset from the right or add a new tabset by clicking on the plus sign at the lower right page.
    </div>
  </q-banner>

  <!-- toolbar -->
  <q-toolbar class="text-primary" v-if="tabsStore.currentTabsetId">
    <div class="row fit">
      <div class="col-xs-12 col-md-5">
        <q-toolbar-title>
          <div class="row justify-start items-baseline">
            <div class="col-1"><span class="text-dark">Tabset</span> <span
              class="text-primary">
              {{ tabsStore.currentTabsetName }}
              <q-tooltip
                v-if="featuresStore.debugEnabled">ID: {{ tabsStore.getCurrentTabset.id }} Status: {{ tabsStore.getCurrentTabset.status }} Pers: {{ tabsStore.getCurrentTabset.persistence }}</q-tooltip>
            </span></div>
          </div>
        </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-7 text-right">

        <q-btn v-if="tabsStore.getCurrentTabset?.tabs.length > 0 && featuresStore.firebaseEnabled && auth.isAuthenticated &&
          (!tabsStore.getCurrentTabset.persistence || tabsStore.getCurrentTabset.persistence === TabsetPersistence.INDEX_DB)"
               flat dense icon="restore_page"
               color="warning" :label="$q.screen.gt.sm ? 'Sync Tabset...' : ''"
               class="q-mr-md"
               @click="syncTabset()">
          <q-tooltip>This tabset is stored locally. To use it on different devices, click 'Sync Tabset'</q-tooltip>
        </q-btn>

        <q-btn v-if="tabsStore.getCurrentTabset?.tabs.length > 0"
               flat dense icon="restore_page"
               color="green" :label="$q.screen.gt.sm ? 'Open Tabset...' : ''"
               class="q-mr-md"
               @click="restoreDialog">
          <q-tooltip>Replace your current tabs with all the tabs from this tabset</q-tooltip>
        </q-btn>

      </div>
    </div>
  </q-toolbar>

  <q-expansion-item v-if="tabsStore.pinnedTabs.length > 0"
                    header-class="text-black"
                    expand-icon-class="text-black"
                    expand-separator
                    default-opened>
    <template v-slot:header="{ expanded }">
      <q-item-section avatar>
        <q-icon name="push_pin"/>
      </q-item-section>
      <q-item-section>
        <div>
          <span class="text-weight-bold">Pinned Tabs</span>
          <div class="text-caption">this browser's window's tabs which are pinned right now</div>
        </div>
      </q-item-section>
      <q-item-section>{{ formatLength(tabsStore.pinnedTabs.length, 'tab', 'tabs') }}</q-item-section>
    </template>
    <q-card>
      <q-card-section>
        <Tabcards :tabs="tabsStore.pinnedTabs"/>
      </q-card-section>
    </q-card>
  </q-expansion-item>

  <!-- chrome groups -->
  <template v-for="group in tabGroupsStore.tabGroups">
    <q-expansion-item
      v-if="tabsForGroup(group.id).length > 0"
      default-opened
      header-class="text-black"
      expand-icon-class="text-black"
      expand-separator>
      <template v-slot:header="{ expanded }">
        <q-item-section avatar>
          <q-icon :color="group.color" name="tab"/>
        </q-item-section>

        <q-item-section>
          <div>
            <span class="text-weight-bold">{{ group.title }}</span>
            <div class="text-caption">chrome browser's group of tabs</div>
          </div>
        </q-item-section>
        <q-item-section>{{ formatLength(tabsForGroup(group.id).length, 'tab', 'tabs') }}</q-item-section>
      </template>
      <q-card>
        <q-card-section>
          <Tabcards :tabs="tabsForGroup( group.id)" v-on:sendCaption="setGroupedTabsCaption"/>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </template>

  <q-banner rounded class="bg-amber-1 text-black q-ma-md" v-if="tabsStore.currentTabsetId && tabsStore.getCurrentTabs.length === 0 && tabsStore.pendingTabset?.tabs.length > 0">
    <div class="text-body2">
      To start adding new tabs to this empty tabset, select the tabs you want to use from above and click save.
    </div>
  </q-banner>
  <q-banner v-else-if="tabsStore.currentTabsetId && tabsStore.getCurrentTabs.length === 0">
    To start adding new tabs to this empty tabset, open new browser tabs and come back to this extension to
    associate them with a tabset.<br><br>
    If you want to assign your open tabs straight away, click <span class="cursor-pointer text-blue" @click="addOpenTabs()"><u>here</u></span>.
  </q-banner>

  <!-- rest: neither pinned, grouped, or pending -->
  <q-expansion-item v-if="unpinnedNoGroup().length > 0"
    icon="tabs"
    default-opened
    header-class="text-black"
    expand-icon-class="text-black"
    expand-separator>
    <template v-slot:header="{ expanded }">
      <q-item-section avatar>
        <q-icon name="tab"/>
      </q-item-section>

      <q-item-section>
        <div>
            <span class="text-weight-bold">Other Tabs ({{
                formatLength(unpinnedNoGroup().length, 'tab', 'tabs')
              }})</span>
          <div class="text-caption ellipsis" v-text="otherTabsCaption"></div>
          <!--                <q-btn label="create new tabset" v-if="expanded" @click="newTabsetFrom(group.title, group.id)"/>-->
        </div>
      </q-item-section>
      <q-item-section></q-item-section>
    </template>

    <q-card>
      <q-card-section>
        <Tabcards :tabs="unpinnedNoGroup()" v-on:sendCaption="setOtherTabsCaption"/>
      </q-card-section>
    </q-card>
  </q-expansion-item>


</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {useQuasar} from "quasar";
import Tabcards from "src/components/layouts/Tabcards.vue";
import TabcardsPending from "src/components/layouts/TabcardsPending.vue";
import _ from "lodash"
import {useTabsStore} from "src/stores/tabsStore";
import {useTabGroupsStore} from "src/stores/tabGroupsStore";
import TabsetService from "src/services/TabsetService";
import {Tab} from "src/models/Tab";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {Tabset, TabsetPersistence} from "src/models/Tabset"
import {useAuthStore} from "src/stores/auth";
import {MAX_TABS_TO_SHOW} from 'boot/constants'
import ChromeApi from "src/services/ChromeApi";

const route = useRoute();
const router = useRouter();
const localStorage = useQuasar().localStorage
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const featuresStore = useFeatureTogglesStore()
const auth = useAuthStore()

const tabsetname = ref(tabsStore.currentTabsetName)

const otherTabsCaption = ref('current tabs, neither pinned nor grouped...')
const groupedTabsCaption = ref('current tabs, neither pinned nor grouped')
const duplicatesCount = ref(0)

const $q = useQuasar()

watchEffect(() => {
  const currentTabs: Tab[] = tabsStore.getCurrentTabs
  duplicatesCount.value = 0
  _.forEach(tabsStore.pendingTabset?.tabs, pendingTab => {
    if (_.find(currentTabs, t => t.chromeTab.url === pendingTab.chromeTab.url)) {
      pendingTab.isDuplicate = true
      duplicatesCount.value += 1
    } else {
      pendingTab.isDuplicate = false
    }
  })
})

function unpinnedNoGroup() {
  return _.filter(
    _.map(tabsStore.getCurrentTabs, t => t),
    (t: Tab) => !t.chromeTab.pinned && t.chromeTab.groupId === -1)
}

function tabsForGroup(groupId: number): Tab[] {
  return _.filter(tabsStore.getCurrentTabs,
    //@ts-ignore
    (t: Tab) => t.chromeTab.groupId === groupId)
}

const update = (tabsetIdent: object) => {
  console.log("selected tabset now: ", tabsetIdent)
  tabsetname.value = tabsetIdent['label' as keyof object]
  tabsStore.selectCurrentTabset(tabsetIdent['value' as keyof object])
}

const formatLength = (length: number, singular: string, plural: string) => {
  return (length > 1 || length === 0) ? length + ' ' + plural : length + ' ' + singular
}

//const removeClosedTabs = () => TabsetService.removeClosedTabs()
const saveAllPendingTabs = () => TabsetService.saveAllPendingTabs()
const saveSelectedPendingTabs = () => TabsetService.saveSelectedPendingTabs()
const removeSelectedPendingTabs = () => TabsetService.removeSelectedPendingTabs()
const removeAllPendingTabs = () => TabsetService.removeAllPendingTabs()

const setOtherTabsCaption = (msg: string) => otherTabsCaption.value = msg
const setGroupedTabsCaption = (msg: string) => groupedTabsCaption.value = msg

const selectedCount = ref(0)

const showTabGroup = (group: chrome.tabGroups.TabGroup) => tabsForGroup(group.id).length > 0
const showOtherTabs = () => tabsStore.browserTabset?.tabs.length > 0 || tabGroupsStore.tabGroups.length > 0

const updateSelectionCount = (val: any) => {
  //console.log("hier", val, TabsetService.getSelectedPendingTabs().length)
  selectedCount.value = TabsetService.getSelectedPendingTabs().length
}
const noTabSelected = () => selectedCount.value === 0

const syncTabset = () => {
  console.log("syncing tabset", tabsStore.currentTabsetId)
  TabsetService.syncTabset(tabsStore.currentTabsetId)
}

const pendingTabsCount = () => {
  const l = formatLength(tabsStore.pendingTabset?.tabs.length - duplicatesCount.value, 'tab', 'tabs')
  let label = l
  if (tabsStore.pendingTabset?.tabs.length - duplicatesCount.value > MAX_TABS_TO_SHOW) {
    label += ", with " + (1 + tabsStore.pendingTabset?.tabs.length - MAX_TABS_TO_SHOW) + " hidden"
  }
  if (duplicatesCount.value > 0) {
    label += ", not showing " + duplicatesCount.value + " duplicates"
  }
  return label
}

const addOpenTabs = () => {
  const tabs = ChromeApi.getTabs()
  TabsetService.saveOrReplaceFromChromeTabs(tabsStore.currentTabsetName, tabs, true )
}

const saveDialog = () => {
  $q.dialog({
    title: 'Save current Tabset',
    message: 'Please provide a name for the new (or updated) tabset',
    prompt: {
      isValid: val => val != 'current',
      model: tabsetname.value === 'current' ? '' : tabsetname.value,
      type: 'text' // optional
    },
    cancel: true,
    persistent: true
  }).onOk((name: string) => {
    console.log('>>>> saving', name)
    TabsetService.saveOrReplaceFromChromeTabs(name, tabsStore.tabs)

  }).onCancel(() => {
    //console.log('>>>> Cancel')
  }).onDismiss(() => {
    //console.log('I am triggered on both OK and Cancel')
  })


}


const restoreDialog = () => {
  $q.dialog({
    title: 'Restore Tabset',
    message: 'Would you like to restore this tabset? All current tabs will be closed before.',
    cancel: true,
    persistent: true
  }).onOk((data: any) => {
    TabsetService.restore(tabsStore.currentTabsetId)
  }).onCancel(() => {
  }).onDismiss(() => {
  })


}

</script>
