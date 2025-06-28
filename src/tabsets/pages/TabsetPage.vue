<!-- TabsetsPage -->
<!-- used in pwa, and bex full-page-applciation view -->
<template>
  <!-- toolbar -->
  <q-toolbar v-if="!currentTabsetId">
    <div class="row fit">
      <q-toolbar-title>
        <div class="row justify-start items-baseline">
          <div class="col-10"><span>Tabs</span> (no tabset selected)</div>
          <div class="col-2 text-right">
            <OpenRightDrawerWidget />
          </div>
        </div>
      </q-toolbar-title>
    </div>
  </q-toolbar>
  <q-toolbar v-else>
    <!-- we've got a current tabset id -->
    <div class="row fit">
      <div class="col-xs-12 col-md-6 q-mt-xs">
        <q-toolbar-title>
          <template v-if="useUiStore().leftDrawerOpen">
            <!--            <span class="text-dark" v-if="$q.screen.gt.xs">Tabs of </span>-->
            <span
              class="text-weight-bold cursor-pointer"
              @mouseenter="showEditButton = true"
              @mouseout="showEditButton = false">
              {{ useTabsetsStore().currentTabsetName }}
              <q-popup-edit
                :model-value="tabset?.name"
                v-slot="scope"
                @update:model-value="(val: string) => setNewName(val)">
                <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set" />
              </q-popup-edit>
              <span v-if="tabset.sharing?.sharedBy" class="text-caption"
                >shared by {{ tabset.sharing?.sharedBy }},
                {{ date.formatDate(tabset.augmentedData.sharedAt, 'DD.MM.YYYY HH:mm') }} (readonly:
                {{ tabset.augmentedData.readonly }}, loaded:
                {{ date.formatDate(tabset.loaded, 'DD.MM.YYYY HH:mm') }})</span
              >
            </span>
            <span v-if="tabset.sharing.sharedPath">
              <q-icon class="q-ml-md cursor-pointer" name="refresh" @click="router.push(tabset.sharing.sharedPath)">
                <q-tooltip class="tooltip-small">Refresh</q-tooltip>
              </q-icon>
            </span>
          </template>
          <template v-else>
            <div>
              <TabsetsSelectorWidget />
              <span v-if="tabset.sharing?.sharedBy" class="text-caption"
                >shared by {{ tabset.sharing?.sharedBy }},
                {{ date.formatDate(tabset.augmentedData.sharedAt, 'DD.MM.YYYY HH:mm') }} (readonly:
                {{ tabset.augmentedData.readonly }}, loaded:
                {{ date.formatDate(tabset.loaded, 'DD.MM.YYYY HH:mm') }})</span
              >
            </div>
          </template>
          <q-icon
            v-if="showEditButton"
            style="position: relative; top: -11px; left: -5px"
            color="primary"
            name="edit"
            size="16px" />
        </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-6 text-right">
        <q-btn
          v-if="showSorting()"
          @click="toggleSorting()"
          style="width: 14px"
          class="q-mr-sm"
          size="10px"
          outline
          icon="o_sort_by_alpha">
          <q-tooltip>Toggle through sorting</q-tooltip>
        </q-btn>

        <q-btn
          v-if="showSorting()"
          :disable="tabset?.sorting === 'custom'"
          @click="toggleOrder()"
          style="width: 14px"
          class="q-mr-xl"
          size="10px"
          outline
          :icon="orderDesc ? 'arrow_drop_up' : 'arrow_drop_down'">
          <q-tooltip>Sorting descending or ascending, currently {{ orderDesc }}</q-tooltip>
        </q-btn>

        <!--        <q-btn-->
        <!--          v-if="tabset?.tabs.length > 0"-->
        <!--          @click="setView('grid')"-->
        <!--          style="width: 14px"-->
        <!--          class="q-mr-sm"-->
        <!--          size="8px"-->
        <!--          :flat="tabset?.view !== 'grid'"-->
        <!--          :outline="tabset?.view === 'grid'"-->
        <!--          icon="grid_on">-->
        <!--          <q-tooltip class="tooltip">Use grid layout to visualize your tabs</q-tooltip>-->
        <!--        </q-btn>-->

        <!-- default view, no need to show if there is no alternative -->
        <!--        <q-btn-->
        <!--          v-if="tabset?.tabs.length > 0"-->
        <!--          @click="setView('list')"-->
        <!--          style="width: 14px"-->
        <!--          class="q-mr-sm"-->
        <!--          size="10px"-->
        <!--          :flat="tabset?.view !== 'list'"-->
        <!--          :outline="tabset?.view === 'list'"-->
        <!--          icon="o_list">-->
        <!--          <q-tooltip class="tooltip">Use the list layout to visualize your tabs</q-tooltip>-->
        <!--        </q-btn>-->

        <q-btn
          v-if="
            currentTabsetId !== '' &&
            useTabsetsStore().getTabset(currentTabsetId!) &&
            useTabsetsStore().getCurrentTabset!?.tabs?.length > 10 &&
            $q.screen.gt.xs
          "
          flat
          :disable="tabset?.type === TabsetType.DYNAMIC"
          label="???"
          class="cursor-pointer q-ml-lg"
          size="12px"
          icon="o_filter_alt">
          <!--          <q-popup-edit-->
          <!--            :model-value="useUiStore().tabsFilter"-->
          <!--            v-slot="scope"-->
          <!--            @update:model-value="(val: string) => setFilter(val)">-->
          <!--            <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set" />-->
          <!--          </q-popup-edit>-->
          <q-tooltip class="tooltip" :delay="200" anchor="center left" self="center right">
            Filter this tabset
          </q-tooltip>
        </q-btn>

        <q-icon
          v-if="
            currentTabsetId !== '' &&
            tabset?.type !== TabsetType.DYNAMIC &&
            useTabsetsStore().getTabset(currentTabsetId!)
          "
          class="cursor-pointer"
          size="22px"
          color="warning"
          name="add_circle"
          @click="addUrlDialog">
          <q-tooltip class="tooltip" :delay="200" anchor="center left" self="center right">
            Copy and Paste or create a new Tab inside this tabset
          </q-tooltip>
        </q-icon>

        <!--        <OpenRightDrawerWidget />-->
      </div>
    </div>
  </q-toolbar>

  <div class="row fit greyBorderTop"></div>

  <q-tabs
    v-model="tab"
    dense
    class="text-grey q-ma-none q-pa-none"
    indicator-color="primary"
    align="left"
    narrow-indicator>
    <q-tab name="grid" label="As Grid" />
    <q-tab name="list" label="As List" />
    <q-tab name="details" label="With Details" />
    <q-tab name="export" label="Export" />
  </q-tabs>

  <q-tab-panels v-model="tab" animated>
    <q-tab-panel class="q-ma-none q-pa-none" name="grid">
      <q-banner
        rounded
        class="text-primary q-ma-md"
        style="border: 1px solid #efefef"
        v-if="!currentTabsetId && useTabsetsStore().tabsets.size > 0">
        <div class="text-body2">Select an existing tabset from the list or create a new tabset.</div>
      </q-banner>

      <q-banner v-else-if="!$q.platform.is.bex && tabset?.tabs.length === 0">
        Click on the orange plus sign to add new tabs.
      </q-banner>

      <q-banner v-else-if="tabset?.tabs.length === 0 && tabset?.type !== TabsetType.DYNAMIC">
        To start adding new tabs to this empty tabset, open new browser tabs and come back to this extension to
        associate them with a tabset.<br /><br />
        <!--If you want to assign your open tabs straight away, click <span class="cursor-pointer text-blue" @click="addOpenTabs()"><u>here</u></span>.-->
      </q-banner>

      <!--      <InfoMessageWidget-->
      <!--        v-if="tabsetId === 'BACKUP'"-->
      <!--        :probability="1"-->
      <!--        ident="tabsetPage_backupTabset"-->
      <!--        hint="This is a special type of tabset - it's meant for Backups. You can use it as any other tabset, but when you use the feature-->
      <!-- 'backup and close current tabs' from the 'open tabs' menu, all tabs will be closed and automatically added to this backup tabset." />-->

      <!--      <InfoMessageWidget-->
      <!--        v-if="tabsetId === 'IGNORE'"-->
      <!--        :probability="1"-->
      <!--        ident="tabsetPage_ignoreTabset"-->
      <!--        hint="This is a special type of tabset - it's meant for those tabs which you don't want to track. You can add urls and whenever-->
      <!--a tab's url starts with one of the urls of this tabset, it will be ignored and not added to the tabs to be added." />-->

      <TabsetPageCards
        :tabset="tabset as unknown as Tabset"
        :tabsetFolder="tabsetFolder as unknown as Tabset"
        :simple-ui="false" />
    </q-tab-panel>

    <q-tab-panel class="q-ma-none q-pa-none q-mt-md" name="list">
      <TabList
        group="otherTabs"
        :tabsetId="tabset.id"
        :tabset="tabset"
        :tabsetSorting="tabset.sorting"
        :tabsetSharedId="tabset.sharing?.sharedId!"
        :tabs="tabset.tabs"
        :detailLevel="'MINIMAL'" />
    </q-tab-panel>

    <q-tab-panel class="q-ma-none q-pa-none q-mt-md" name="details">
      <TabList
        group="otherTabs"
        :tabsetId="tabset.id"
        :tabset="tabset"
        :tabsetSorting="tabset.sorting"
        :tabsetSharedId="tabset.sharing?.sharedId!"
        :tabs="tabset.tabs"
        :detailLevel="'MAXIMAL'" />
    </q-tab-panel>

    <q-tab-panel class="q-ma-none q-pa-none" name="export">
      <div class="q-ma-md">
        <q-btn class="q-mb-md" label="export as file" :disable="true">
          <q-tooltip class="tooltip">not implemented yet</q-tooltip>
        </q-btn>
        <TabExportList :tabs="tabset.tabs" />
      </div>
    </q-tab-panel>
  </q-tab-panels>
