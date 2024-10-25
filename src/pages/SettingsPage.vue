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

    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded style="border:1px solid orange">
        {{ t('settings_adjust_general_appearance')}}
      </q-banner>

      <div class="row items-baseline q-ma-md q-gutter-md">

        <InfoLine :label="t('title')">
          <q-input type="text" color="primary" filled v-model="installationTitle" label="">
            <template v-slot:prepend>
              <q-icon name="o_edit_note"/>
            </template>
          </q-input>
        </InfoLine>

        <InfoLine :label="t('dark_mode')">
          <q-radio v-model="darkMode" val="auto" :label="t('Auto')"/>
          <q-radio v-model="darkMode" val="true" :label="t('Enabled')"/>
          <q-radio v-model="darkMode" val="false" :label="t('Disabled')"/>
          &nbsp;&nbsp;&nbsp;{{t('changing_needs_restart')}}
        </InfoLine>

        <InfoLine :label="t('keyboard_shortcuts')">
          <div class="text-blue-8 cursor-pointer" @click="NavigationService.openSingleTab('chrome://extensions/shortcuts')">{{t('click_here')}}</div>
        </InfoLine>

        <div class="col-3">
          {{ t('language') }} ({{ t('experimental') }})
        </div>
        <div class="col-7">
          <q-select
            v-model="locale"
            :options="localeOptions"
            dense
            borderless
            emit-value
            map-options
            options-dense
            style="min-width: 150px"
          />
        </div>
        <div class="col"></div>

        <InfoLine :label="t('tab_info_detail_level', {detailLevelPerTabset: (detailLevelPerTabset ? ' (Default)' : '')})">
          <q-radio v-model="detailLevel" :val="ListDetailLevel.MINIMAL" label="Minimal Details"/>
          <q-radio v-model="detailLevel" :val="ListDetailLevel.SOME" label="Some Details"/>
          <q-radio v-model="detailLevel" :val="ListDetailLevel.MAXIMAL" label="All Details"/>
        </InfoLine>

        <InfoLine label="">
          <q-checkbox v-model="detailLevelPerTabset" :label="t('individually_per_tabset')"/>
        </InfoLine>

        <InfoLine label="URLs">
          <q-checkbox v-model="fullUrls" :label="t('show_full_url')"/>
        </InfoLine>

<!--        <InfoLine label="Ignore Browser Extensions as tabs">-->
<!--          <q-toggle v-model="ignoreExtensionsEnabled"-->
<!--                    @click="updateSettings('extensionsAsTabs', ignoreExtensionsEnabled)"/>-->
<!--        </InfoLine>-->

      </div>

      <div class="row items-baseline q-ma-md q-gutter-md"
           v-if="useFeaturesStore().hasFeature(FeatureIdent.AUTO_TAB_SWITCHER)">
        <div class="col-3">
          {{t('tab_switching_time')}}
        </div>
        <div class="col-9">
          <q-select
            :label="t('tab_switcher_settings')"
            filled
            v-model="autoSwitcherOption"
            :options="autoSwitcherOptions"
            map-options
            emit-value
            style="width: 250px"
          />
        </div>
      </div>

      <div class="row items-baseline q-ma-md q-gutter-md">
        <div class="col-3">
          {{ t('restore_info_msg')}}
        </div>
        <div class="col-3">
          {{t('accidentally_closed_info_msgs')}}
        </div>
        <div class="col-1"></div>
        <div class="col">
          <q-btn :label="t('restore_hints')" @click.stop="restoreHints"/>
        </div>
      </div>

      <div class="row items-baseline q-ma-md q-gutter-md"
           v-if="useFeaturesStore().hasFeature(FeatureIdent.OPENTABS_THRESHOLD)">
        <div class="col-3">
          {{ t('warning_thresholds')}}
        </div>
        <div class="col-3">
          {{t('warnings_info')}}
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

      <div class="row items-baseline q-ma-md q-gutter-md">
        <div class="col-3">
          {{t('thumbnail_quality')}}
        </div>
        <div class="col-3">
          {{t('larger_thumbs_info')}}
        </div>
        <div class="col q-ma-xl">
          <q-slider v-model="settingsStore.thumbnailQuality"
                    marker-labels
                    :min="0" :max="100" :inner-min="10" :inner-max="100" :step=10></q-slider>
        </div>
      </div>

      <div class="row items-baseline q-ma-md q-gutter-md" v-if="useFeaturesStore().hasFeature(FeatureIdent.DEV_MODE)">
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

      <div class="row items-baseline q-ma-md q-gutter-md" v-if="useFeaturesStore().hasFeature(FeatureIdent.DEV_MODE)">
        <div class="col-3">
          New Suggestion Simulation
        </div>
        <div class="col-3">
          Simulate that there is a new suggestion to use a (new) feature (refresh sidebar for effects)
        </div>
        <div class="col q-ma-xl">
          <span class="text-blue cursor-pointer" @click="simulateStaticSuggestion()">Simulate</span>
        </div>
      </div>

    </div>

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
          <q-toggle v-model="ddgEnabled" @click="updateSettings('noDDG', ddgEnabled)"/>
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
import {useNotificationHandler} from "src/core/services/ErrorHandler";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import NavigationService from "src/services/NavigationService";
import {DrawerTabs, ListDetailLevel, useUiStore} from "src/ui/stores/uiStore";
import {FeatureIdent} from "src/app/models/FeatureIdent";
import {useSettingsStore} from "src/stores/settingsStore"
import {useUtils} from "src/core/services/Utils";
import Analytics from "src/core/utils/google-analytics";
import {useSuggestionsStore} from "src/suggestions/stores/suggestionsStore";
import {StaticSuggestionIdent, Suggestion} from "src/suggestions/models/Suggestion";
import {useRoute} from "vue-router";
import {
  STRIP_CHARS_IN_USER_INPUT,
  TITLE_IDENT
} from "boot/constants";
import InfoLine from "pages/helper/InfoLine.vue";
import FeatureToggleSettings from "pages/helper/FeatureToggleSettings.vue";
import {useI18n} from "vue-i18n";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import VueJsonPretty from "vue-json-pretty";
import 'vue-json-pretty/lib/styles.css';
import {useGroupsStore} from "../tabsets/stores/groupsStore";
import OpenRightDrawerWidget from "src/ui/widgets/OpenRightDrawerWidget.vue";
import {usePermissionsStore} from "stores/usePermissionsStore";
import ImportExportSettings from "pages/helper/ImportExportSettings.vue";
import BackupSettings from "src/tabsets/pages/settings/BackupSettings.vue";

