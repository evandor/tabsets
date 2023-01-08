<template>


  <q-toolbar class="text-primary lightgrey" v-if="tabsStore.tabsets.size > 0">
    <div class="row fit">
      <q-toolbar-title>
        <div class="row justify-start items-baseline">
          Tabsets Extension Settings
        </div>
      </q-toolbar-title>
    </div>
  </q-toolbar>

  <div class="justify-start items-start greyBorderTop">
    <q-tabs align="left" class="bg-grey-1"
            v-model="tab"
            no-caps>
      <q-tab name="appearance" label="Appearance"/>
      <q-tab name="permissions" label="Permissions"/>
      <q-tab name="ignored" label="Ignored Urls"/>
      <q-tab name="archived" label="Archived Tabsets"/>
      <q-tab name="search" label="Search Engine" v-if="featuresStore.isEnabled('debug')"/>
      <q-tab name="importExport" label="Import/Export"/>
      <q-tab name="featureToggles" label="Feature Toggles"/>
    </q-tabs>
  </div>

  <div v-if="tab === 'appearance'">
    <div class="row items-baseline q-ma-lg">

      <div class="col-3 text-h6">Dark Mode (experimental)</div>
      <div class="col-9">
        <q-radio v-model="darkMode" :val="true" label="Enabled"/>
        <q-radio v-model="darkMode" :val="false" label="Disabled"/>
      </div>

      <div class="col-3 text-h6">
        Warning Thresholds
      </div>
      <div class="col-3">
        warnings start when minimum open tabs count is reached<br>
        Reaching the maximum will turn the bar red.
      </div>
      <div class="col">
        <q-range
          v-model="settingsStore.thresholds"
          :step=5
          marker-labels
          :min=0
          :max=100
        />
      </div>
    </div>

    <div class="row items-baseline q-ma-lg">

      <div class="col-3 text-h6">
        Thumbnail Quality
      </div>
      <div class="col-3">
        larger Thumbnails look better but need more (local) storage.
      </div>
      <div class="col">
        <q-slider v-model="settingsStore.thumbnailQuality"
                  marker-labels
                  :min="0" :max="100" :inner-min="10" :inner-max="100" :step=5 />
      </div>
    </div>

    <div class="row items-baseline q-ma-lg">

      <div class="col-3 text-h6">
        New Version Simulation
      </div>
      <div class="col-3">
        Simulate that there is a new version available
      </div>
      <div class="col">
        <span class="text-blue cursor-pointer" @click="simulateNewVersion('0.1.2')">Simulate</span>
      </div>
    </div>
  </div>

  <div v-if="tab === 'permissions'">

    <div class="row items-baseline q-ma-lg">
      <div class="col-3 text-h6">Necessary Permissions</div>
      <div class="col-9">
        {{permissionsList}}
      </div>
    </div>

    <div class="row items-baseline q-ma-lg">
      <div class="col-3 text-h6">Allowed Origins</div>
      <div class="col-9">
        {{usePermissionsStore().permissions?.origins}}
      </div>
    </div>

    <div class="row items-baseline q-ma-lg">
      <div class="col-3 text-h6">Bookmarks</div>
      <div class="col-9">
        <q-radio v-model="bookmarksPermissionGranted" :val="true" label="Granted"/>
        <q-radio v-model="bookmarksPermissionGranted" :val="false" label="Revoked"/>
      </div>
    </div>

    <div class="row items-baseline q-ma-lg">
      <div class="col-3 text-h6">All URLs</div>
      <div class="col-9">
        <q-radio v-model="allUrlsOriginGranted" :val="true" label="Granted"/>
        <q-radio v-model="allUrlsOriginGranted" :val="false" label="Revoked"/>
      </div>
    </div>

    <div class="row items-baseline q-ma-lg">
      <div class="col-3 text-h6">History</div>
      <div class="col-9">
        <q-radio v-model="historyPermissionGranted" :val="true" label="Granted"/>
        <q-radio v-model="historyPermissionGranted" :val="false" label="Revoked"/>
      </div>
    </div>
  </div>

  <div v-if="tab === 'ignored'">

    <div class="q-pa-md q-gutter-sm">

      <q-banner rounded class="bg-grey-1 text-primary">Urls can be ignored so that the tabsets extension will not
        notifiy you about changes.
      </q-banner>

      <div class="row q-pa-md" v-for="tabset in ignoredUrls()">
        <div class="col-3"><b>{{ tabset.chromeTab?.url }}</b></div>
        <div class="col-3"></div>
        <div class="col-1"></div>
        <div class="col-5">
          <!--          <q-btn label="Un-Archive" @click="unarchive(tabset)"/>-->
        </div>
      </div>
    </div>

  </div>

  <div v-if="tab === 'archived'">
    <div class="q-pa-md q-gutter-sm">

      <q-banner rounded class="bg-grey-1 text-primary">Tabsets can be archived to remove them from direct view. Here's
        the list of archived tabsets so that
        they can be restored if needed.
      </q-banner>

      <div class="row q-pa-md" v-for="tabset in archivedTabsets()">
        <div class="col-3"><b>{{ tabset.name }}</b></div>
        <div class="col-3"></div>
        <div class="col-1"></div>
        <div class="col-5">
          <q-btn label="Un-Archive" @click="unarchive(tabset)"/>
        </div>
      </div>
    </div>
  </div>

  <div v-if="tab === 'search'">

    <div class="q-pa-md q-gutter-sm">

      <q-banner rounded class="bg-grey-1 text-primary">This Browser Extension tracks your tabsets and provides a
        search
        bar to search for keywords.
      </q-banner>

      <div class="row q-pa-md">
        <div class="col-3"><b>Search Index</b></div>
        <div class="col-3">Current Size: {{ indexSize }} Entries</div>
        <div class="col-1"></div>
        <div class="col-5">
          <span class="text-blue cursor-pointer" @click="downloadIndex">[Download]</span>&nbsp;
          <span class="text-blue cursor-pointer" @click="clearIndex">[clear Index]</span>&nbsp;
        </div>
      </div>
    </div>

  </div>

  <div v-if="tab === 'importExport'">

    <div class="q-pa-md q-gutter-sm">

      <q-banner rounded class="bg-grey-1 text-primary">You can export your data in various formats and re-import them
        from json. Please
        note that it is not guaranteed that older exports can be imported with newer versions of the tabsets
        extension.
      </q-banner>

      <div class="row q-pa-md">
        <div class="col-3"><b>Export</b></div>
        <div class="col-3">json or as bookmarks</div>
        <div class="col-1"></div>
        <div class="col-5">
          <q-btn
            @click="showExportDialog"
            flat round dense icon="file_download" color="primary">
            <q-tooltip>Export your tabsets</q-tooltip>
          </q-btn>
        </div>
      </div>

      <div class="row q-pa-md">
        <div class="col-3"><b>Import</b></div>
        <div class="col-3">from json</div>
        <div class="col-1"></div>
        <div class="col-5">
          <q-btn
            @click="showImportDialog"
            flat round dense icon="file_upload" color="primary">
            <q-tooltip>Import your tabsets backup</q-tooltip>
          </q-btn>
        </div>
      </div>

    </div>


  </div>

  <div v-if="tab === 'featureToggles'">

    <div class="q-pa-md q-gutter-sm">

      <q-banner rounded class="bg-grey-1 text-primary">Switch on experimental features (or off)</q-banner>

      <div class="row q-pa-md">
        <div class="col-3"><b>debug</b></div>
        <div class="col-3">add some information (mainly on tooltips) to help debugging</div>
        <div class="col-1"></div>
        <div class="col-5">
          <q-toggle v-model="debugEnabled"/>
        </div>
      </div>

      <div class="row q-pa-md">
        <div class="col-3"><b>spaces</b></div>
        <div class="col-3">spaces can be used to organize tabsets - a tabset can belong to zero, one or many
          spaces.
          You decide first which space you want to work with.
        </div>
        <div class="col-1"></div>
        <div class="col-5">
          <q-toggle v-model="spacesEnabled"/>
        </div>
      </div>

      <div class="row q-pa-md">
        <div class="col-3"><b>sidebar</b></div>
        <div class="col-3">the sidebar shows the current tabs on the left and let's you open the tabs in an inline
          view.
        </div>
        <div class="col-1"></div>
        <div class="col-5">
          <q-toggle v-model="sidebarEnabled"/>
        </div>
      </div>

      <div class="row q-pa-md">
        <div class="col-3"><b>experimental view</b></div>
        <div class="col-3">add the views 'kanban' (a column layout) and 'canvas' (a freestlye 2D layout) to the
          tabsets
          page.
        </div>
        <div class="col-1"></div>
        <div class="col-5">
          <q-toggle v-model="experimentalViewsEnabled"/>
        </div>
      </div>

      <div class="row q-pa-md">
        <div class="col-3"><b>Stats Page</b></div>
        <div class="col-3">view stats for tabsets, bookmarks and so on
        </div>
        <div class="col-1"></div>
        <div class="col-5">
          <q-toggle v-model="statsEnabled"/>
        </div>
      </div>

      <div class="row q-pa-md">
        <div class="col-3"><b>Develop Mode</b></div>
        <div class="col-3">show additional tab page with more data / insights
        </div>
        <div class="col-1"></div>
        <div class="col-5">
          <q-toggle v-model="devEnabled"/>
        </div>
      </div>

      <div class="row q-pa-md">
        <div class="col-3"><b>New Tab Mode</b></div>
        <div class="col-3">use tabset as your browsers default 'New Tab' page<br>Currently set to
          {{ currentNewTabTabsetId }}.
        </div>
        <div class="col-1"></div>
        <div class="col-5">
          <q-toggle v-model="newTabEnabled"/>
        </div>
      </div>

    </div>

  </div>


