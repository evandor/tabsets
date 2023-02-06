<template>

  <!-- toolbar -->
  <q-toolbar class="text-primary lightgrey" v-if="!tabsStore.currentTabsetId">
    <div class="row fit">
      <q-toolbar-title>
        <div class="row justify-start items-baseline">
          <div class="col-1"><span class="text-dark">Tabs</span> (no tabset selected)</div>
        </div>
      </q-toolbar-title>
    </div>
  </q-toolbar>
  <q-toolbar class="text-primary lightgrey" v-else>
    <div class="row fit">
      <div class="col-xs-12 col-md-6">
        <q-toolbar-title>
          <div class="row justify-start items-baseline">
            <div class="col-1"><span class="text-dark">Tabs of </span> <span
              class="text-primary text-weight-bold cursor-pointer"
              @mouseenter="showEditButton = true"
              @mouseout="showEditButton = false">
              {{ tabsStore.currentTabsetName }}
               <q-popup-edit :model-value="tabsStore.getCurrentTabset.name" v-slot="scope"
                             @update:model-value="val => setNewName(  val)">
                 <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"/>
               </q-popup-edit>
            </span>
              <q-icon v-if="showEditButton" style="position:relative;top:-11px;left:-5px" color="primary" name="edit"
                      size="16px"/>
              <q-icon v-else size="16px"/>

              <q-icon v-if="tabsStore.tabsets.size > 9 && tabsStore.getCurrentTabset?.status === TabsetStatus.DEFAULT"
                      @click="markAsFavorite()"
                      class="q-ml-sm cursor-pointer"
                      color="warning" name="o_grade" size="20px">
                <q-tooltip class="tooltip">Mark this tabset as a favorite one</q-tooltip>
              </q-icon>

              <q-icon v-if="tabsStore.tabsets.size > 9 && tabsStore.getCurrentTabset?.status === TabsetStatus.FAVORITE"
                      @click="markAsDefault()"
                      class="q-ml-sm cursor-pointer"
                      color="warning" name="grade" size="20px">
                <q-tooltip class="tooltip">Undo marking this tabset as favorite</q-tooltip>
              </q-icon>

              <q-icon v-if="tabsStore.getCurrentTabs?.length > 0 && inBexMode()"
                      @click="restoreDialog"
                      class="q-ml-md cursor-pointer"
                      color="primary" name="o_open_in_browser" size="20px">
                <q-tooltip
                  class="tooltip"
                  :delay="200">
                  Open all the tabs from this tabset in a new window
                </q-tooltip>
              </q-icon>


            </div>
          </div>
        </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-6 text-right">

        <q-btn v-if="showSorting()"
               @click="toggleSorting()"
               style="width:14px"
               class="q-mr-sm" size="10px"
               outline
               icon="o_sort_by_alpha">
          <q-tooltip>Toggle through sorting</q-tooltip>
        </q-btn>

        <q-btn v-if="showSorting()"
               :disable="tabsStore.getCurrentTabset?.sorting === 'custom'"
               @click="toggleOrder()"
               style="width:14px"
               class="q-mr-xl" size="10px"
               outline
               :icon="orderDesc ? 'arrow_drop_up' : 'arrow_drop_down'">
          <q-tooltip>Sorting descending or ascending, currently {{ orderDesc }}</q-tooltip>
        </q-btn>

        <q-btn v-if="permissionsStore.hasFeature('experimentalViews')"
               @click="setView('grid')"
               style="width:14px"
               class="q-mr-sm" size="8px"
               :flat="tabsStore.getCurrentTabset?.view !== 'grid'"
               :outline="tabsStore.getCurrentTabset?.view === 'grid'"
               icon="grid_on">
          <q-tooltip>Use grid layout to visualize your tabs</q-tooltip>
        </q-btn>

        <!-- default view, no need to show if there is no alternative -->
        <q-btn v-if="permissionsStore.hasFeature('experimentalViews')"
               @click="setView('list')"
               style="width:14px"
               class="q-mr-sm" size="10px"
               :flat="tabsStore.getCurrentTabset?.view !== 'list'"
               :outline="tabsStore.getCurrentTabset?.view === 'list'"
               icon="o_list">
          <q-tooltip>Use the list layout to visualize your tabs</q-tooltip>
        </q-btn>

        <!--        <q-btn v-if="permissionsStore.hasAllOrigins()"-->
        <!--               @click="setView('thumbnails')"-->
        <!--               style="width:14px"-->
        <!--               class="q-mr-sm" size="10px"-->
        <!--               :flat="tabsStore.getCurrentTabset?.view !== 'thumbnails'"-->
        <!--               :outline="tabsStore.getCurrentTabset?.view === 'thumbnails'"-->
        <!--               icon="o_image">-->
        <!--          <q-tooltip>Use the thumbnail layout to visualize your tabs</q-tooltip>-->
        <!--        </q-btn>-->

        <q-btn v-if="permissionsStore.hasFeature('experimentalViews')"
               @click="setView('canvas')"
               style="width:14px"
               class="q-mr-sm" size="10px"
               :flat="tabsStore.getCurrentTabset?.view !== 'canvas'"
               :outline="tabsStore.getCurrentTabset?.view === 'canvas'"
               icon="o_shape_line">
          <q-tooltip>Use the canvas freestyle layout to visualize your tabs</q-tooltip>
        </q-btn>