const { t } = useI18n()

const {sendMsg, inBexMode} = useUtils()

const searchStore = useSearchStore()
const settingsStore = useSettingsStore()

const localStorage = useQuasar().localStorage
const $q = useQuasar()
const route = useRoute()

useUiStore().rightDrawerSetActiveTab(DrawerTabs.FEATURES)

const view = ref('grid')
const indexSize = ref(0)
const searchIndexAsJson = ref(null)


const { locale } = useI18n({locale: navigator.language, useScope: "global"})

const localeOptions = ref([
  {value: 'en', label: 'English'},
  {value: 'de', label: 'German'},
  {value: 'bg', label: 'Bulgarian'}
])

const state = reactive({
  val: JSON.stringify(searchIndexAsJson),
  data: searchIndexAsJson
})


const ddgEnabled = ref<boolean>(!settingsStore.isEnabled('noDDG'))
const ignoreExtensionsEnabled = ref<boolean>(!settingsStore.isEnabled('extensionsAsTabs'))
const permissionsList = ref<string[]>([])

const darkMode = ref<string>(localStorage.getItem('darkMode') || "auto")
const detailLevel = ref<ListDetailLevel>(localStorage.getItem('ui.detailLevel') || ListDetailLevel.MAXIMAL)

const fullUrls = ref(localStorage.getItem('ui.fullUrls') || false)
const detailLevelPerTabset = ref(localStorage.getItem('ui.detailsPerTabset') || false)

const installationTitle = ref<string>(localStorage.getItem(TITLE_IDENT) as string || 'My Tabsets')

const tab = ref<string>(route.query['tab'] ? route.query['tab'] as string : 'appearance')

const autoSwitcherOption = ref<number>(localStorage.getItem('ui.tabSwitcher') as number || 5000)

const autoSwitcherOptions = [
  {label: '1 sec.', value: 1000},
  {label: '2 sec.', value: 2000},
  {label: '3 sec.', value: 3000},
  {label: '5 sec.', value: 5000},
  {label: '10 sec.', value: 10000},
  {label: '30 sec.', value: 30000},
  {label: '1 min.', value: 60000},
  {label: '2 min.', value: 120000},
  {label: '5 min.', value: 300000}
]

const {handleError} = useNotificationHandler()

onMounted(() => {
  Analytics.firePageViewEvent('SettingsPage', document.location.href);
})

let suggestionsCounter = 0

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
  //console.log("***setting dark mode to ", typeof darkMode.value, darkMode.value)
  switch (darkMode.value) {
    case "true":
      $q.dark.set(true)
      break
    case "false":
      $q.dark.set(false)
      break;
    default:
      $q.dark.set("auto")
  }
  // $q.dark.set(darkMode.value === "true" ? true : (darkMode.value === 'false' ? false : 'auto'))
  localStorage.set('darkMode', darkMode.value)
})

watchEffect(() => {
  (installationTitle.value && installationTitle.value.trim().length > 0) ?
    LocalStorage.set(TITLE_IDENT, installationTitle.value.replace(STRIP_CHARS_IN_USER_INPUT, '')) :
    LocalStorage.remove(TITLE_IDENT)
})

watch(() => detailLevel.value, () => {
  localStorage.set('ui.detailLevel', detailLevel.value)
  sendMsg('detail-level-changed', {level: detailLevel.value})
})

watch(() => fullUrls.value, (a:any,b:any) => {
  localStorage.set('ui.fullUrls', fullUrls.value)
  sendMsg('fullUrls-changed', {value: fullUrls.value})
})

watch(() => detailLevelPerTabset.value, (v:any) => {
  localStorage.set('ui.detailsPerTabset', detailLevelPerTabset.value)
  sendMsg('detail-level-perTabset-changed', {level: detailLevelPerTabset.value})
})

watchEffect(() => {
  localStorage.set("layout", view.value)
})

watchEffect(() => {
  // @ts-ignore
  indexSize.value = searchStore?.getIndex()?.size()
})

watchEffect(() => {
  LocalStorage.set("ui.tabSwitcher", autoSwitcherOption.value)
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
    .then((res) => {
      sendMsg('reload-tabset', {tabsetId: tabset.id})
    })

const simulateNewVersion = (version: string) => NavigationService.updateAvailable({version: version})

const restoreHints = () => useUiStore().restoreHints()

const simulateStaticSuggestion = () => {
  const suggestions: [Suggestion] = [
    // @ts-ignore
    Suggestion.getStaticSuggestion(StaticSuggestionIdent.TRY_SPACES_FEATURE),
    Suggestion.getStaticSuggestion(StaticSuggestionIdent.TRY_BOOKMARKS_FEATURE)
  ]
  useSuggestionsStore().addSuggestion(suggestions[suggestionsCounter++ % 2])
}

const setTab = (t: string) => tab.value = t

</script>

