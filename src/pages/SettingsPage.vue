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
      <q-tab name="permissions" label="Permissions" v-if="devEnabled" />
      <q-tab name="thirdparty" label="Third Party Services" />
<!--      <q-tab name="ignored" label="Ignored Urls"/>-->
      <q-tab name="archived" label="Archived Tabsets"/>
      <q-tab name="search" label="Search Engine"  v-if="devEnabled" />
<!--      <q-tab name="importExport" label="Import/Export"/>-->
      <q-tab name="featureToggles" label="Feature Toggles"/>
    </q-tabs>
  </div>

  <div v-if="tab === 'appearance'">


    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded class="bg-grey-1 text-primary">On this settings page, you can adjust the general appearance of
        the tabsets extension.
      </q-banner>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          Dark Mode (experimental)
        </div>
        <div class="col-9">
          <q-radio v-model="darkMode" :val="true" label="Enabled"/>
          <q-radio v-model="darkMode" :val="false" label="Disabled"/>
        </div>
      </div>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          Ignore Browser Extensions as tabs
        </div>
        <div class="col-9">
          <q-toggle v-model="ignoreExtensionsEnabled"/>
        </div>
      </div>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          Restore Info Messages
        </div>
        <div class="col-3">
         If you accidentally closed an info message box with a hint, you can restore them all by clicking here:
        </div>
        <div class="col-1"></div>
        <div class="col">
          <q-btn label="Restore Hints" @click.stop="restoreHints" />
        </div>
      </div>

      <div class="row items-baseline q-ma-md" v-if="usePermissionsStore().hasFeature(FeatureIdent.OPENTABS_THRESHOLD)">
        <div class="col-3">
          Warning Thresholds
        </div>
        <div class="col-3">
          warnings start when minimum open tabs count is reached<br>
          Reaching the maximum will turn the bar red.
        </div>
        <div class="col q-ma-xl">
          <q-range
            v-model="settingsStore.thresholds"
            :step=10
            marker-labels
            :min=0
            :max=100
          />
        </div>
      </div>

      <div class="row items-baseline q-ma-md" v-if="usePermissionsStore().hasFeature(FeatureIdent.THUMBNAILS)">
        <div class="col-3">
          Thumbnail Quality in %
        </div>
        <div class="col-3">
          larger Thumbnails look better but need more (local) storage.
        </div>
        <div class="col q-ma-xl">
          <q-slider v-model="settingsStore.thumbnailQuality"
                    marker-labels
                    :min="0" :max="100" :inner-min="10" :inner-max="100" :step=10></q-slider>
        </div>
      </div>

      <div class="row items-baseline q-ma-md" v-if="devEnabled">
        <div class="col-3">
          New Version Simulation
        </div>
        <div class="col-3">
          Simulate that there is a new version available
        </div>
        <div class="col q-ma-xl">
          <span class="text-blue cursor-pointer" @click="simulateNewVersion('0.2.12')">Simulate</span>
        </div>
      </div>

    </div>

  </div>

  <div v-if="tab === 'permissions'">

    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded class="bg-grey-1 text-primary">On this settings page, you can adjust some of the permissions needed for the tabsets extension.
      </q-banner>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          Active Permissions
        </div>
        <div class="col-9">
          {{ permissionsList.join(", ") }}
        </div>
      </div>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          Allowed Origins
        </div>
        <div class="col-9">
          {{ usePermissionsStore().permissions?.origins }}
        </div>
      </div>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          Bookmarks (optional permission)
        </div>
        <div class="col-9">
          <q-radio v-model="bookmarksPermissionGranted" :val="true" label="Granted"/>
          <q-radio v-model="bookmarksPermissionGranted" :val="false" label="Revoked"/>
        </div>
      </div>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          All URLs
        </div>
        <div class="col-9">
          <q-radio v-model="allUrlsOriginGranted" :val="true" label="Granted"/>
          <q-radio v-model="allUrlsOriginGranted" :val="false" label="Revoked"/>
        </div>
      </div>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          History
        </div>
        <div class="col-9">
          <q-radio v-model="historyPermissionGranted" :val="true" label="Granted"/>
          <q-radio v-model="historyPermissionGranted" :val="false" label="Revoked"/>
        </div>
      </div>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          Page Capture
        </div>
        <div class="col-9">
          <q-radio v-model="pageCapturePermissionGranted" :val="true" label="Granted"/>
          <q-radio v-model="pageCapturePermissionGranted" :val="false" label="Revoked"/>
        </div>
      </div>

    </div>


    <div class="row items-baseline q-ma-lg">
      <div class="col-3 text-h6">All URLs</div>
      <div class="col-9">

      </div>
    </div>

    <div class="row items-baseline q-ma-lg">
      <div class="col-3 text-h6">History</div>
      <div class="col-9">

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

  <div v-if="tab === 'thirdparty'">

    <div class="q-pa-md q-gutter-sm">

      <q-banner rounded class="bg-grey-1 text-primary">
        TODO
      </q-banner>

      <div class="row q-pa-md">
        <div class="col-3"><b>DuckDuckGo FavIcon Service</b></div>
        <div class="col-5">Usually, the favicon (the little icon displayed next to a tab url) is provided by the page you are visiting.
          Sometimes, Tabsets does not have the information (yet) and might defer to a third party service, here duckduckgo. Switch this off
          if you do not want to use this service.
        </div>
        <div class="col-1"></div>
        <div class="col-3">
          <q-toggle v-model="ddgEnabled"/>
        </div>
      </div>

    </div>

  </div>

  <div v-if="tab === 'featureToggles'">

    <div class="q-pa-md q-gutter-sm">

      <q-banner rounded class="bg-grey-1 text-primary">Switch on experimental features (or off). These feature toggles are meant for developers
        only as they might break functionality and/or destroy data. Once they are considered 'safe enough', they will be available at the
        "experimental features" view on the left.</q-banner>

      <div class="row q-pa-md">
        <div class="col-3"><b>Developer Mode</b></div>
        <div class="col-3">activates a couple of experimental features and debug insights. You should only use this
          if you can live with loosing data.
        </div>
        <div class="col-1"></div>
        <div class="col-5">
          <q-toggle v-model="devEnabled"/>
        </div>
      </div>

    </div>

  </div>

