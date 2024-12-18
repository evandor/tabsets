<template>


  <q-toolbar v-if="useTabsetsStore().tabsets.size > 0">
    <div class="row fit">
      <q-toolbar-title>
        <div class="row justify-start items-baseline">
          <div class="col-10">Tabsets Extension Settings</div>
          <div class="col-2 text-right">
            <OpenRightDrawerWidget/>
          </div>
        </div>
      </q-toolbar-title>
    </div>
  </q-toolbar>

  <div class="justify-start items-start greyBorderTop">
    <q-tabs align="left"
            inline-label
            v-model="tab"
            no-caps>
      <q-tab name="appearance" :label="t('appearance')"/>
      <q-tab name="thirdparty" label="Third Party Services"/>
      <!--      <q-tab name="ignored" label="Ignored Urls"/>-->
      <q-tab name="archived" label="Archived Tabsets"
             v-if="useFeaturesStore().hasFeature(FeatureIdent.ARCHIVE_TABSET)"/>
      <q-tab name="search" label="Search Engine" v-if="useFeaturesStore().hasFeature(FeatureIdent.DEV_MODE)"/>
      <q-tab name="importExport" label="Import/Export"/>
      <q-tab name="backup" label="Backup"/>
      <q-tab name="internals" label="Internals" v-if="useFeaturesStore().hasFeature(FeatureIdent.DEV_MODE)"/>
      <!--      <q-tab name="featureToggles" label="Feature Toggles"-->
      <!--             :class="useAuthStore().userMayAccess(AccessItem.FEATURE_TOGGLES) ? 'text-primary':'text-grey'"/>-->
      <q-tab name="featureToggles" label="Feature Toggles"/>
    </q-tabs>
  </div>

  <div v-if="tab === 'appearance'">

    <AppearanceSettings />

  </div>

  <div v-if="tab === 'internals'">

    <div class="q-pa-md q-gutter-sm">

      <div class="text-h6">Permissions</div>

      <q-banner rounded>The active permissions for the Tabset Extension</q-banner>

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

      <div class="text-h6">Groups</div>

      <q-banner rounded>All Chrome Groups, active and non-active</q-banner>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          All Groups
        </div>
        <div class="col-9">
          {{ useGroupsStore().tabGroups }}
        </div>
      </div>

      <q-banner rounded>All active Chrome Groups</q-banner>

      <div class="row items-baseline q-ma-md">
        <div class="col-3">
          Active Groups
        </div>
        <div class="col-9">
          {{ useGroupsStore().currentTabGroups }}
        </div>
      </div>


    </div>

  </div>

  <div v-if="tab === 'ignored'">

    <div class="q-pa-md q-gutter-sm">

      <q-banner rounded>Urls can be ignored so that the tabsets extension will not
        notifiy you about changes.
      </q-banner>

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

      <q-banner rounded style="border:1px solid orange">Tabsets can be archived to remove them from direct view. Here's
        the list of archived tabsets so that
        they can be restored if needed.
      </q-banner>

      <div class="row q-pa-md" v-for="tabset in archivedTabsets()">
        <div class="col-3"><b>{{ tabset.name }}</b></div>
        <div class="col-3"></div>
        <div class="col-1"></div>
        <div class="col-5">
          <q-btn label="Un-Archive" @click="unarchive(tabset as Tabset)"/>
        </div>
      </div>
    </div>
  </div>

  <div v-if="tab === 'search'">

    <div class="q-pa-md q-gutter-sm">

      <q-banner rounded style="border:1px solid orange">This Browser Extension tracks your tabsets and provides a
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
      <div class="row">
        <vue-json-pretty style="font-size: 80%" :show-length="true" :deep="2"
                         v-model:data="state.data"
                         :show-double-quotes="true"
        />
      </div>
    </div>

  </div>

  <div v-if="tab === 'thirdparty'">

    <div class="q-pa-md q-gutter-sm">

      <q-banner rounded style="border:1px solid orange">
        TODO
      </q-banner>

      <div class="row q-pa-md">
        <div class="col-3"><b>DuckDuckGo FavIcon Service</b></div>
        <div class="col-5">Usually, the favicon (the little icon displayed next to a tab url) is provided by the page
          you are visiting.
          Sometimes, Tabsets does not have the information (yet) and might defer to a third party service, here
          duckduckgo. Switch this off
          if you do not want to use this service.
        </div>
        <div class="col-1"></div>
        <div class="col-3">