<!--        <q-btn v-if="tabsStore.currentTabsetId !== '' && tabsStore.getTabset(tabsStore.currentTabsetId)"-->
<!--               class="q-ml-xl q-mr-md"-->
<!--               @click="addUrlDialog"-->
<!--               icon="add_circle"-->
<!--               outline-->
<!--               size="0.8em"-->
<!--               color="primary">-->
<!--          <q-tooltip-->
<!--            class="tooltip"-->
<!--            :delay="200">-->
<!--            Copy and Paste or create a new Tab inside this tabset-->
<!--          </q-tooltip>-->
<!--        </q-btn>-->

        <q-btn v-if="tabsStore.currentTabsetId !== '' && tabsStore.getTabset(tabsStore.currentTabsetId)"
               @click="addUrlDialog"
               class="q-ml-xl"
               label="new Tab"
               unelevated
               size="0.8em"
               color="warning">
          <q-tooltip
            class="tooltip"
            :delay="200"
            anchor="center left" self="center right">
            Copy and Paste or create a new Tab inside this tabset
          </q-tooltip>
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

  <!-- pending tabs
  <Transition name="delayed-disappear" v-if="tabsStore.currentTabsetId && permissionsStore.hasFeature('pendingTabs')">
    <PendingTabsAsCarouselWidget/>
  </Transition> -->

  <q-banner rounded class="bg-amber-1 text-black q-ma-md"
            v-if="!tabsStore.currentTabsetId && tabsStore.tabsets.size > 0">
    <div class="text-body2">
      Select an existing tabset from the list or create a new tabset.
    </div>
  </q-banner>

  <!-- pinned tabs -->
  <q-expansion-item v-if="showPinnedTabsSection()"
                    header-class="text-black"
                    expand-icon-class="text-black"
                    expand-separator
                    default-opened>
    <template v-slot:header="{ expanded }">
      <q-item-section>
        <div>
          <span class="text-weight-bold">Pinned Tabs ({{ tabsStore.pinnedTabs?.length }})</span>
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
  <template v-if="usePermissionsStore().hasFeature('useGroups')"
            v-for="group in tabsStore.getCurrentTabset?.groups">
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
    expand-icon-toggle
    default-opened
    data-testid="expansion_item_unpinnedNoGroup"
    header-class="text-black"
    expand-icon-class="text-black">
    <template v-slot:header="{ expanded }">
      <q-item-section>
        <div>
          <span class="text-weight-bold">{{
              unpinnedNoGroupOrAllTabs()?.length
            }} {{ unpinnedNoGroupOrAllTabs()?.length === 1 ? 'Tab' : 'Tabs' }}</span><span class="text-caption">{{
            sortingInfo()
          }}</span>
          <div class="text-caption ellipsis"></div>
        </div>
      </q-item-section>
    </template>

    <InfoMessageWidget
      v-if="unpinnedNoGroupOrAllTabs()?.length > 1"
      :probability="0.3"
      ident="tabsetPage_dnd"
      hint="You can select the favicon images and drag and drop the entries to reorder the list to your wishes"/>

    <q-card>
      <q-card-section>

        <TabList v-if="tabsStore.getCurrentTabset?.view === 'list'"
                 group="otherTabs"
                 :tabs="unpinnedNoGroupOrAllTabs()"/>

        <TabThumbs v-else-if="tabsStore.getCurrentTabset?.view === 'thumbnails'"
                   group="otherTabs"
                   :tabs="unpinnedNoGroupOrAllTabs()"/>

        <Tabcards v-else
                  :tabs="unpinnedNoGroupOrAllTabs()" group="otherTabs" :highlightUrl="highlightUrl"/>

      </q-card-section>

      <q-card-section v-if="tabsStore.getCurrentTabset?.tabs.length === 0
        && permissionsStore.hasFeature('pendingTabs')
        && tabsStore.pendingTabset?.tabs.length > 0">
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
import {useCommandExecutor} from "src/services/CommandExecutor";
import {RenameTabsetCommand} from "src/domain/commands/RenameTabset";
import {TabsetStatus} from "src/models/Tabset";
import {MarkTabsetAsFavoriteCommand} from "src/domain/commands/MarkTabsetAsFavoriteCommand";
import {MarkTabsetAsDefaultCommand} from "src/domain/commands/MarkTabsetAsDefaultCommand";
import {MarkTabsetAsArchivedCommand} from "src/domain/commands/MarkTabsetAsArchivedCommand";
import {StopSessionCommand} from "src/domain/commands/StopSessionCommand";
import {useUtils} from "src/services/Utils";
import {DynamicTabSourceType} from "src/models/DynamicTabSource";