</template>

<script setup lang="ts">
import {useTabsStore} from "src/stores/tabsStore"
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {useRouter} from "vue-router";
import {ref, watch, watchEffect} from "vue";
import {useQuasar} from "quasar";
import {INDEX_DB_NAME, INDEX_DB_VERSION} from "boot/constants"
import {useSearchStore} from "src/stores/searchStore";
import {useSettingsStore} from "src/stores/settingsStore";
import TabsetService from "src/services/TabsetService";
import ExportDialog from "components/dialogues/ExportDialog.vue";
import ImportDialog from "components/dialogues/ImportDialog.vue";
import _ from "lodash";
import {Tabset, TabsetStatus} from "src/models/Tabset";
import {MarkTabsetAsDefaultCommand} from "src/domain/commands/MarkTabsetAsDefaultCommand";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {useCommandExecutor} from "src/services/CommandExecutor";
import NavigationService from "src/services/NavigationService";
import {useUiStore} from "stores/uiStore";
import {useBookmarksStore} from "stores/bookmarksStore";
import {usePermissionsStore} from "stores/permissionsStore";
import {GrantPermissionCommand} from "src/domain/commands/GrantPermissionCommand";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {RevokePermissionCommand} from "src/domain/commands/RevokePermissionCommand";
import {GrantOriginCommand} from "src/domain/commands/GrantOriginCommand";
import {RevokeOriginCommand} from "src/domain/commands/RevokeOriginCommand";


