<template>
  <!-- PopupSettingsPage -->
  <q-page class="darkInDarkMode brightInBrightMode" :style="paddingTop" style="min-width: 400px; max-height: 700px">
    <offline-info />

    <div class="justify-start items-start greyBorderTop">
      <q-tabs align="left" inline-label v-model="tab" no-caps>
        <q-tab name="appearance" :label="t('appearance')" />
        <q-tab name="tags" label="Tags" />
        <q-tab name="features" label="More Features" />
        <q-tab name="ignored" label="Ignored Urls" v-if="showIgnored()" />
        <q-tab
          name="archived"
          label="Archived Tabsets"
          v-if="useFeaturesStore().hasFeature(FeatureIdent.ARCHIVE_TABSET)" />
      </q-tabs>
    </div>

    <div v-if="tab === 'appearance'">
      <AppearanceSettings :dense="true" />
    </div>

    <div v-if="tab === 'tags'">
      <TagsSettings :dense="true" />
    </div>

    <div v-if="tab === 'features'" class="q-ma-md">
      <div class="text-h6 q-mb-md">Features</div>

      <div
        class="row q-mx-md"
        v-for="f in featuresByType('RECOMMENDED')
          .concat(featuresByType('OPTIONAL'))
          .concat(featuresByType('EXPERIMENTAL'))
          .filter((f: Feature) => f.useIn.indexOf('popup') >= 0)">
        <div class="col-1 q-mt-sm">
          <q-icon :name="f.icon" size="1.3em" :color="iconColor2(f)" />
        </div>
        <div class="col-7 q-mt-sm">{{ f.name }}</div>
        <div class="col text-right">
          <q-toggle
            v-model="activeFeatures[f.ident.toUpperCase()]"
            @update:model-value="(val) => toggleFeature(f, val)" />
          <q-icon
            name="o_info"
            size="1.3em"
            class="cursor-pointer"
            color="primary"
            @click.stop="openFeaturePage(f.ident)" />
        </div>
      </div>
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

    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode q-ma-none q-ml-md">
      <PopupToolbar title="Settings">
        <template v-slot:left>
          <q-icon name="o_keyboard_return" class="cursor-pointer" @click="router.push('/popup')" />
        </template>
      </PopupToolbar>
    </q-page-sticky>
  </q-page>
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
import _ from 'lodash'
import { Notify, openURL, useQuasar } from 'quasar'
import { FeatureIdent, FeatureType } from 'src/app/models/FeatureIdent'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUtils } from 'src/core/services/Utils'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import Analytics from 'src/core/utils/google-analytics'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useSearchStore } from 'src/search/stores/searchStore'
import { MarkTabsetAsDefaultCommand } from 'src/tabsets/commands/MarkTabsetAsDefault'
import { Tabset, TabsetStatus } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { DrawerTabs, useUiStore } from 'src/ui/stores/uiStore'
import { onMounted, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import 'vue-json-pretty/lib/styles.css'
import TagsSettings from 'pages/helper/TagsSettings.vue'
import { AppFeatures } from 'src/app/models/AppFeatures'
import OfflineInfo from 'src/core/components/helper/offlineInfo.vue'
import Command from 'src/core/domain/Command'
import PopupToolbar from 'src/core/pages/popup/PopupToolbar.vue'
import { Feature } from 'src/features/models/Feature'
import AppearanceSettings from 'src/pages/helper/AppearanceSettings.vue'

const { t } = useI18n()

const { sendMsg } = useUtils()

const toggle = ref(true)
const paddingTop = ref('padding-top: 40px')
const activeFeatures = ref<{ [k: string]: boolean }>({})

const searchStore = useSearchStore()
const settingsStore = useSettingsStore()

const localStorage = useQuasar().localStorage
const route = useRoute()
const router = useRouter()

useUiStore().rightDrawerSetActiveTab(DrawerTabs.FEATURES)

const view = ref('grid')
const indexSize = ref(0)
const searchIndexAsJson = ref(null)
const features = ref(new AppFeatures().features)

const ddgEnabled = ref<boolean>(!settingsStore.isEnabled('noDDG'))
const monitoringDisabled = ref<boolean>(process.env.DEV ? true : settingsStore.isEnabled('noMonitoring'))

const tab = ref<string>(route.query['tab'] ? (route.query['tab'] as string) : 'appearance')

onMounted(() => {
  Analytics.firePageViewEvent('PopupSettingsPage', document.location.href)
  features.value.forEach((f: Feature) => {
    activeFeatures.value[f.ident] = useFeaturesStore().hasFeature(
      FeatureIdent[f.ident.toUpperCase() as keyof typeof FeatureIdent],
    )
  })
  //console.log('activeFeatres', activeFeatures.value.get('BOOKMARKS'))
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

watchEffect(() => {})

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

const featuresByType = (type: FeatureType): Feature[] =>
  _.filter(features.value, (f: Feature) => {
    const typeAndModeMatch = f.type === type.toString() && !wrongMode(f)
    if (f.requires.length > 0) {
      let missingRequirement = false
      f.requires.forEach((requirement: string) => {
        if (useFeaturesStore().activeFeatures.indexOf(requirement.toLowerCase()) === -1) {
          missingRequirement = true
        }
      })
      if (missingRequirement) {
        return false
      }
    }
    return typeAndModeMatch
  })

const wrongMode = (f: Feature) => {
  if (f.useIn.indexOf('chrome_bex') >= 0) {
    if (useQuasar().platform.is.chrome) {
      return false
    }
  }
  return f.useIn?.indexOf('all') < 0 && f.useIn?.indexOf(process.env.MODE || '') < 0
}

const iconColor2 = (f: Feature) => {
  return useFeaturesStore().activeFeatures.indexOf(f.ident.toLowerCase()) >= 0
    ? f.defaultColor
      ? f.defaultColor
      : 'green'
    : 'grey'
}

const openFeaturePage = (ident: string) =>
  openURL(chrome.runtime.getURL(`/www/index.html#/mainpanel/features/${ident.toLowerCase()}`))

const toggleFeature = (f: Feature, enabled: boolean) => {
  console.log('hier', f, enabled)
  if (enabled) {
    try {
      f.activateCommands.forEach((c: Command<any>) => {
        useCommandExecutor().execute(c)
      })
    } catch (err: any) {
      Notify.create({
        color: 'negative',
        message: 'got error: ' + err.toString(),
      })
    }
  } else {
    if (f.deactivateCommands) {
      console.log('revoking1', f, f.deactivateCommands)
      useCommandExecutor()
        .execute(f.deactivateCommands[0]!)
        .then(() => useFeaturesStore().deactivateFeature(f.ident.toUpperCase()))
    } else {
      console.log('revoking2', f)
      useFeaturesStore().deactivateFeature(f.ident.toUpperCase())
    }
  }
}
</script>
