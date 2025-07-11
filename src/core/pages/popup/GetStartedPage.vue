<template>
  <!-- GetStartedPage -->
  <q-page class="darkInDarkMode brightInBrightMode" :style="paddingTop" style="min-width: 350px; max-width: 700px">
    <offline-info />

    <StartingHintPopup @hidden="goto('/popup')" />
  </q-page>
</template>

<script lang="ts" setup>
import { LocalStorage } from 'quasar'
import OfflineInfo from 'src/core/components/helper/offlineInfo.vue'
import StartingHintPopup from 'src/core/pages/widgets/StartingHintPopup.vue'
import Analytics from 'src/core/utils/google-analytics'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { UiDensity, useUiStore } from 'src/ui/stores/uiStore'
import { onMounted, provide, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const showStartingHint = ref(true)
const thumbnail = ref(useTabsStore2().currentChromeTab?.favIconUrl || 'xxx')
const currentTabset = ref<Tabset | undefined>(undefined)
const browserTab = ref<chrome.tabs.Tab | undefined>(undefined)
const tab = ref<Tab | undefined>(undefined)
const tabsetsLastUpdate = ref(0)
const paddingTop = ref('padding-top: 80px')
const uiDensity = ref<UiDensity>(useUiStore().uiDensity)
const alreadyInTabset = ref<boolean>(false)
const containedInTsCount = ref(0)

provide('ui.density', uiDensity)

onMounted(() => {
  Analytics.firePageViewEvent('GetStartedPage', document.location.href)
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

const goto = (path: string) => router.push(path)
</script>

<style lang="scss" src="src/pages/css/sidePanelPage2.scss" />