</template>

<script setup lang="ts">
import {useTabsStore} from "src/stores/tabsStore"
import {useRouter} from "vue-router";
import {ref, watch, watchEffect} from "vue";
import {useQuasar} from "quasar";
import {useSearchStore} from "src/stores/searchStore";
import TabsetService from "src/services/TabsetService";
import _ from "lodash";
import {Tabset, TabsetStatus} from "src/models/Tabset";
import {MarkTabsetAsDefaultCommand} from "src/domain/tabsets/MarkTabsetAsDefault";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {useCommandExecutor} from "src/services/CommandExecutor";
import NavigationService from "src/services/NavigationService";
import {useUiStore} from "src/stores/uiStore";
import {useBookmarksStore} from "src/stores/bookmarksStore";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {GrantPermissionCommand} from "src/domain/commands/GrantPermissionCommand";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {RevokePermissionCommand} from "src/domain/commands/RevokePermissionCommand";
import {GrantOriginCommand} from "src/domain/commands/GrantOriginCommand";
import {RevokeOriginCommand} from "src/domain/commands/RevokeOriginCommand";
import {FeatureIdent} from "src/models/AppFeature";
import {useSettingsStore} from "src/stores/settingsStore"


const tabsStore = useTabsStore()
const featuresStore = useSettingsStore()
const searchStore = useSearchStore()
const settingsStore = useSettingsStore()

const router = useRouter()
const localStorage = useQuasar().localStorage
const $q = useQuasar()

const view = ref('grid')
const indexSize = ref(0)

const syncEnabled = ref<boolean>(featuresStore.isEnabled('sync'))
const statsEnabled = ref<boolean>(featuresStore.isEnabled('stats'))
const devEnabled = ref<boolean>(featuresStore.isEnabled('dev'))
const ddgEnabled = ref<boolean>(!featuresStore.isEnabled('noDDG'))
const ignoreExtensionsEnabled = ref<boolean>(!featuresStore.isEnabled('extensionsAsTabs'))
const permissionsList = ref<string[]>([])

