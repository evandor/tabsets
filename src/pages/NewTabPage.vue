<template>

  <!-- toolbar -->
  <q-toolbar class="text-primary lightgrey" v-if="tabsStore.currentTabsetId">
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
          :flat="tabsetForNewTabPage?.view !== 'grid'"
          :outline="tabsetForNewTabPage?.view === 'grid'"
          icon="grid_on">
          <q-tooltip>Use grid layout to visualize your tabs</q-tooltip>
        </q-btn>

        <q-btn
          @click="setView('list')"
          style="width:14px"
          class="q-mr-sm" size="10px"
          :flat="tabsetForNewTabPage?.view !== 'list'"
          :outline="tabsetForNewTabPage?.view === 'list'"
          icon="o_list">
          <q-tooltip>Use the list layout to visualize your tabs</q-tooltip>
        </q-btn>

        <q-btn
          @click="setView('thumbnails')"
          style="width:14px"
          class="q-mr-sm" size="10px"
          :flat="tabsetForNewTabPage?.view !== 'thumbnails'"
          :outline="tabsetForNewTabPage?.view === 'thumbnails'"
          icon="o_image">
          <q-tooltip>Use the thumbnail layout to visualize your tabs</q-tooltip>
        </q-btn>

        <q-btn v-if="featuresStore.isEnabled('experimentalViews')"
               @click="setView('kanban')"
               style="width:14px"
               class="q-mr-sm" size="10px"
               :flat="tabsetForNewTabPage?.view !== 'kanban'"
               :outline="tabsetForNewTabPage?.view === 'kanban'"
               icon="o_view_kanban">
          <q-tooltip>Use the columns layout to visualize your tabs</q-tooltip>
        </q-btn>

        <q-btn v-if="featuresStore.isEnabled('experimentalViews')"
               @click="setView('canvas')"
               style="width:14px"
               class="q-mr-sm" size="10px"
               :flat="tabsetForNewTabPage?.view !== 'canvas'"
               :outline="tabsetForNewTabPage?.view === 'canvas'"
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

        <q-btn
          v-if="tabsStore.currentTabsetId !== '' && tabsStore.getTabset(tabsStore.currentTabsetId) && useFeatureTogglesStore().isEnabled('newTab')"
          flat dense icon="o_create_new_folder"
          color="primary" :label="$q.screen.gt.sm ? 'Set as New Tab Page' : ''"
          class="q-ml-md q-mr-md"
          @click="setAsNewTabPage">
          <q-tooltip>Choose this tabset to be shown whenever you open a new tab in your browser</q-tooltip>
        </q-btn>

      </div>
    </div>
  </q-toolbar>


  <!-- pinned tabs -->
  <q-card>
    <q-card-section>
<!--      <Tablist v-if="tabsetForNewTabPage?.view === 'list'" :tabs="pinned()"/>-->
<!--      <TabThumbs v-else-if="tabsetForNewTabPage?.view === 'thumbnails'" :tabs="pinned()"/>-->
      <Tabcards4NewTabPage key="pinnedTabs" :tabs="pinned()" group="pinnedTabs"/>
    </q-card-section>
  </q-card>

  <!-- chrome groups new -->
  <template v-for="group in tabsetForNewTabPage?.groups">
    <div
      v-if="tabsForGroup(group.chromeGroup.id).length > 0 && !specialView()">

      <q-card>
        <q-card-section>
<!--          <Tablist v-if="tabsetForNewTabPage?.view === 'list'" :tabs="tabsForGroup( group.chromeGroup.id)"/>-->
<!--          <TabThumbs v-else-if="tabsetForNewTabPage?.view === 'thumbnails'" :tabs="tabsForGroup( group.chromeGroup.id)"/>-->
          <Tabcards4NewTabPage
                    :tabs="tabsForGroup( group.chromeGroup.id)" :key="'groupedTabs_'+group.chromeGroup.id"
                    :group="'groupedTabs_'+group.chromeGroup.id"
                    />
        </q-card-section>
      </q-card>
    </div>
  </template>


  <q-card>
    <q-card-section>
<!--      <Tablist v-if="tabsetForNewTabPage?.view === 'list'" :tabs="unpinnedNoGroup()"/>-->
<!--      <TabThumbs v-else-if="tabsetForNewTabPage?.view === 'thumbnails'" :tabs="unpinnedNoGroup()"/>-->
      <Tabcards4NewTabPage :tabs="unpinnedNoGroup()" group="otherTabs"/>
    </q-card-section>
  </q-card>

  <q-card v-if="tabsetForNewTabPage?.view === 'kanban'">
    <q-card-section>

      <TabColumns/>

    </q-card-section>
  </q-card>

  <q-card v-if="tabsetForNewTabPage?.view === 'canvas'">
    <q-card-section>

      <TabsCanvas :key="'tabCanvas_' + tabsStore.currentTabsetId"/>

    </q-card-section>
  </q-card>

  <!--  <Fab/>-->

</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {useQuasar} from "quasar";
import TabColumns from "src/components/layouts/TabColumns.vue";
import TabsCanvas from "src/components/layouts/TabsCanvas.vue";
import _ from "lodash"
import {useTabsStore} from "src/stores/tabsStore";
import {useTabGroupsStore} from "src/stores/tabGroupsStore";
import TabsetService from "src/services/TabsetService";
import {Tab} from "src/models/Tab";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import RestoreTabsetDialog from "components/dialogues/RestoreTabsetDialog.vue";
import AddUrlDialog from "components/dialogues/AddUrlDialog.vue";
import {Tabset} from "src/models/Tabset";
import {useUiService} from "src/services/useUiService";
import {useUiStore} from "stores/uiStore";
import Tabcards4NewTabPage from "components/layouts/Tabcards4NewTabPage.vue";

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

const tabsetId = ref<string>(useUiStore().tabsetIdForNewTab || '')
const tabsetForNewTabPage = ref<Tabset | undefined>(undefined)

watchEffect(() => {
  const tsId = useUiStore().tabsetIdForNewTab
  console.log("tsId", tsId)
  if (tsId) {
    tabsetForNewTabPage.value = useTabsStore().getTabset(tsId)
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
    _.map(tabsetForNewTabPage.value?.tabs, t => t),
    // @ts-ignore
    (t: Tab) => !t?.chromeTab?.pinned && t?.chromeTab?.groupId === -1)
}

function pinned() {
  return _.filter(
    _.map(tabsetForNewTabPage.value?.tabs, t => t),
    (t: Tab) => t?.chromeTab?.pinned)
}

function tabsForGroup(groupId: number): Tab[] {
  return _.filter(tabsetForNewTabPage.value?.tabs,
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

const selectedCount = ref(0)

const updateSelectionCount = () => {
  selectedCount.value = TabsetService.getSelectedPendingTabs().length
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

const setAsNewTabPage = () => {
  useUiService().setTabsetForNewTabPage(tabsetId.value)
}


const setView = (view: string) => TabsetService.setView(tabsetId.value, view)

const specialView = (): boolean =>
  tabsetForNewTabPage.value?.view === 'kanban' || tabsetForNewTabPage.value?.view === 'canvas'

</script>

<style lang="sass" scoped>

.lightgrey
  background-color: $lightgrey

.greyBorderTop
  border-top: 1px solid $bordergrey

</style>
