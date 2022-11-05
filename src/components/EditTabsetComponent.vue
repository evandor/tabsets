<template>

  <!-- pending tabs -->
  <q-expansion-item v-if="tabsStore.pendingTabset?.tabs.length > 0"
                    class="q-mb-lg"
                    style="border: 3px dotted grey; border-radius:8px;"
                    header-class="text-black"
                    expand-icon-class="text-black"
                    expand-icon-toggle
                    default-opened>
    <template v-slot:header="{ expanded }">

      <q-item-section>
        <div>
          <span class="text-weight-bold">Changed Tabs</span>
          <div class="text-caption">Decide which tabs you want to put into your tabset
          </div>
        </div>
      </q-item-section>
      <q-item-section>
        <q-item-label lines="2">
          <div class="text-weight-bold">{{ filter ? filter : '&nbsp;' }}</div>
          <div class="text-caption">
            {{ filter ? '' : 'not filtering' }}
            <q-icon :name="filter ? 'o_filter_alt' : 'filter_alt_off'" size="16px">
              <q-tooltip>Filter shown tabs</q-tooltip>
            </q-icon>
            <q-popup-edit
              :model-value="filter"
              v-slot="scope"
              @update:model-value="val => setFilter( val)">
              <q-input v-model="scope.value" dense autofocus counter @keypress.enter="scope.set"/>
            </q-popup-edit>
          </div>
        </q-item-label>
      </q-item-section>
      <q-item-section>{{ pendingTabsCount() }}</q-item-section>

    </template>

    <q-card>
      <q-card-section>
        <TabcardsPending :tabs="filteredTabs()"
                         v-on:selectionChanged="updateSelectionCount"/>
      </q-card-section>
    </q-card>

    <div class="justify-center row q-ma-none q-pa-xl">

    <span v-if="TabsetService.getSelectedPendingTabs().length === 0">
      <q-btn icon="file_download" :label="'Add all to Tabset  ' + tabsStore.currentTabsetName" class="q-mx-lg"
             color="positive"
             @click="saveAllPendingTabs()"></q-btn>
      <q-btn icon="delete_outline" label="Remove all" class="q-mx-lg" color="negative"
             @click="removeAllPendingTabs()"></q-btn>
    </span>
      <span v-else>
      <q-btn icon="file_download" label="add selected" color="positive" class="q-mx-lg"
             @click="saveSelectedPendingTabs()"></q-btn>
       <q-btn icon="delete_outline" label="remove selected" class="q-mx-lg" color="negative"
              @click="removeSelectedPendingTabs()"></q-btn>
    </span>
    </div>

  </q-expansion-item>

  <!-- banners -->
  <q-banner rounded class="bg-amber-1 text-black q-ma-md"
            v-if="!tabsStore.currentTabsetId && tabsStore.tabsets.size === 0">
    <div class="text-body2">
      To get started, add a new tabset by clicking on the plus sign at the lower right page.
    </div>
  </q-banner>

  <q-banner rounded class="bg-amber-1 text-black q-ma-md"
            v-if="!tabsStore.currentTabsetId && tabsStore.tabsets.size > 0">
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
                v-if="featuresStore.debugEnabled">ID: {{
                  tabsStore.getCurrentTabset.id
                }} </q-tooltip>
            </span></div>
          </div>
        </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-7 text-right">

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

  <!-- pinned tabs -->
  <q-expansion-item v-if="tabsStore.pinnedTabs.length > 0"
                    header-class="text-black"
                    expand-icon-class="text-black"
                    expand-separator
                    default-opened>
    <template v-slot:header="{ expanded }">
      <q-item-section>
        <div>
          <span class="text-weight-bold">Pinned Tabs ({{ formatLength(tabsStore.pinnedTabs.length, 'tab', 'tabs') }})</span>
          <div class="text-caption ellipsis">this browser's window's tabs to be pinned</div>
        </div>
      </q-item-section>
    </template>
    <q-card>
      <q-card-section>

        <Tabcards key="pinnedTabs" :tabs="tabsStore.pinnedTabs" group="pinnedTabs" />

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
          <Tabcards :tabs="tabsForGroup( group.id)" :key="'groupedTabs_'+group.id" :group="'groupedTabs_'+group.id"  />
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </template>

  <q-banner rounded class="bg-amber-1 text-black q-ma-md"
            v-if="tabsStore.currentTabsetId && tabsStore.getCurrentTabs.length === 0 && tabsStore.pendingTabset?.tabs.length > 0">
    <div class="text-body2">
      To start adding new tabs to this empty tabset, select the tabs you want to use from above and click save.
    </div>
  </q-banner>
  <q-banner v-else-if="tabsStore.currentTabsetId && tabsStore.getCurrentTabs.length === 0">
    To start adding new tabs to this empty tabset, open new browser tabs and come back to this extension to
    associate them with a tabset.<br><br>
    <!--If you want to assign your open tabs straight away, click <span class="cursor-pointer text-blue" @click="addOpenTabs()"><u>here</u></span>.-->
  </q-banner>

  <!-- rest: neither pinned, grouped, or pending -->
  <q-expansion-item
                    icon="tabs"
                    default-opened
                    header-class="text-black"
                    expand-icon-class="text-black"
                    expand-separator>
    <template v-slot:header="{ expanded }">

      <q-item-section>
        <div>
          <span class="text-weight-bold">Tabs ({{ formatLength(unpinnedNoGroup().length, 'tab', 'tabs') }})</span>
          <div class="text-caption ellipsis">other tabs</div>
        </div>
      </q-item-section>
      <q-item-section></q-item-section>
    </template>

    <q-card>
      <q-card-section>

        <Tabcards :tabs="unpinnedNoGroup()" group="otherTabs" />

      </q-card-section>
    </q-card>
  </q-expansion-item>

  <q-expansion-item
    icon="tabs"
    default-opened
    header-class="text-black"
    expand-icon-class="text-black"
    expand-separator>
    <template v-slot:header="{ expanded }">

      <q-item-section>
        <div>
          <span class="text-weight-bold">ALL</span>
          <div class="text-caption ellipsis">all</div>
        </div>
      </q-item-section>
      <q-item-section></q-item-section>
    </template>

    <q-card>
      <q-card-section>
        <Tabcards :tabs="tabsStore.getCurrentTabs" group="all" />
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
import {MAX_TABS_TO_SHOW} from 'boot/constants'
import RestoreTabsetDialog from "components/dialogues/RestoreTabsetDialog.vue";

