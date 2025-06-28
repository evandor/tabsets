<template>
  <!-- PopupPage -->
  <q-page class="darkInDarkMode brightInBrightMode" :style="paddingTop" style="min-width: 400px; max-height: 700px">
    <offline-info />

    <div class="row q-ma-sm darkInDarkMode brightInBrightMode">***</div>

    <q-page-sticky
      expand
      position="top"
      class="darkInDarkMode brightInBrightMode"
      :class="uiDensity === 'dense' ? 'q-mx-none' : 'q-ma-md'">
      <FirstToolbarHelper2 @tabset-changed="tabsetChanged()" element="popup" :disable="true" />
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import _ from 'lodash'
import { LocalStorage } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import OfflineInfo from 'src/core/components/helper/offlineInfo.vue'
import FirstToolbarHelper2 from 'src/core/pages/sidepanel/helper/FirstToolbarHelper2.vue'
import { useUtils } from 'src/core/services/Utils'
import Analytics from 'src/core/utils/google-analytics'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset, TabsetStatus } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useThumbnailsService } from 'src/thumbnails/services/ThumbnailsService'
import { UiDensity, useUiStore } from 'src/ui/stores/uiStore'
import { useAuthStore } from 'stores/authStore'
import { onMounted, provide, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const { inBexMode } = useUtils()

const router = useRouter()

const showStartingHint = ref(true)
const thumbnail = ref(useTabsStore2().currentChromeTab?.favIconUrl || 'xxx')
const tabsets = ref<Tabset[]>([])
const currentTabset = ref<Tabset | undefined>(undefined)
const browserTab = ref<chrome.tabs.Tab | undefined>(undefined)
const tab = ref<Tab | undefined>(undefined)
const tabsetsLastUpdate = ref(0)
const paddingTop = ref('padding-top: 80px')
const uiDensity = ref<UiDensity>(useUiStore().uiDensity)
const alreadyInTabset = ref<boolean>(false)
const containedInTsCount = ref(0)
const comment = ref('')
const url = ref(useTabsStore2().currentChromeTab?.url || '')

provide('ui.density', uiDensity)

function updateOnlineStatus(e: any) {
  const { type } = e
  useUiStore().networkOnline = type === 'online'
}

onMounted(() => {
  window.addEventListener('offline', (e) => updateOnlineStatus(e))
  window.addEventListener('online', (e) => updateOnlineStatus(e))

  Analytics.firePageViewEvent('PopupPage', document.location.href)

  //switch early
  if (!LocalStorage.getItem('ui.hideWelcomePage')) {
    useRouter().push('/popup/welcome')
  }
})

watchEffect(() => {
  showStartingHint.value =
    !useUiStore().appLoading &&
    currentTabset.value?.name === 'My first Tabset' &&
    !LocalStorage.getItem('ui.hideStartingHint')
})

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
  browserTab.value = useTabsStore2().currentChromeTab
  if (browserTab.value) {
    alreadyInTabset.value = useTabsetService().urlExistsInCurrentTabset(browserTab.value.url)
    const tabsets = useTabsetService().tabsetsFor(browserTab.value.url!)
    containedInTsCount.value = tabsets.length
    if (currentTabset.value && browserTab.value && browserTab.value.url) {
      tab.value = currentTabset.value.tabs.find((t: Tab) => t.url === browserTab.value!.url)
    } else {
      //var t = tabsets.map((ts: Tabset) => ts.tabs)
    }
  }
})

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
})

watchEffect(() => {
  tabsetsLastUpdate.value = useTabsetsStore().lastUpdate
})

watchEffect(() => {
  if (tab.value) {
    useThumbnailsService()
      .getThumbnailFor(tab.value.id, useAuthStore().user.uid)
      .then((data) => {
        if (data) {
          console.log('setting thumbnail to ', data)
          thumbnail.value = data
        } else {
          //thumbnail.value = ''
        }
      })
    // TabsetService.getContentFor(tab.value as Tab).then((data) => {
    //   if (data) {
    //     content.value = data['content' as keyof object]
    //     //metas.value = data['metas' as keyof object]
    //     metaRows.value = []
    //     _.forEach(Object.keys(data['metas' as keyof object]), (k: any) => {
    //       //console.log("k", k, data.metas[k])
    //       metaRows.value.push({
    //         name: k,
    //         value: data['metas' as keyof object][k],
    //       })
    //     })
    //     metaRows.value = _.sortBy(metaRows.value, (s: any) => s['name' as keyof object])
    //   }
    // })
    // useSnapshotsService()
    //   .getMetadataFor(tab.value.id)
    //   .then((mds: BlobMetadata[]) => {
    //     htmls.value = mds
    //   })
  }
})

const getTabsetOrder = [
  function (o: Tabset) {
    return !o || o.status === TabsetStatus.FAVORITE ? 0 : 1
  },
  function (o: Tabset) {
    return o.name?.toLowerCase()
  },
]

function determineTabsets() {
  return _.sortBy(
    _.filter(
      [...useTabsetsStore().tabsets.values()] as Tabset[],
      (ts: Tabset) =>
        ts.status !== TabsetStatus.DELETED && ts.status !== TabsetStatus.HIDDEN && ts.status !== TabsetStatus.ARCHIVED,
    ),
    getTabsetOrder,
    ['asc'],
  )
}

watchEffect(() => {
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    const currentSpace = useSpacesStore().space
    tabsets.value = _.sortBy(
      _.filter([...useTabsetsStore().tabsets.values()] as Tabset[], (ts: Tabset) => {
        if (currentSpace) {
          if (ts.spaces.indexOf(currentSpace.id) < 0) {
            return false
          }
        }
        return (
          ts.status !== TabsetStatus.DELETED && ts.status !== TabsetStatus.HIDDEN && ts.status !== TabsetStatus.ARCHIVED
        )
      }),
      getTabsetOrder,
      ['asc'],
    )
  } else {
    tabsets.value = determineTabsets()
  }
})

// watchEffect(() => {
//   const windowId = useWindowsStore().currentBrowserWindow?.id || 0
//   browserTab.value = useTabsStore2().getCurrentChromeTab(windowId) || useTabsStore2().currentChromeTab
// })

const tabsetChanged = () => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
}
</script>

<style lang="scss" src="src/pages/css/sidePanelPage2.scss" />
