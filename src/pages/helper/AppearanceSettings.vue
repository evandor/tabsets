<template>
  <div class="q-pa-md q-gutter-sm">
    <q-banner rounded style="border: 1px solid orange">
      {{ $t('settings_adjust_general_appearance') }}
    </q-banner>

    <div class="row">
      <InfoLine :label="$t('dark_mode')">
        <q-radio v-model="darkMode" val="auto" :label="$t('Auto')" />
        <q-radio v-model="darkMode" val="true" :label="$t('enabled')" />
        <q-radio v-model="darkMode" val="false" :label="$t('disabled')" />
        &nbsp;&nbsp;&nbsp;{{ $t('changing_needs_restart') }}
      </InfoLine>
    </div>

    <div class="row">
      <div class="col-3"></div>
      <div class="col-9">
        <hr />
      </div>
    </div>

    <div class="row">
      <InfoLine :label="$t('keyboard_shortcuts')">
        <div
          class="text-accent cursor-pointer"
          @click="NavigationService.openSingleTab('chrome://extensions/shortcuts')">
          {{ $t('click_here') }}
        </div>
      </InfoLine>

      <div class="col-3">{{ $t('language') }} ({{ $t('experimental') }})</div>
      <div class="col-7">
        <!--        <q-select-->
        <!--          v-model="locale"-->
        <!--          :options="localeOptions"-->
        <!--          dense-->
        <!--          borderless-->
        <!--          emit-value-->
        <!--          map-options-->
        <!--          options-dense-->
        <!--          style="min-width: 150px" />-->
      </div>
      <div class="col"></div>
    </div>

    <div class="row">
      <div class="col-3"></div>
      <div class="col-9">
        <hr />
      </div>
    </div>

    <div class="row items-baseline">
      <InfoLine label="UI Density">
        <q-radio v-model="density" :val="'dense'" label="Dense" />
        <q-radio v-model="density" :val="'thin'" label="Light (Default)" />
      </InfoLine>
    </div>

    <div class="row">
      <div class="col-3"></div>
      <div class="col-9">
        <hr />
      </div>
    </div>

    <div class="row items-baseline">
      <InfoLine label="Quick Access Menu">
        <q-checkbox v-model="quickAccessSearch" label="Search" />
      </InfoLine>
    </div>

    <div class="row">
      <div class="col-3"></div>
      <div class="col-9">
        <hr />
      </div>
    </div>

    <div class="row items-baseline">
      <InfoLine label="Font Size">
        <q-radio v-model="fontsize" :val="FontSize.SMALLER" label="Smaller" />
        <q-radio v-model="fontsize" :val="FontSize.SMALL" label="Small" />
        <q-radio v-model="fontsize" :val="FontSize.DEFAULT" label="Default Size" />
        <q-radio v-model="fontsize" :val="FontSize.LARGE" label="Large" />
        <q-radio v-model="fontsize" :val="FontSize.LARGER" label="Larger" />
      </InfoLine>

      <InfoLine label="Toolbar Integration" helpLink="https://docs.tabsets.net/tabsets-toolbar">
        <q-radio v-model="toolbarIntegration" val="none" label="None" />
        <q-radio v-model="toolbarIntegration" val="tabsets" label="Tabsets (default)" />
        <q-radio v-model="toolbarIntegration" val="all" label="All Websites" />
      </InfoLine>

      <InfoLine label="Folder Appearance">
        <q-radio v-model="folderAppearance" val="expand" label="Expand (experimental)" />
        <q-radio v-model="folderAppearance" val="goInto" label="Go into (Default)" />
      </InfoLine>
    </div>

    <div class="row">
      <div class="col-3"></div>
      <div class="col-9">
        <hr />
      </div>
    </div>

    <div class="row items-baseline">
      <InfoLine label="Tab Detail Level (default)">
        <q-radio v-model="detailLevel" :val="'MINIMAL'" label="Minimal Details" />
        <q-radio v-model="detailLevel" :val="'SOME'" label="Some Details" />
        <q-radio v-model="detailLevel" :val="'MAXIMAL'" label="All Details" />
      </InfoLine>

      <!--      <InfoLine label="">-->
      <!--        <q-checkbox v-model="detailLevelPerTabset" :label="$t('individually_per_tabset')" />-->
      <!--      </InfoLine>-->

      <InfoLine label="URLs">
        <q-checkbox v-model="fullUrls" :label="$t('show_full_url')" />
      </InfoLine>
    </div>

    <div class="row items-baseline">
      <div class="col-3"></div>
      <div class="col-9">
        <hr />
      </div>
    </div>

    <div class="row items-baseline">
      <InfoLine label="Show Recent Tabsets list">
        <q-checkbox
          v-model="showRecentTabsetsList"
          label="The last couple of tabsets you opened will be displayed for quick access" />
      </InfoLine>

      <InfoLine label="Overlap Indicator">
        <q-checkbox
          v-model="overlapIndicator"
          label="Display how similar the current tabset and your current tabs are" />
      </InfoLine>
    </div>

    <!--    <div-->
    <!--      class="row items-baseline q-ma-md q-gutter-md"-->
    <!--      v-if="useFeaturesStore().hasFeature(FeatureIdent.AUTO_TAB_SWITCHER)">-->
    <!--      <div class="col-3">-->
    <!--        {{ $t('tab_switching_time') }}-->
    <!--      </div>-->
    <!--      <div class="col-9">-->
    <!--        <q-select-->
    <!--          :label="$t('tab_switcher_settings')"-->
    <!--          filled-->
    <!--          v-model="autoSwitcherOption"-->
    <!--          :options="autoSwitcherOptions"-->
    <!--          map-options-->
    <!--          emit-value-->
    <!--          style="width: 250px" />-->
    <!--      </div>-->
    <!--    </div>-->

    <div class="row">
      <div class="col-3"></div>
      <div class="col-9">
        <hr />
      </div>
    </div>

    <div class="row">
      <div class="col-3">
        {{ $t('restore_info_msg') }}
      </div>
      <div class="col-3">
        {{ $t('accidentally_closed_info_msgs') }}
      </div>
      <div class="col-1"></div>
      <div class="col">
        <q-btn :label="$t('restore_hints')" @click.stop="restoreHints" />
      </div>
    </div>

    <div class="row items-baseline" v-if="useFeaturesStore().hasFeature(FeatureIdent.OPENTABS_THRESHOLD)">
      <div class="col-3">
        {{ $t('warning_thresholds') }}
      </div>
      <div class="col-3">
        {{ $t('warnings_info') }}
      </div>
      <div class="col q-ma-xl">
        <q-range v-model="settingsStore.thresholds" :step="10" marker-labels :min="0" :max="100" />
      </div>
    </div>

    <div class="row items-baseline">
      <div class="col-3">
        {{ $t('thumbnail_quality') }}
      </div>
      <div class="col-3">
        {{ $t('larger_thumbs_info') }}
      </div>
      <div class="col q-ma-xl">
        <q-slider
          v-model="settingsStore.thumbnailQuality"
          marker-labels
          :min="0"
          :max="100"
          :inner-min="10"
          :inner-max="100"
          :step="10"></q-slider>
      </div>
    </div>

    <!--    <div class="row items-baseline q-ma-md q-gutter-md" v-if="useFeaturesStore().hasFeature(FeatureIdent.DEV_MODE)">-->
    <!--      <div class="col-3">-->
    <!--        New Version Simulation-->
    <!--      </div>-->
    <!--      <div class="col-3">-->
    <!--        Simulate that there is a new version available-->
    <!--      </div>-->
    <!--      <div class="col q-ma-xl">-->
    <!--        <span class="text-blue cursor-pointer" @click="simulateNewVersion('0.2.12')">Simulate</span>-->
    <!--      </div>-->
    <!--    </div>-->

    <div class="row items-baseline" v-if="useFeaturesStore().hasFeature(FeatureIdent.DEV_MODE)">
      <div class="col-3">New Suggestion Simulation</div>
      <div class="col-3">
        Simulate that there is a new suggestion to use a (new) feature (refresh sidebar for effects)
      </div>
      <div class="col q-ma-xl">
        <span class="text-blue cursor-pointer" @click="simulateStaticSuggestion()">Simulate</span>
      </div>
    </div>

    <div class="row items-baseline">
      <div class="col-3">Sidebar not opened?</div>
      <div class="col-3">CLick here to open the Side Panel</div>
      <div class="col q-ma-xl">
        <span class="text-blue cursor-pointer" id="openSidePanelSpan" @click="openSidePanel()">Open Side Panel</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { LocalStorage, useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { STRIP_CHARS_IN_USER_INPUT, TITLE_IDENT } from 'src/boot/constants'
import InfoLine from 'src/core/pages/helper/InfoLine.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUtils } from 'src/core/services/Utils'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import { ActivateFeatureCommand } from 'src/features/commands/ActivateFeatureCommand'
import { DeactivateFeatureCommand } from 'src/features/commands/DeactivateFeatureCommand'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import NavigationService from 'src/services/NavigationService'
import { Suggestion } from 'src/suggestions/domain/models/Suggestion'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import {
  FolderAppearance,
  FontSize,
  ListDetailLevel,
  ToolbarIntegration,
  UiDensity,
  useUiStore,
} from 'src/ui/stores/uiStore'
import { ref, watch, watchEffect } from 'vue'

const { sendMsg } = useUtils()

const $q = useQuasar()
const settingsStore = useSettingsStore()

const darkMode = ref<string>(LocalStorage.getItem('darkMode') || 'auto')
const installationTitle = ref<string>((LocalStorage.getItem(TITLE_IDENT) as string) || 'My Tabsets')
// const detailLevelPerTabset = ref(LocalStorage.getItem('ui.detailsPerTabset') || false)
const detailLevel = ref<ListDetailLevel>(LocalStorage.getItem('ui.detailLevel') || 'MINIMAL')
const fontsize = ref<FontSize>(LocalStorage.getItem('ui.fontsize') || FontSize.DEFAULT)
const density = ref<UiDensity>(LocalStorage.getItem('ui.density') || 'thin')
const folderAppearance = ref<FolderAppearance>(LocalStorage.getItem('ui.folder.style') || 'goInto')
const toolbarIntegration = ref<ToolbarIntegration>(LocalStorage.getItem('ui.toolbar.integration') || 'tabsets')
const fullUrls = ref(LocalStorage.getItem('ui.fullUrls') || false)
const overlapIndicator = ref(LocalStorage.getItem('ui.overlapIndicator') || false)
const showRecentTabsetsList = ref(useFeaturesStore().hasFeature(FeatureIdent.TABSET_LIST))

const quickAccessSearch = ref(useUiStore().quickAccessFor('search'))

let suggestionsCounter = 0

//const { locale } = useI18n({ locale: navigator.language, useScope: 'global' })

const localeOptions = ref([
  { value: 'en', label: 'English' },
  { value: 'de', label: 'German' },
  { value: 'bg', label: 'Bulgarian' },
])

const autoSwitcherOption = ref<number>((LocalStorage.getItem('ui.tabSwitcher') as number) || 5000)

const autoSwitcherOptions = [
  { label: '1 sec.', value: 1000 },
  { label: '2 sec.', value: 2000 },
  { label: '3 sec.', value: 3000 },
  { label: '5 sec.', value: 5000 },
  { label: '10 sec.', value: 10000 },
  { label: '30 sec.', value: 30000 },
  { label: '1 min.', value: 60000 },
  { label: '2 min.', value: 120000 },
  { label: '5 min.', value: 300000 },
]

watchEffect(() => {
  useUiStore().setQuickAccess('search', quickAccessSearch.value)
  sendMsg('settings-changed', { identifier: 'ui.quickAccess', value: quickAccessSearch.value })
})

watchEffect(() => {
  if (installationTitle.value && installationTitle.value.trim().length > 0) {
    LocalStorage.set(TITLE_IDENT, installationTitle.value.replace(STRIP_CHARS_IN_USER_INPUT, ''))
  } else {
    LocalStorage.remove(TITLE_IDENT)
  }
})

watchEffect(() => {
  switch (darkMode.value) {
    case 'true':
      $q.dark.set(true)
      break
    case 'false':
      $q.dark.set(false)
      break
    default:
      $q.dark.set('auto')
  }
  LocalStorage.set('darkMode', darkMode.value)
  sendMsg('reload-application')
})

// watch(
//   () => detailLevelPerTabset.value,
//   (v: any) => {
//     LocalStorage.set('ui.detailsPerTabset', detailLevelPerTabset.value)
//     sendMsg('detail-level-perTabset-changed', { level: detailLevelPerTabset.value })
//   },
// )

watch(
  () => detailLevel.value,
  () => {
    LocalStorage.set('ui.detailLevel', detailLevel.value)
    sendMsg('detail-level-changed', { level: detailLevel.value })
  },
)

watch(
  () => fontsize.value,
  () => {
    LocalStorage.set('ui.fontsize', fontsize.value)
    //sendMsg('detail-level-changed', {level: detailLevel.value})
    sendMsg('settings-changed', { identifier: 'ui.fontsize', value: fontsize.value })
  },
)

watch(
  () => density.value,
  () => {
    LocalStorage.set('ui.density', density.value)
    sendMsg('settings-changed', { identifier: 'ui.density', value: density.value })
  },
)

watch(
  () => folderAppearance.value,
  () => {
    LocalStorage.set('ui.folder.style', folderAppearance.value)
    sendMsg('settings-changed', { identifier: 'ui.folder.style', value: folderAppearance.value })
  },
)

watch(
  () => toolbarIntegration.value,
  () => {
    LocalStorage.set('ui.toolbar.integration', toolbarIntegration.value)
    //sendMsg('settings-changed', { identifier: 'ui.toolbar.integration', value: toolbarIntegration.value })
  },
)

watch(
  () => fullUrls.value,
  (a: any, b: any) => {
    LocalStorage.set('ui.fullUrls', fullUrls.value)
    sendMsg('settings-changed', { identifier: 'ui.fullUrls', value: fullUrls.value })
  },
)

watch(
  () => overlapIndicator.value,
  (a: any, b: any) => {
    LocalStorage.set('ui.overlapIndicator', overlapIndicator.value)
    sendMsg('settings-changed', {
      identifier: 'ui.overlapIndicator',
      value: overlapIndicator.value,
    })
  },
)

watch(
  () => showRecentTabsetsList.value,
  (now: boolean, before: boolean) => {
    if (now) {
      useCommandExecutor().execute(new ActivateFeatureCommand(FeatureIdent.TABSET_LIST.toString()))
    } else {
      useCommandExecutor().execute(new DeactivateFeatureCommand(FeatureIdent.TABSET_LIST.toString()))
    }
  },
)

watchEffect(() => {
  LocalStorage.set('ui.tabSwitcher', autoSwitcherOption.value)
})

const restoreHints = () => useUiStore().restoreHints()

// const simulateNewVersion = (version: string) => NavigationService.updateAvailable({version: version})

const simulateStaticSuggestion = () => {
  const suggestions: [Suggestion] = [
    // @ts-expect-error TODO
    Suggestion.getStaticSuggestion('TRY_SPACES_FEATURE'),
    Suggestion.getStaticSuggestion('TRY_OPENTABS_FEATURE'),
    Suggestion.getStaticSuggestion('TRY_BOOKMARKS_FEATURE'),
  ]
  useSuggestionsStore().addSuggestion(suggestions[suggestionsCounter++ % 2])
}

const openSidePanel = async () => {
  if (chrome.sidePanel) {
    const ts: chrome.tabs.Tab[] = await chrome.tabs.query({ active: true, currentWindow: true })
    // @ts-expect-error TODO
    await chrome.sidePanel.open({ windowId: ts[0].windowId })
    await chrome.sidePanel.setOptions({
      path: 'www/index.html',
      enabled: true,
    })
  }
}
</script>
