<template>

  <!-- toolbar -->
  <q-toolbar class="text-primary lightgrey" v-if="!tabsStore.currentTabsetId">
    <div class="row fit">
      <q-toolbar-title>
        <div class="row justify-start items-baseline">
          <div class="col-1"><span class="text-dark">Tabset</span> (none selected)</div>
        </div>
      </q-toolbar-title>
    </div>
  </q-toolbar>
  <q-toolbar class="text-primary lightgrey" v-else>
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

        <q-btn v-if="permissionsStore.hasAllOrigins()"
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

  <div class="row fit greyBorderTop"></div>

  <!-- pending tabs -->
  <Transition name="delayed-disappear" v-if="tabsStore.currentTabsetId && permissionsStore.hasFeature('pendingTabs')">
    <PendingTabsAsCarouselWidget/>
  </Transition>

  <q-banner rounded class="bg-amber-1 text-black q-ma-md"
            v-if="!tabsStore.currentTabsetId && tabsStore.tabsets.size > 0">
    <div class="text-body2">
      Select an existing tabset from the right or add a new tabset by clicking on the plus sign at the top right.
    </div>
  </q-banner>

  <!-- pinned tabs -->
  <q-expansion-item v-if="tabsStore.pinnedTabs.length > 0 && !specialView()"
                    header-class="text-black"
                    expand-icon-class="text-black"
                    expand-separator
                    default-opened>
    <template v-slot:header="{ expanded }">
      <q-item-section>
        <div>
          <span class="text-weight-bold">Pinned Tabs ({{ tabsStore.pinnedTabs.length }})</span>
          <div class="text-caption ellipsis">this browser's window's tabs to be pinned</div>
        </div>
      </q-item-section>
    </template>
    <q-card>
      <q-card-section>

        <TabList v-if="tabsStore.getCurrentTabset?.view === 'list'"
                 group="pinnedTabs"
                 :tabs="tabsStore.pinnedTabs"/>

        <TabThumbs v-else-if="tabsStore.getCurrentTabset?.view === 'thumbnails'" group="pinnedTabs"
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


          <TabList v-if="tabsStore.getCurrentTabset?.view === 'list'"
                   :group="'groupedTabs_'+group.chromeGroup.id"
                   :tabs="tabsForGroup( group.chromeGroup.id)"/>

          <TabThumbs v-else-if="tabsStore.getCurrentTabset?.view === 'thumbnails'"
                     :group="'groupedTabs_'+group.chromeGroup.id"
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
    v-if="!specialView() && tabsStore.currentTabsetId"
    icon="tabs"
    default-opened
    data-testid="expansion_item_unpinnedNoGroup"
    header-class="text-black"
    expand-icon-class="text-black">
    <template v-slot:header="{ expanded }">
      <q-item-section>
        <div>
          <span class="text-weight-bold">{{
              unpinnedNoGroup().length
            }} {{ unpinnedNoGroup().length === 1 ? 'Tab' : 'Tabs' }}</span>
          <div class="text-caption ellipsis"></div>
        </div>
      </q-item-section>
    </template>

    <InfoMessageWidget
      v-if="unpinnedNoGroup().length > 1"
      :probability="1"
      ident="tabsetPage_dnd"
      hint="You can select the favicon images and drag and drop the entries to reorder the list to your wishes"/>

    <q-card>
      <q-card-section>

        <TabList v-if="tabsStore.getCurrentTabset?.view === 'list'"
                 group="otherTabs"
                 :tabs="unpinnedNoGroup()"/>

        <TabThumbs v-else-if="tabsStore.getCurrentTabset?.view === 'thumbnails'"
                   group="otherTabs"
                   :tabs="unpinnedNoGroup()"/>

        <Tabcards v-else
                  :tabs="unpinnedNoGroup()" group="otherTabs" :highlightUrl="highlightUrl"/>

      </q-card-section>

      <q-card-section v-if="tabsStore.getCurrentTabset?.tabs.length === 0 && tabsStore.pendingTabset?.tabs.length > 0">
        <q-banner rounded class="text-black"
                  style="font-weight: bold; border: 2px solid orange">
          <div class="row justify-center items-center">
            Your tabset does not yet contain any tabs. You can select some (or all) from the list above.
          </div>
        </q-banner>
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

</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {useQuasar} from "quasar";
import Tabcards from "src/components/layouts/Tabcards.vue";
import TabThumbs from "src/components/layouts/TabThumbs.vue";
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
import PendingTabsAsCarouselWidget from "src/components/widgets/PendingTabsAsCarouselWidget.vue"
import {useUiService} from "src/services/useUiService";
import {usePermissionsStore} from "stores/permissionsStore";
import TabList from "components/layouts/TabList.vue";
import InfoMessageWidget from "components/widgets/InfoMessageWidget.vue";

const route = useRoute();
const router = useRouter();
const localStorage = useQuasar().localStorage
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const featuresStore = useFeatureTogglesStore()
const permissionsStore = usePermissionsStore()

const tabsetname = ref(tabsStore.currentTabsetName)
const filter = ref('')
const $q = useQuasar()

const highlightUrl = ref('')

const tabsetId = ref(null as unknown as string)

watchEffect(() => {
  tabsetId.value = route.params.tabsetId as string
  if (tabsetId.value) {
    console.debug("got tabset id", tabsetId.value)
    const ts = tabsStore.selectCurrentTabset(tabsetId.value)
    // if (!ts || TabsetStatus.DELETED === ts.status) {
    //   router.push("/about")
    // }
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
  tabsStore.getCurrentTabset?.view === 'kanban' || tabsStore.getCurrentTabset?.view === 'canvas'

</script>

<style lang="sass" scoped>

.delayed-appear-leave-active
  transition: all 2s ease-in
  transition-delay: 0s

.delayed-appear-enter-from,
.delayed-appear-leave-to
  opacity: 0

</style>