const tabsStore = useTabsStore()
const featuresStore = useFeatureTogglesStore()
const searchStore = useSearchStore()
const settingsStore = useSettingsStore()

const router = useRouter()
const localStorage = useQuasar().localStorage
const $q = useQuasar()

const view = ref('grid')
const indexSize = ref(0)
const currentNewTabTabsetId = ref(useUiStore().tabsetIdForNewTab)

const debugEnabled = ref<boolean>(featuresStore.isEnabled('debug'))
const spacesEnabled = ref<boolean>(featuresStore.isEnabled('spaces'))
const sidebarEnabled = ref<boolean>(featuresStore.isEnabled('sidebar'))
const experimentalViewsEnabled = ref<boolean>(featuresStore.isEnabled('experimentalViews'))
const statsEnabled = ref<boolean>(featuresStore.isEnabled('stats'))
const devEnabled = ref<boolean>(featuresStore.isEnabled('dev'))
const newTabEnabled = ref<boolean>(featuresStore.isEnabled('newTab'))
const permissionsList = ref<string[]>([])

const darkMode = ref<boolean>(localStorage.getItem('darkMode') || false)
const bookmarksPermissionGranted = ref<boolean | undefined>(usePermissionsStore().hasPermission('bookmarks'))
const historyPermissionGranted = ref<boolean | undefined>(usePermissionsStore().hasPermission('history'))
const allUrlsOriginGranted = ref<boolean | undefined>(usePermissionsStore().hasAllOrigins())
const showBookmarks = ref<boolean>(localStorage.getItem('showBookmarks') || false)
const tab = ref('appearance')

