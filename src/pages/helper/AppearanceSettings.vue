<template>
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

<!--      <InfoLine label="Old Sidepanel Layout">-->
<!--        <q-checkbox v-model="oldLayout" label="use the old Sidepanel Layout"/>-->
<!--        {{t('changing_needs_restart')}}-->
<!--      </InfoLine>-->

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

      <InfoLine label="Hide Indicator Icon" v-if="useFeaturesStore().hasFeature(FeatureIdent.DEV_MODE)">
        <q-checkbox v-model="hideIndicatorIcon" label="Hide Icon on websites (upper right) when tracked by tabsets"/>
      </InfoLine>

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
</template>

<script lang="ts" setup>

import NavigationService from "src/services/NavigationService";
import {ListDetailLevel, useUiStore} from "src/ui/stores/uiStore";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import {FeatureIdent} from "src/app/models/FeatureIdent";
import InfoLine from "pages/helper/InfoLine.vue";
import {useI18n} from "vue-i18n";
import {onMounted, reactive, ref, watch, watchEffect} from "vue";
import {LocalStorage, useQuasar} from "quasar";
import {STRIP_CHARS_IN_USER_INPUT, TITLE_IDENT} from "boot/constants";
import {useUtils} from "src/core/services/Utils";
import {useSettingsStore} from "stores/settingsStore";
import {StaticSuggestionIdent, Suggestion} from "src/suggestions/models/Suggestion";
import {useSuggestionsStore} from "src/suggestions/stores/suggestionsStore";

const { t } = useI18n()
const {sendMsg} = useUtils()

const $q = useQuasar()
const settingsStore = useSettingsStore()


const darkMode = ref<string>(LocalStorage.getItem('darkMode') || "auto")
const installationTitle = ref<string>(LocalStorage.getItem(TITLE_IDENT) as string || 'My Tabsets')
const detailLevelPerTabset = ref(LocalStorage.getItem('ui.detailsPerTabset') || false)
const detailLevel = ref<ListDetailLevel>(LocalStorage.getItem('ui.detailLevel') || ListDetailLevel.MAXIMAL)
const fullUrls = ref(LocalStorage.getItem('ui.fullUrls') || false)
const hideIndicatorIcon = ref(LocalStorage.getItem('ui.hideIndicatorIcon') || false)
const oldLayout = ref(LocalStorage.getItem('ui.sidepanel.oldLayout') || false)

let suggestionsCounter = 0

const { locale } = useI18n({locale: navigator.language, useScope: "global"})

const localeOptions = ref([
  {value: 'en', label: 'English'},
  {value: 'de', label: 'German'},
  {value: 'bg', label: 'Bulgarian'}
])

const autoSwitcherOption = ref<number>(LocalStorage.getItem('ui.tabSwitcher') as number || 5000)

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

watchEffect(() => {
  (installationTitle.value && installationTitle.value.trim().length > 0) ?
    LocalStorage.set(TITLE_IDENT, installationTitle.value.replace(STRIP_CHARS_IN_USER_INPUT, '')) :
    LocalStorage.remove(TITLE_IDENT)
})

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
  LocalStorage.set('darkMode', darkMode.value)
})

watch(() => detailLevelPerTabset.value, (v:any) => {
  LocalStorage.set('ui.detailsPerTabset', detailLevelPerTabset.value)
  sendMsg('detail-level-perTabset-changed', {level: detailLevelPerTabset.value})
})

watch(() => detailLevel.value, () => {
  LocalStorage.set('ui.detailLevel', detailLevel.value)
  sendMsg('detail-level-changed', {level: detailLevel.value})
})

watch(() => fullUrls.value, (a:any,b:any) => {
  LocalStorage.set('ui.fullUrls', fullUrls.value)
  //sendMsg('fullUrls-changed', {value: fullUrls.value})
  sendMsg('settings-changed', {identifier: "ui.fullUrls", value: fullUrls.value})
})

watch(() => hideIndicatorIcon.value, (a:any,b:any) => {
  LocalStorage.set('ui.hideIndicatorIcon', hideIndicatorIcon.value)
  sendMsg('settings-changed', {identifier: "ui.hideIndicatorIcon", value: hideIndicatorIcon.value})
})

watch(() => oldLayout.value, (a:any,b:any) => {
  LocalStorage.set('ui.sidepanel.oldLayout', oldLayout.value)
})


watchEffect(() => {
  LocalStorage.set("ui.tabSwitcher", autoSwitcherOption.value)
})

const restoreHints = () => useUiStore().restoreHints()

// const simulateNewVersion = (version: string) => NavigationService.updateAvailable({version: version})

const simulateStaticSuggestion = () => {
  const suggestions: [Suggestion] = [
    // @ts-ignore
    Suggestion.getStaticSuggestion(StaticSuggestionIdent.TRY_SPACES_FEATURE),
    Suggestion.getStaticSuggestion(StaticSuggestionIdent.TRY_BOOKMARKS_FEATURE)
  ]
  useSuggestionsStore().addSuggestion(suggestions[suggestionsCounter++ % 2])
}


</script>
