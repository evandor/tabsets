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
      <q-btn icon="delete_outline" label="Clear changed tabs" class="q-mx-lg" color="negative"
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

  <!-- banners -->
  <!--  <q-banner rounded class="bg-amber-1 text-black q-ma-md"-->
  <!--            v-if="!tabsStore.currentTabsetId && tabsStore.tabsets.size === 0">-->
  <!--    <div class="text-body2">-->
  <!--      To get started, add a new tabset by clicking on the plus sign at the lower right page.-->
  <!--    </div>-->
  <!--  </q-banner>-->

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

            </span></div>
          </div>
        </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-7 text-right">

        <q-btn
          @click="setView('grid')"
          style="width:14px"
          class="q-mr-sm" size="8px"
          :flat="tabsStore.getCurrentTabset?.view !== 'grid'"
          :outline="tabsStore.getCurrentTabset?.view === 'grid'"
          icon="grid_on">
          <q-tooltip>Use grid layout to visualize your tabs</q-tooltip>
        </q-btn>

        <q-btn
          @click="setView('list')"
          style="width:14px"
          class="q-mr-sm" size="10px"
          :flat="tabsStore.getCurrentTabset?.view !== 'list'"
          :outline="tabsStore.getCurrentTabset?.view === 'list'"
          icon="o_list">
          <q-tooltip>Use the list layout to visualize your tabs</q-tooltip>
        </q-btn>

        <q-btn
          @click="setView('thumbnails')"
          style="width:14px"
          class="q-mr-sm" size="10px"
          :flat="tabsStore.getCurrentTabset?.view !== 'thumbnails'"
          :outline="tabsStore.getCurrentTabset?.view === 'thumbnails'"
          icon="o_image">
          <q-tooltip>Use the thumbnail layout to visualize your tabs</q-tooltip>
        </q-btn>

        <q-btn v-if="featuresStore.isEnabled('experimentalViews')"
               @click="setView('kanban')"
               style="width:14px"
               class="q-mr-sm" size="10px"
               :flat="tabsStore.getCurrentTabset?.view !== 'kanban'"
               :outline="tabsStore.getCurrentTabset?.view === 'kanban'"
               icon="o_view_kanban">
          <q-tooltip>Use the columns layout to visualize your tabs</q-tooltip>
        </q-btn>

        <q-btn v-if="featuresStore.isEnabled('experimentalViews')"
               @click="setView('canvas')"
               style="width:14px"
               class="q-mr-sm" size="10px"
               :flat="tabsStore.getCurrentTabset?.view !== 'canvas'"
               :outline="tabsStore.getCurrentTabset?.view === 'canvas'"
               icon="o_shape_line">
          <q-tooltip>Use the canvas freestyle layout to visualize your tabs</q-tooltip>
        </q-btn>

        <!--        <q-icon v-if="tabsStore.getCurrentTabs.length > 0"-->
        <!--                class="q-ml-none q-mr-md"-->
        <!--          name="more_vert"-->
        <!--        />-->

        <q-btn v-if="tabsStore.getCurrentTabs.length > 0"
               flat dense icon="o_restore_page"
               color="primary" :label="$q.screen.gt.sm ? 'Open Tabset...' : ''"
               class="q-ml-xl q-mr-none"
               @click="restoreDialog">
          <q-tooltip>Replace your current tabs with all the tabs from this tabset</q-tooltip>
        </q-btn>

        <q-btn v-if="tabsStore.currentTabsetId !== '' && tabsStore.getTabset(tabsStore.currentTabsetId)"
               flat dense icon="o_add"
               color="primary" :label="$q.screen.gt.sm ? 'Add Url...' : ''"
               class="q-ml-md q-mr-md"
               @click="addUrlDialog">
          <q-tooltip>Copy and Paste or create a new Url for this tabset</q-tooltip>
        </q-btn>

      </div>
    </div>
  </q-toolbar>

  <!-- pinned tabs -->
  <q-expansion-item v-if="tabsStore.pinnedTabs.length > 0 && !specialView()"
                    header-class="text-black"
                    expand-icon-class="text-black"
                    expand-separator
                    default-opened>
    <template v-slot:header="{ expanded }">
      <q-item-section>
        <div>
          <span class="text-weight-bold">Pinned Tabs ({{
              formatLength(tabsStore.pinnedTabs.length, 'tab', 'tabs')
            }})</span>
          <div class="text-caption ellipsis">this browser's window's tabs to be pinned</div>
        </div>
      </q-item-section>
    </template>
    <q-card>
      <q-card-section>

        <Tablist v-if="tabsStore.getCurrentTabset?.view === 'list'"
                 :tabs="tabsStore.pinnedTabs"/>

        <TabThumbs v-else-if="tabsStore.getCurrentTabset?.view === 'thumbnails'"
                   :tabs="tabsStore.pinnedTabs"/>


        <Tabcards v-else
                  key="pinnedTabs" :tabs="tabsStore.pinnedTabs" group="pinnedTabs" :highlightUrl="highlightUrl"/>

      </q-card-section>
    </q-card>
  </q-expansion-item>

  <!-- chrome groups new -->
  <template v-for="group in tabsStore.getCurrentTabset?.groups">
    <q-expansion-item
      v-if="tabsForGroup(group.chromeGroup.id).length > 0 && !specialView()"
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
            <span class="text-weight-bold">{{ group.chromeGroup.title }}</span>
            <div class="text-caption">chrome browser's group of tabs</div>
          </div>
        </q-item-section>
        <q-item-section>{{ formatLength(tabsForGroup(group.chromeGroup.id).length, 'tab', 'tabs') }}</q-item-section>
      </template>
      <q-card>
        <q-card-section>


          <Tablist v-if="tabsStore.getCurrentTabset?.view === 'list'"
                   :tabs="tabsForGroup( group.chromeGroup.id)"/>

          <TabThumbs v-else-if="tabsStore.getCurrentTabset?.view === 'thumbnails'"
                     :tabs="tabsForGroup( group.chromeGroup.id)"/>

          <Tabcards v-else
                    :tabs="tabsForGroup( group.chromeGroup.id)" :key="'groupedTabs_'+group.chromeGroup.id"
                    :group="'groupedTabs_'+group.chromeGroup.id"
                    :highlightUrl="highlightUrl"/>


        </q-card-section>
      </q-card>
    </q-expansion-item>
  </template>

  <q-banner rounded class="bg-amber-1 text-black q-ma-md"
            v-if="tabsStore.currentTabsetId && tabsStore.getTabset(tabsetId.value)?.tabs.length === 0 && tabsStore.pendingTabset?.tabs.length > 0">
    <div class="text-body2">
      To start adding new tabs to this empty tabset, select the tabs you want to use from above and click save.
    </div>
  </q-banner>
  <q-banner v-else-if="tabsStore.currentTabsetId && tabsStore.getTabset(tabsetId.value)?.tabs.length === 0">
    To start adding new tabs to this empty tabset, open new browser tabs and come back to this extension to
    associate them with a tabset.<br><br>
    <!--If you want to assign your open tabs straight away, click <span class="cursor-pointer text-blue" @click="addOpenTabs()"><u>here</u></span>.-->
  </q-banner>

  <!-- rest: neither pinned, grouped, or pending -->
  <q-expansion-item
    v-if="!specialView()"
    icon="tabs"
    default-opened
    data-testid="expansion_item_unpinnedNoGroup"
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
    </template>

    <q-card>
      <q-card-section>

        <Tablist v-if="tabsStore.getCurrentTabset?.view === 'list'"
                 :tabs="unpinnedNoGroup()"/>

        <TabThumbs v-else-if="tabsStore.getCurrentTabset?.view === 'thumbnails'"
                   :tabs="unpinnedNoGroup()"/>

        <Tabcards v-else
                  :tabs="unpinnedNoGroup()" group="otherTabs" :highlightUrl="highlightUrl"/>

      </q-card-section>
    </q-card>
  </q-expansion-item>

  <q-card v-if="tabsStore.getCurrentTabset?.view === 'kanban'">
    <q-card-section>

      <TabColumns/>

    </q-card-section>
  </q-card>

  <q-card v-if="tabsStore.getCurrentTabset?.view === 'canvas'">
    <q-card-section>

      <TabsCanvas :key="'tabCanvas_' + tabsStore.currentTabsetId"/>

    </q-card-section>
  </q-card>

  <Fab/>