const {handleError} = useNotificationHandler()

watchEffect(() => permissionsList.value = usePermissionsStore().permissions?.permissions || [])

watchEffect(() => bookmarksPermissionGranted.value = usePermissionsStore().hasPermission('bookmarks'))
watchEffect(() => historyPermissionGranted.value = usePermissionsStore().hasPermission('history'))

watch(() => bookmarksPermissionGranted.value, (newValue, oldValue) => {
  if (newValue === oldValue) {
    return
  }
  if (bookmarksPermissionGranted.value && !usePermissionsStore().hasPermission('bookmarks')) {
    useCommandExecutor()
      .executeFromUi(new GrantPermissionCommand("bookmarks"))
      .then((res:ExecutionResult<boolean>) => bookmarksPermissionGranted.value = res.result)
  } else if (!bookmarksPermissionGranted.value) {
    useCommandExecutor()
      .executeFromUi(new RevokePermissionCommand("bookmarks"))
      .then(() => {
        useBookmarksStore().loadBookmarks()
      })
  }
})

watch(() => historyPermissionGranted.value, (newValue, oldValue) => {
  if (newValue === oldValue) {
    return
  }
  if (historyPermissionGranted.value && !usePermissionsStore().hasPermission('history')) {
    useCommandExecutor()
      .executeFromUi(new GrantPermissionCommand("history"))
      .then((res:ExecutionResult<boolean>) => historyPermissionGranted.value = res.result)
  } else if (!historyPermissionGranted.value) {
    useCommandExecutor()
      .executeFromUi(new RevokePermissionCommand("history"))
      .then(() => {
        //useBookmarksStore().loadBookmarks()
      })
  }
})

watch(() => allUrlsOriginGranted.value, (newValue, oldValue) => {
  if (newValue === oldValue) {
    return
  }
  if (allUrlsOriginGranted.value && !usePermissionsStore().hasAllOrigins()) {
    useCommandExecutor()
      .executeFromUi(new GrantOriginCommand("*://*/*"))
      .then((res:ExecutionResult<boolean>) => allUrlsOriginGranted.value = res.result)
  } else if (!allUrlsOriginGranted.value) {
    useCommandExecutor()
      .executeFromUi(new RevokeOriginCommand("*://*/*"))
      .then(() => {
       // useBookmarksStore().loadBookmarks()
      })
  }
})

watchEffect(() => {
  $q.dark.set(darkMode.value)
  localStorage.set('darkMode', darkMode.value)
})

watchEffect(() => {
  featuresStore.setFeatureToggle("debug", debugEnabled.value)
  featuresStore.setFeatureToggle("spaces", spacesEnabled.value)
  featuresStore.setFeatureToggle("sidebar", sidebarEnabled.value)
  featuresStore.setFeatureToggle("experimentalViews", experimentalViewsEnabled.value)
  featuresStore.setFeatureToggle("stats", statsEnabled.value)
  featuresStore.setFeatureToggle("dev", devEnabled.value)
  featuresStore.setFeatureToggle("newTab", newTabEnabled.value)
})

watchEffect(() => {
  localStorage.set("layout", view.value)
})

watchEffect(() => {
  // @ts-ignore
  indexSize.value = searchStore?.getIndex().size()
})

const downloadIndex = () => {
  const data = JSON.stringify(searchStore?.getIndex())
  return TabsetService.createFile(data, "tabsetIndex.json");
}

const clearIndex = () => searchStore.init()

const showExportDialog = () => $q.dialog({component: ExportDialog})
const showImportDialog = () => $q.dialog({component: ImportDialog})

const archivedTabsets = () => {
  let tabsets = [...tabsStore.tabsets.values()]
  return _.sortBy(_.filter(tabsets, (ts: Tabset) => ts.status === TabsetStatus.ARCHIVED), ['name'])
}

const unarchive = (tabset: Tabset) => useCommandExecutor().executeFromUi(new MarkTabsetAsDefaultCommand(tabset.id))

const ignoredUrls = () => useTabsStore().ignoredTabset?.tabs

const simulateNewVersion = (version: string) => NavigationService.updateAvailable({version: version})

</script>

<style lang="sass" scoped>

.lightgrey
  background-color: $lightgrey

.greyBorderTop
  border-top: 1px solid $bordergrey

</style>
