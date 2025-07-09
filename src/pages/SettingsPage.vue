<template>
  <q-toolbar>
    <div class="row fit">
      <q-toolbar-title>
        <div class="row justify-start items-baseline">
          <div class="col-10">Tabsets Extension Settings</div>
          <div class="col-2 text-right">
            <OpenRightDrawerWidget />
          </div>
        </div>
      </q-toolbar-title>
    </div>
  </q-toolbar>

  <div class="justify-start items-start greyBorderTop">
    <q-tabs align="left" inline-label v-model="tab" no-caps>
      <q-tab name="appearance" :label="t('appearance')" />
      <q-tab name="account" label="Account" />
      <q-tab name="sharing" label="Sharing" />
      <q-tab name="thirdparty" label="Third Party Services" />
      <q-tab name="tags" label="Tags" />
      <q-tab name="ignored" label="Ignored Urls" v-if="showIgnored()" />
      <q-tab
        name="archived"
        label="Archived Tabsets"
        v-if="useFeaturesStore().hasFeature(FeatureIdent.ARCHIVE_TABSET)" />
      <q-tab name="search" label="Search Engine" v-if="useSettingsStore().has('DEV_MODE')" />
      <q-tab name="importExport" label="Import/Export" />
      <q-tab name="backup" label="Backup" v-if="useSettingsStore().has('DEV_MODE')" />
      <q-tab name="internals" label="Internals" v-if="useSettingsStore().has('DEV_MODE')" />
      <!--      <q-tab name="featureToggles" label="Feature Toggles"-->
      <!--             :class="useAuthStore().userMayAccess(AccessItem.FEATURE_TOGGLES) ? 'text-primary':'text-grey'"/>-->
      <q-tab name="featureToggles" label="Feature Toggles" />
    </q-tabs>
  </div>

  <div v-if="tab === 'appearance'">
    <AppearanceSettings />
  </div>

  <div v-if="tab === 'tags'">
    <TagsSettings />
  </div>

  <div v-if="tab === 'account'">
    <div class="q-pa-md q-gutter-sm">
      <SubscriptionSettings />

      <q-banner rounded style="border: 1px solid orange">
        TODO: Caution! The user will be deleted immediately
      </q-banner>

      <q-btn label="delete account" class="bg-red-1" @click="deleteAccount()" />
    </div>
  </div>

  <div v-if="tab === 'sharing'">
    <div class="q-pa-md q-gutter-sm">
      <SharingSettings v-if="useAuthStore().isAuthenticated()" />
      <q-banner v-else rounded> To use sharing, you need to have a (free) account. </q-banner>
    </div>
  </div>

  <div v-if="tab === 'internals'">
    <InternalSettings />
  </div>

  <div v-if="tab === 'ignored'">
    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded
        >Urls can be ignored so that the tabsets extension will close them immediately when cleaning up
      </q-banner>
      <div class="row">
        <div class="col">
          <q-btn class="q-ml-md" label="show Ignored" @click="showIgnoredTabset()" />
        </div>
      </div>

      <!--      <div class="row q-pa-md" v-for="tabset in ignoredUrls()">-->
      <!--        <div class="col-3"><b>{{ tabset.url }}</b></div>-->
      <!--        <div class="col-3"></div>-->
      <!--        <div class="col-1"></div>-->
      <!--        <div class="col-5">-->
      <!--          &lt;!&ndash;          <q-btn label="Un-Archive" @click="unarchive(tabset)"/>&ndash;&gt;-->
      <!--        </div>-->
      <!--      </div>-->
    </div>
  </div>

  <div v-if="tab === 'archived'">
    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded style="border: 1px solid orange"
        >Tabsets can be archived to remove them from direct view. Here's the list of archived tabsets so that they can
        be restored if needed.
      </q-banner>

      <div class="row q-pa-md" v-for="tabset in archivedTabsets()">
        <div class="col-3">
          <b>{{ tabset.name }}</b>
        </div>
        <div class="col-3"></div>
        <div class="col-1"></div>
        <div class="col-5">
          <q-btn label="Un-Archive" @click="unarchive(tabset as Tabset)" />
        </div>
      </div>
    </div>
  </div>

  <div v-if="tab === 'search'">
    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded style="border: 1px solid orange"
        >This Browser Extension tracks your tabsets and provides a search bar to search for keywords.
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
      <div class="row">
        <vue-json-pretty
          style="font-size: 80%"
          :show-length="true"
          :deep="2"
          v-model:data="state.data"
          :show-double-quotes="true" />
      </div>
    </div>
  </div>

  <div v-if="tab === 'thirdparty'">
    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded style="border: 1px solid orange"> TODO</q-banner>

      <div class="row q-pa-md">
        <div class="col-3"><b>Disable DuckDuckGo FavIcon Service</b></div>
        <div class="col-5">
          Usually, the favicon (the little icon displayed next to a tab url) is provided by the page you are visiting.
          Sometimes, Tabsets does not have the information (yet) and might defer to a third party service, here
          duckduckgo. Switch this off if you do not want to use this service.
        </div>
        <div class="col-1"></div>
        <div class="col-3">
          <q-toggle v-model="ddgEnabled" @click="updateSettings('noDDG', ddgEnabled)" />
        </div>
      </div>

      <div class="row q-pa-md">
        <div class="col-3"><b>Opt-out Performance Metrics and Error Tracking</b></div>
        <div class="col-5">
          We track anonymous performance metrics and track error messages to improve our application. If you do not want
          to transmit any of this active this toggle to opt out.
        </div>
        <div class="col-1"></div>
        <div class="col-3">
          <q-toggle
            v-model="monitoringDisabled"
            :disable="optOutIsDisabled()"
            @click="updateSettings('noMonitoring', monitoringDisabled)">
            <q-tooltip class="tooltip-small">Disabled, running in development mode</q-tooltip>
          </q-toggle>
        </div>
      </div>
    </div>
  </div>

  <div v-if="tab === 'importExport'">
    <ImportExportSettings @show-tab="(t: string) => setTab(t)" />
  </div>

  <div v-if="tab === 'backup'">
    <BackupSettings />
  </div>

  <div v-if="tab === 'featureToggles'">
    <FeatureToggleSettings />
  </div>
