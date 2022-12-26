<template>
  <q-expansion-item v-if="tabsStore.pendingTabset?.tabs.length > 0"
                    class="q-ma-lg greyBorderTop"
                    header-class="text-black"
                    expand-icon-class="text-black"
                    expand-icon-toggle
                    default-opened>
    <template v-slot:header="{ expanded }">

      <q-item-section>
        <div>
          <span class="text-weight-bold">Unassigned Tabs</span>
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

    <q-carousel
      v-model="slide"
      transition-prev="slide-right"
      transition-next="slide-left"
      swipeable
      animated
      control-color="primary"
      navigation
      padding
      arrows
      height="230px"
      class="bg-grey-1 shadow-1 rounded-borders"
    >
      <q-carousel-slide :name="index+1" class="column no-wrap" v-for="(chunk,index) in pendingTabsChunks()">
        <div class="row fit justify-start items-center q-gutter-xs q-col-gutter no-wrap">

          <div class="col-3" v-for="tab in chunk">
            <TabcardPending :tab="tab"/>
          </div>

        </div>
      </q-carousel-slide>

    </q-carousel>

    <div class="justify-center row q-ma-none q-pa-xl">

    <span v-if="TabsetService.getSelectedPendingTabs().length === 0">
      <q-btn icon="file_download" :label="'Add all ' + tabsStore.pendingTabset.tabs.length + ' tabs   to Tabset ' + tabsStore.currentTabsetName" class="q-mx-lg"
             color="positive"
             @click="saveAllPendingTabs()"></q-btn>
      <q-btn icon="delete_outline" label="Clear unassigned tabs" class="q-mx-lg" color="negative"
             @click="removeAllPendingTabs()"></q-btn>
    </span>
      <span v-else>
      <q-btn icon="file_download" label="add selected" color="positive" class="q-mx-lg"
             @click="saveSelectedPendingTabs()"></q-btn>
       <q-btn icon="delete_outline" label="clear selected tabs" class="q-mx-lg" color="negative"
              @click="removeSelectedPendingTabs()"></q-btn>
    </span>
    </div>

  </q-expansion-item>

</template>

<script lang="ts" setup>
import {useTabsStore} from "stores/tabsStore";
import TabsetService from "src/services/TabsetService";
import {MAX_TABS_TO_SHOW} from "boot/constants";
import TabcardPending from "src/components/layouts/TabcardPending.vue";

import _ from "lodash";
import {Tab} from "src/models/Tab";
import {ref} from "vue";
import {useQuasar} from "quasar";

const tabsStore = useTabsStore()
const filter = ref('')
const slide = ref(1)
const $q = useQuasar()

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

const formatLength = (length: number, singular: string, plural: string) => {
  return (length > 1 || length === 0) ? length + ' ' + plural : length + ' ' + singular
}

const pendingTabsCount = () => {
  let label = formatLength(tabsStore.pendingTabset?.tabs.length, 'tab', 'tabs')
  if (tabsStore.pendingTabset?.tabs.length > MAX_TABS_TO_SHOW) {
    label += ", with " + (1 + tabsStore.pendingTabset?.tabs.length - MAX_TABS_TO_SHOW) + " hidden"
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

const pendingTabsChunks = (): any[][] => {
  const tabs = filteredTabs()
  const chunks = _.chunk(tabs, 4)
  //console.log("chunks", chunks)
  return chunks
}
</script>