const route = useRoute();
const router = useRouter();
const localStorage = useQuasar().localStorage
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const featuresStore = useFeatureTogglesStore()

const tabsetname = ref(tabsStore.currentTabsetName)
const filter = ref('')

const groupedTabsCaption = ref('current tabs, neither pinned nor grouped')
const duplicatesCount = ref(0)

const $q = useQuasar()

watchEffect(() => {
  const currentTabs: Tab[] = tabsStore.getCurrentTabs
  duplicatesCount.value = 0
  _.forEach(tabsStore.pendingTabset?.tabs, pendingTab => {
    if (_.find(currentTabs, t => t?.chromeTab.url === pendingTab.chromeTab.url)) {
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
    // @ts-ignore
    (t: Tab) => !t?.chromeTab.pinned && t?.chromeTab.groupId === -1)
}

function tabsForGroup(groupId: number): Tab[] {
  return _.filter(tabsStore.getCurrentTabs,
    //@ts-ignore
    (t: Tab) => t?.chromeTab.groupId === groupId)
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
const saveAllPendingTabs = () => {
  TabsetService.saveAllPendingTabs()
    .then(() => $q.notify({
      message: 'The tabs have been saved',
      type: 'positive'
    }))
    .catch(() => $q.notify({
      message: 'There was a problem saving (all) the tabs',
      type: 'negative'
    }))
}
const saveSelectedPendingTabs = () => TabsetService.saveSelectedPendingTabs()
const removeSelectedPendingTabs = () => TabsetService.removeSelectedPendingTabs()
const removeAllPendingTabs = () => TabsetService.removeAllPendingTabs()

const selectedCount = ref(0)

const updateSelectionCount = () => {
  selectedCount.value = TabsetService.getSelectedPendingTabs().length
}

const pendingTabsCount = () => {
  let label = formatLength(tabsStore.pendingTabset?.tabs.length - duplicatesCount.value, 'tab', 'tabs')
  if (tabsStore.pendingTabset?.tabs.length - duplicatesCount.value > MAX_TABS_TO_SHOW) {
    label += ", with " + (1 + tabsStore.pendingTabset?.tabs.length - MAX_TABS_TO_SHOW) + " hidden"
  }
  if (duplicatesCount.value > 0) {
    label += ", not showing " + duplicatesCount.value + " duplicates"
  }
  return label
}


const setFilter = (val: string) => {
  console.log("filter", val, filter.value)
  filter.value = val
}

const filteredTabs = () => {
  const noDupliatesTabs = _.filter(tabsStore.pendingTabset?.tabs, (t: Tab) => !t.isDuplicate)
  if (filter.value && filter.value.trim() !== '') {
    return _.filter(noDupliatesTabs, (t: Tab) =>
      (t?.chromeTab.url && t?.chromeTab.url.indexOf(filter.value) >= 0) ||
      (t?.chromeTab.title && t?.chromeTab.title.indexOf(filter.value) >= 0))
  }
  return noDupliatesTabs
}

const restoreDialog = () => {
  $q.dialog({component: RestoreTabsetDialog})
}


</script>