</template>

<script setup lang="ts">
import { date, uid, useQuasar } from 'quasar'
import TabsetsSelectorWidget from 'src/core/components/widgets/TabsetsSelectorWidget.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import Analytics from 'src/core/utils/google-analytics'
import JsUtils from 'src/core/utils/JsUtils'
import { RenameTabsetCommand } from 'src/tabsets/commands/RenameTabsetCommand'
import { ToggleSortingCommand } from 'src/tabsets/commands/ToggleSorting'
import AddUrlDialog from 'src/tabsets/dialogues/AddUrlDialog.vue'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import TabExportList from 'src/tabsets/pages/pwa/TabExportList.vue'
import TabList from 'src/tabsets/pages/pwa/TabList.vue'
import TabsetPageCards from 'src/tabsets/pages/pwa/TabsetPageCards.vue'
import TabsetService from 'src/tabsets/services/TabsetService'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import OpenRightDrawerWidget from 'src/ui/widgets/OpenRightDrawerWidget.vue'
import { onMounted, onUpdated, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const $q = useQuasar()

const tabsetId = ref(null as unknown as string)
const tabset = ref<Tabset>(new Tabset(uid(), 'empty', []))
const tabsetFolder = ref<Tabset>(new Tabset(uid(), 'empty', []))
const orderDesc = ref(false)
const showEditButton = ref(false)
const currentTabsetId = ref<string | undefined>(undefined)

const tab = ref('grid')

onMounted(() => {
  Analytics.firePageViewEvent('TabsetPage', document.location.href)
  //setTimeout(() => client.stop(), 5000)
})

onUpdated(() => {
  JsUtils.runCssHighlight()
})

watchEffect(() => {
  useTabsetsStore()
    .getCurrentTabsetId()
    .then((tabsetId: string | undefined) => (currentTabsetId.value = tabsetId))
})

watchEffect(() => {
  if (!route || !route.params) {
    return
  }
  tabsetId.value = route?.params.tabsetId as string
  tabset.value = useTabsetsStore().getTabset(tabsetId.value) || new Tabset(uid(), 'empty', [])
  //console.log('watch effect in tabsetpage', tabsetId.value, tabset.value)
  tab.value = route.query['tab'] ? (route.query['tab'] as string) : 'list'
  tabsetFolder.value = useTabsetsStore().getActiveFolder(tabset.value) || tabset.value
})

const setNewName = async (newValue: string) => {
  const currentTabsetId = await useTabsetsStore().getCurrentTabsetId()
  useCommandExecutor().executeFromUi(new RenameTabsetCommand(currentTabsetId!, newValue))
}

const setFilter = (newValue: string) => {
  console.log('filter', newValue)
  const useValue = newValue && newValue.trim().length > 0 ? newValue.trim() : undefined
  // useUiStore().tabsFilter = useValue
  useUiStore().setHighlightTerm(useValue)
  JsUtils.runCssHighlight()
}

const addUrlDialog = () => $q.dialog({ component: AddUrlDialog })

const setView = (view: string) => TabsetService.setView(tabsetId.value, view)

const toggleSorting = () => useCommandExecutor().executeFromUi(new ToggleSortingCommand(tabsetId.value))

const toggleOrder = () => (orderDesc.value = !orderDesc.value)

const showSorting = () => useTabsetsStore().getCurrentTabs.length > 10 && $q.screen.gt.xs
</script>