<!--          <q-toggle v-model="ddgEnabled" @click="updateSettings('noDDG', ddgEnabled)"/>-->
        </div>
      </div>

    </div>

  </div>

  <div v-if="tab === 'importExport'">

    <ImportExportSettings @show-tab="(t:string) => setTab(t)"/>

  </div>

  <div v-if="tab === 'backup'">
    <BackupSettings />
  </div>

  <div v-if="tab === 'featureToggles'">
    <FeatureToggleSettings/>
  </div>

</template>

<script setup lang="ts">


/**
 * refactoring remark: uses many other modules, needs to be one-per-application
 *
 */

import {onMounted, reactive, ref, watch, watchEffect} from "vue";
import {LocalStorage, useQuasar} from "quasar";
import {useSearchStore} from "src/search/stores/searchStore";
import TabsetService from "src/tabsets/services/TabsetService";
import _ from "lodash";
import {Tabset, TabsetStatus} from "src/tabsets/models/Tabset";
import {MarkTabsetAsDefaultCommand} from "src/tabsets/commands/MarkTabsetAsDefault";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {DrawerTabs, useUiStore} from "src/ui/stores/uiStore";
import {FeatureIdent} from "src/app/models/FeatureIdent";
import {useSettingsStore} from "src/stores/settingsStore"
import {useUtils} from "src/core/services/Utils";
import Analytics from "src/core/utils/google-analytics";
import {useRoute} from "vue-router";
import FeatureToggleSettings from "pages/helper/FeatureToggleSettings.vue";
import {useI18n} from "vue-i18n";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import VueJsonPretty from "vue-json-pretty";
import 'vue-json-pretty/lib/styles.css';
import {useGroupsStore} from "../tabsets/stores/groupsStore";
import OpenRightDrawerWidget from "src/ui/widgets/OpenRightDrawerWidget.vue";
import {usePermissionsStore} from "src/core/stores/usePermissionsStore";
import ImportExportSettings from "pages/helper/ImportExportSettings.vue";
import BackupSettings from "src/tabsets/pages/settings/BackupSettings.vue";
import AppearanceSettings from "pages/helper/AppearanceSettings.vue";

const { t } = useI18n()

const {sendMsg} = useUtils()

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
  data: searchIndexAsJson
})

const ddgEnabled = ref<boolean>(!settingsStore.isEnabled('noDDG'))
const ignoreExtensionsEnabled = ref<boolean>(!settingsStore.isEnabled('extensionsAsTabs'))
const permissionsList = ref<string[]>([])

const tab = ref<string>(route.query['tab'] ? route.query['tab'] as string : 'appearance')

onMounted(() => {
  Analytics.firePageViewEvent('SettingsPage', document.location.href);
})

watchEffect(() => {
  const data = JSON.stringify(searchStore?.getIndex())
  searchIndexAsJson.value = JSON.parse(data)
})

watchEffect(() => {
  //console.log("watching settingsStore.activeToggles...", settingsStore.activeToggles)
  ddgEnabled.value = settingsStore.isEnabled('noDDG')
  ignoreExtensionsEnabled.value = settingsStore.isEnabled('extensionsAsTabs')
})

watchEffect(() => permissionsList.value = usePermissionsStore().permissions?.permissions || [])

watchEffect(() => {
  localStorage.set("layout", view.value)
})

watchEffect(() => {
  indexSize.value = searchStore?.getIndex()?.size()
})

const downloadIndex = () => {
  const data = JSON.stringify(searchStore?.getIndex())
  return TabsetService.createFile(data, "tabsetIndex.json");
}

const clearIndex = () => searchStore.init()

const archivedTabsets = () => {
  let tabsets = [...useTabsetsStore().tabsets.values()]
  return _.sortBy(_.filter(tabsets, (ts: Tabset) => ts.status === TabsetStatus.ARCHIVED), ['name'])
}

const unarchive = (tabset: Tabset) =>
  useCommandExecutor().executeFromUi(new MarkTabsetAsDefaultCommand(tabset.id))
    .then((res:any) => {
      sendMsg('reload-tabset', {tabsetId: tabset.id})
    })


const setTab = (t: string) => tab.value = t

</script>