</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {useQuasar} from "quasar";
import Fab from "src/components/Fab.vue";
import Tabcards from "src/components/layouts/Tabcards.vue";
import TabThumbs from "src/components/layouts/TabThumbs.vue";
import TabcardsPending from "src/components/layouts/TabcardsPending.vue";
import TabColumns from "src/components/layouts/TabColumns.vue";
import TabsCanvas from "src/components/layouts/TabsCanvas.vue";
import Tablist from "src/components/layouts/Tablist.vue";
import _ from "lodash"
import {useTabsStore} from "src/stores/tabsStore";
import {useTabGroupsStore} from "src/stores/tabGroupsStore";
import TabsetService from "src/services/TabsetService";
import {Tab} from "src/models/Tab";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {MAX_TABS_TO_SHOW} from 'boot/constants'
import RestoreTabsetDialog from "components/dialogues/RestoreTabsetDialog.vue";
import AddUrlDialog from "components/dialogues/AddUrlDialog.vue";

const route = useRoute();
const router = useRouter();
const localStorage = useQuasar().localStorage
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const featuresStore = useFeatureTogglesStore()

const tabsetname = ref(tabsStore.currentTabsetName)
const filter = ref('')
const $q = useQuasar()

const highlightUrl = ref('')

const tabsetId = ref(null as unknown as string)

watchEffect(() => {
  tabsetId.value = route.params.tabsetId as string
  if (tabsetId.value) {
    console.log("got tabset id", tabsetId.value)
    tabsStore.selectCurrentTabset(tabsetId.value)
  }
})

watchEffect(() => {
  const highlight = route.query['highlight'] as unknown as string
  if (highlight && highlight.length > 0) {
    try {
      highlightUrl.value = atob(highlight)
    } catch (e: any) {
      console.error("highlight error", e)
    }
  }
})

function unpinnedNoGroup() {
  return _.filter(
    _.map(tabsStore.getCurrentTabs, t => t),
    // @ts-ignore
    (t: Tab) => !t?.chromeTab.pinned && t?.chromeTab.groupId === -1)
}

function tabsForGroup(groupId: number): Tab[] {
  return _.filter(tabsStore.getTabset(tabsetId.value)?.tabs,
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

const restoreDialog = () => $q.dialog({component: RestoreTabsetDialog})
const addUrlDialog = () => $q.dialog({component: AddUrlDialog})


const setView = (view: string) => TabsetService.setView(tabsetId.value, view)

const specialView = (): boolean =>
  tabsStore.getCurrentTabset?.view === 'kanban' || tabsStore.getCurrentTabset?.view === 'canvas'

</script>