const route = useRoute();
const router = useRouter();
const localStorage = useQuasar().localStorage
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const featuresStore = useFeatureTogglesStore()
const permissionsStore = usePermissionsStore()

const {inBexMode} = useUtils()

const tabsetname = ref(tabsStore.currentTabsetName)
const filter = ref('')
const $q = useQuasar()

const highlightUrl = ref('')

const tabsetId = ref(null as unknown as string)
const orderDesc = ref(false)
const showEditButton = ref(false)

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

const setNewName = (newValue: string) => useCommandExecutor().executeFromUi(new RenameTabsetCommand(tabsStore.currentTabsetId, newValue))


function getOrder() {
  if (tabsStore.getCurrentTabset) {
    switch (tabsStore.getCurrentTabset?.sorting) {
      case 'alphabeticalUrl':
        return (t: Tab) => t.chromeTab.url?.replace("https://", "").replace("http://", "").toUpperCase()
        break
      case 'alphabeticalTitle':
        return (t: Tab) => t.chromeTab.title?.toUpperCase()
        break
      default:
        return (t: Tab) => 1
    }
    return (t: Tab) => 1
  }
}

function unpinnedNoGroupOrAllTabs(): Tab[] {

  if (usePermissionsStore().hasFeature('useGroups')) {
    return _.orderBy(
      _.filter(
        tabsStore.getCurrentTabs,
        // @ts-ignore
        (t: Tab) => !t?.chromeTab.pinned && t?.chromeTab.groupId === -1),
      getOrder(), [orderDesc.value ? 'desc' : 'asc'])
  } else {
    return _.orderBy(tabsStore.getCurrentTabs, getOrder(), [orderDesc.value ? 'desc' : 'asc'])
  }
}


function tabsForGroup(groupId: number): Tab[] {
  return _.orderBy(
    _.filter(
      tabsStore.getTabset(tabsetId.value)?.tabs,
      // @ts-ignore
      (t: Tab) => t?.chromeTab.groupId === groupId),
    getOrder(), [orderDesc.value ? 'desc' : 'asc'])
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

const markAsFavorite = () => useCommandExecutor().executeFromUi(new MarkTabsetAsFavoriteCommand(tabsStore.currentTabsetId))
const markAsDefault = () => useCommandExecutor().executeFromUi(new MarkTabsetAsDefaultCommand(tabsStore.currentTabsetId))
const archiveTabset = () => useCommandExecutor().executeFromUi(new MarkTabsetAsArchivedCommand(tabsStore.currentTabsetId))
const stopSession = () => useCommandExecutor().executeFromUi(new StopSessionCommand(tabsStore.getCurrentTabset))

const toggleSorting = () => TabsetService.toggleSorting(tabsetId.value)
const toggleOrder = () => orderDesc.value = !orderDesc.value

const sortingInfo = (): string => {
  switch (tabsStore.getCurrentTabset?.sorting) {
    case 'custom':
      return ", sorted by Index" + (orderDesc.value ? ', descending' : '')
      break
    case 'alphabeticalUrl':
      return ", sorted by URL" + (orderDesc.value ? ', descending' : '')
      break
    case 'alphabeticalTitle':
      return ", sorted by Title" + (orderDesc.value ? ', descending' : '')
      break
    default:
      return "";
      break
  }
}

const showSorting = () => tabsStore.getCurrentTabs.length > 10

const showPinnedTabsSection = () => usePermissionsStore().hasFeature('useGroups') && tabsStore.pinnedTabs?.length > 0 && !specialView()
</script>

<style>
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0,
  'wght' 400,
  'GRAD' 0,
  'opsz' 48
}
</style>