const darkMode = ref<boolean>(localStorage.getItem('darkMode') || false)
const bookmarksPermissionGranted = ref<boolean | undefined>(usePermissionsStore().hasPermission('bookmarks'))
const historyPermissionGranted = ref<boolean | undefined>(usePermissionsStore().hasPermission('history'))
const pageCapturePermissionGranted = ref<boolean | undefined>(usePermissionsStore().hasPermission('history'))
const allUrlsOriginGranted = ref<boolean | undefined>(usePermissionsStore().hasAllOrigins())
// const showBookmarks = ref<boolean>(localStorage.getItem('showBookmarks') || false)
const tab = ref('appearance')

const {handleError} = useNotificationHandler()

watchEffect(() => permissionsList.value = usePermissionsStore().permissions?.permissions || [])

watchEffect(() => bookmarksPermissionGranted.value = usePermissionsStore().hasPermission('bookmarks'))
watchEffect(() => historyPermissionGranted.value = usePermissionsStore().hasPermission('history'))
watchEffect(() => pageCapturePermissionGranted.value = usePermissionsStore().hasPermission('pageCapture'))

watch(() => bookmarksPermissionGranted.value, (newValue, oldValue) => {
  if (newValue === oldValue) {
    return
  }
  if (bookmarksPermissionGranted.value && !usePermissionsStore().hasPermission('bookmarks')) {
    useCommandExecutor()
      .executeFromUi(new GrantPermissionCommand("bookmarks"))
      .then((res: ExecutionResult<boolean>) => bookmarksPermissionGranted.value = res.result)
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
      .then((res: ExecutionResult<boolean>) => historyPermissionGranted.value = res.result)
  } else if (!historyPermissionGranted.value) {
    useCommandExecutor()
      .executeFromUi(new RevokePermissionCommand("history"))
  }
})

watch(() => pageCapturePermissionGranted.value, (newValue, oldValue) => {
  if (newValue === oldValue) {
    return
  }
  if (pageCapturePermissionGranted.value && !usePermissionsStore().hasPermission('pageCapture')) {
    useCommandExecutor()
      .executeFromUi(new GrantPermissionCommand("pageCapture"))
      .then((res: ExecutionResult<boolean>) => pageCapturePermissionGranted.value = res.result)
  } else if (!pageCapturePermissionGranted.value) {
    useCommandExecutor()
      .executeFromUi(new RevokePermissionCommand("pageCapture"))
  }
})

watch(() => allUrlsOriginGranted.value, (newValue, oldValue) => {
  if (newValue === oldValue) {
    return
  }
  if (allUrlsOriginGranted.value && !usePermissionsStore().hasAllOrigins()) {
    useCommandExecutor()
      .executeFromUi(new GrantOriginCommand("none"))
      .then((res: ExecutionResult<boolean>) => allUrlsOriginGranted.value = res.result)
  } else if (!allUrlsOriginGranted.value) {
    useCommandExecutor()
      .executeFromUi(new RevokeOriginCommand("all"))
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
  featuresStore.setFeatureToggle("sync", syncEnabled.value)
  featuresStore.setFeatureToggle("stats", statsEnabled.value)
  featuresStore.setFeatureToggle("dev", devEnabled.value)
  featuresStore.setFeatureToggle("noDDG", !ddgEnabled.value)
  featuresStore.setFeatureToggle("extensionsAsTabs", !ignoreExtensionsEnabled.value)
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

const archivedTabsets = () => {
  let tabsets = [...tabsStore.tabsets.values()]
  return _.sortBy(_.filter(tabsets, (ts: Tabset) => ts.status === TabsetStatus.ARCHIVED), ['name'])
}

const unarchive = (tabset: Tabset) => useCommandExecutor().executeFromUi(new MarkTabsetAsDefaultCommand(tabset.id))

// const ignoredUrls = () => useTabsStore().ignoredTabset?.tabs

const simulateNewVersion = (version: string) => NavigationService.updateAvailable({version: version})

const restoreHints = () => useUiStore().restoreHints()

</script>