</template>

<script setup lang="ts">
/**
 * refactoring remark: uses many other modules, needs to be one-per-application
 *
 */

/**
 * refactoring remark: uses many other modules, needs to be one-per-application
 *
 */
import { getAuth } from 'firebase/auth/web-extension'
import _ from 'lodash'
import FeatureToggleSettings from 'pages/helper/FeatureToggleSettings.vue'
import SubscriptionSettings from 'pages/helper/SubscriptionSettings.vue'
import { LocalStorage, useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { Account } from 'src/core/models/Account'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUtils } from 'src/core/services/Utils'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import Analytics from 'src/core/utils/google-analytics'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useSearchStore } from 'src/search/stores/searchStore'
import { MarkTabsetAsDefaultCommand } from 'src/tabsets/commands/MarkTabsetAsDefault'
import { Tabset, TabsetStatus } from 'src/tabsets/models/Tabset'
import TabsetService from 'src/tabsets/services/TabsetService'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { DrawerTabs, useUiStore } from 'src/ui/stores/uiStore'
import { useAuthStore } from 'stores/authStore'
import { onMounted, reactive, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import VueJsonPretty from 'vue-json-pretty'
import { useRoute } from 'vue-router'
import 'vue-json-pretty/lib/styles.css'
import SharingSettings from 'pages/helper/SharingSettings.vue'
import DeleteAccountCommand from 'src/account/commands/DeleteAccountCommand'
import { SettingIdent } from 'src/app/models/SettingIdent'
import ImportExportSettings from 'src/core/pages/helper/ImportExportSettings.vue'
import InternalSettings from 'src/core/pages/helper/InternalSettings.vue'
import AppearanceSettings from 'src/pages/helper/AppearanceSettings.vue'
import BackupSettings from 'src/tabsets/pages/settings/BackupSettings.vue'
import OpenRightDrawerWidget from 'src/ui/widgets/OpenRightDrawerWidget.vue'

const { t } = useI18n()

const { sendMsg } = useUtils()

const searchStore = useSearchStore()
const settingsStore = useSettingsStore()

const localStorage = useQuasar().localStorage
const route = useRoute()

useUiStore().rightDrawerSetActiveTab(DrawerTabs.FEATURES)

const view = ref('grid')
const indexSize = ref(0)
const searchIndexAsJson = ref(null)

const state = reactive({
  val: JSON.stringify(searchIndexAsJson),
  data: searchIndexAsJson,
})

const ddgEnabled = ref<boolean>(!settingsStore.isEnabled('noDDG'))
const monitoringDisabled = ref<boolean>(process.env.DEV ? true : settingsStore.isEnabled('noMonitoring'))
const ignoreExtensionsEnabled = ref<boolean>(!settingsStore.isEnabled('extensionsAsTabs'))

const account = ref<Account | undefined>(undefined)

const tab = ref<string>(route.query['tab'] ? (route.query['tab'] as string) : 'appearance')

const autoSwitcherOption = ref<number>((localStorage.getItem('ui.tabSwitcher') as number) || 5000)

onMounted(() => {
  Analytics.firePageViewEvent('SettingsPage', document.location.href)
  account.value = useAuthStore().getAccount()
})

watchEffect(() => {
  const data = JSON.stringify(searchStore?.getIndex())
  searchIndexAsJson.value = JSON.parse(data)
})

watchEffect(() => {
  ddgEnabled.value = settingsStore.isEnabled('noDDG')
})

watchEffect(() => {
  monitoringDisabled.value = process.env.DEV ? true : settingsStore.isEnabled('noMonitoring')
})

watchEffect(() => {
  localStorage.set('layout', view.value)
})

watchEffect(() => {
  indexSize.value = searchStore?.getIndex()?.size()
})

watchEffect(() => {
  LocalStorage.set('ui.tabSwitcher', autoSwitcherOption.value)
})

const downloadIndex = () => {
  const data = JSON.stringify(searchStore?.getIndex())
  return TabsetService.createFile(data, 'tabsetIndex.json')
}

const clearIndex = () => searchStore.init()

const archivedTabsets = () => {
  let tabsets = [...useTabsetsStore().tabsets.values()]
  return _.sortBy(
    _.filter(tabsets, (ts: Tabset) => ts.status === TabsetStatus.ARCHIVED),
    ['name'],
  )
}

const unarchive = (tabset: Tabset) =>
  useCommandExecutor()
    .executeFromUi(new MarkTabsetAsDefaultCommand(tabset.id))
    .then((res: any) => {
      sendMsg('reload-tabset', { tabsetId: tabset.id })
    })

const setTab = (t: string) => (tab.value = t)

const showIgnored = () => {
  const ignoredTabset = useTabsetsStore().getTabset('IGNORED')
  return !(!ignoredTabset || ignoredTabset.tabs.length === 0)
}

const showIgnoredTabset = () => {
  sendMsg('show-ignored')
}

const updateSettings = (ident: SettingIdent, val: boolean) => {
  console.log('settings updated to', ident, val)
  settingsStore.setToggle(ident, val)
}

const deleteAccount = () => {
  const auth = getAuth()
  const user2 = auth.currentUser
  if (user2) {
    useCommandExecutor().executeFromUi(new DeleteAccountCommand())
  }
}

const optOutIsDisabled = (): boolean => !!process.env.DEV
</script>
