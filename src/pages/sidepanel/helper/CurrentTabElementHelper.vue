<template>

  <div class="row">
    <div class="col-2">
      <q-img
        class="rounded-borders q-ml-sm"
        width="24px"
        height="24px"
        :src="currentChromeTab?.favIconUrl">
      </q-img>
    </div>
    <div class="col-10">
      <div class="row">
        <div class="col-11 text-bold">Current Tab:</div>
        <div class="col">
          <q-icon name="close"
                  @click="hideCurrentTabBox()"
                  class="cursor-pointer" color="accent">
            <q-tooltip>Hide this box temporarily</q-tooltip>
          </q-icon>
        </div>
      </div>
      <div class="q-pr-sm cursor-pointer ellipsis">
        {{ currentChromeTab?.title }}
      </div>
      <div>
        <div class="q-pr-sm q-mb-xs ellipsis">
          <short-url :url="currentChromeTab?.url || ''" :hostname-only="true"/>
        </div>
      </div>
    </div>
  </div>

  <div class="row">
    <div class="col-2">

    </div>
    <div class="col-10 text-right">
      <q-btn
             label="Add"
             color="warning"
             class="q-ma-sm q-px-md"
             style="cursor: pointer"
             size="10px"
             @click="saveInTabset(props.tabsetId)"
             icon="o_favorite"/>


    </div>
  </div>

</template>

<script setup lang="ts">
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {ref, watchEffect} from "vue";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {date, Notify, uid, useQuasar} from "quasar";
import {useTabsetService} from "src/services/TabsetService2";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash";
import {AddTabToTabsetCommand} from "src/domain/tabs/AddTabToTabset";
import ShortUrl from "components/utils/ShortUrl.vue";
import {useUtils} from "src/services/Utils";
import {SelectTabsetCommand} from "src/domain/tabsets/SelectTabset";
import {useSpacesStore} from "stores/spacesStore";
import {Tabset} from "src/models/Tabset";
import {useWindowsStore} from "stores/windowsStores";
import {HideCurrentTabBoxCommand} from "src/domain/commands/ui/HideCurrentTabBoxCommand";

const props = defineProps({
  tabsetId: {type: String, required: true}
})

const {formatDate} = useUtils()

const emits = defineEmits(['sendCaption'])

const $q = useQuasar()

const line = ref(null)
const thumbnail = ref<string | undefined>(undefined)
const tsBadges = ref<object[]>([])
const tabsetCandidates = ref<object[]>([])
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)
const created = ref<string | undefined>(undefined)
const tabsStore = useTabsStore()

watchEffect(() => {
  const windowId = useWindowsStore().currentWindow?.id || 0
  currentChromeTab.value = useTabsStore().getCurrentChromeTab(windowId) || useTabsStore().currentChromeTab
})

watchEffect(() => {
  if (currentChromeTab.value?.url) {
    const url = currentChromeTab.value.url
    const tabsetIds = useTabsetService().tabsetsFor(url)
    tsBadges.value = []
    created.value = undefined
    _.forEach(tabsetIds, tsId => {
      if (tsId === props.tabsetId) {
        const tabsForUrl = tabsStore.tabsForUrl(currentChromeTab.value.url || '')
        if (tabsForUrl && tabsForUrl.length > 0) {
          created.value = formatDate(tabsForUrl[0].created)
        }
      }
      tsBadges.value.push({
        label: TabsetService.nameForTabsetId(tsId),
        tabsetId: tsId,
        encodedUrl: btoa(url || '')
      })
    })
  }
})


watchEffect(async () => {
  if (currentChromeTab.value?.url) {
    try {
      const c = await TabsetService.getContentForUrl(currentChromeTab.value.url)
      if (c && c['tabsetCandidates' as keyof object]) {
        //console.log("(0) candidates set to ", c['tabsetCandidates' as keyof object])
        tabsetCandidates.value = _.sortBy(_.filter(c['tabsetCandidates' as keyof object],
            (c: object) => (c['candidateName' as keyof object] || '') !== tabsStore.currentTabsetName),
          ['score'])
      } else {
        tabsetCandidates.value = []
      }
      //console.log("(1) candidates set to ", JSON.stringify(tabsetCandidates.value))
      // remove the candidates the tab is already assigned to
      const tabsetsForUrl = useTabsetService().tabsetsFor(currentChromeTab.value?.url)
      // console.log("tabsetsforur", tabsetsForUrl)
      tabsetCandidates.value = _.filter(tabsetCandidates.value, (c: object) => {
        // console.log("comparing", tabsetsForUrl, c, tabsetsForUrl.indexOf(c.candidateId))
        return tabsetsForUrl.indexOf(c.candidateId) < 0
      })
      //console.log("(2) candidates set to ", JSON.stringify(tabsetCandidates.value))
      // at max n elements
      tabsetCandidates.value = _.take(tabsetCandidates.value, 3)

      // console.log("(3) candidates set to ", JSON.stringify(tabsetCandidates.value))
    } catch (err) {
      console.log("err: ", err)
    }
  }
})

const isOpen = (tab: Tab): boolean => TabsetService.isOpen(tab?.url || '')

const setInfo = (tab: Tab) => {
  const parts = (tab.url || '').split('?')
  if (parts.length > 1) {
    emits('sendCaption', parts[0] + "[... params omitted....]")
  } else if (parts.length === 1) {
    emits('sendCaption', parts[0].toString());
  }
}

const saveInTabset = (tabsetId: string) => {
  const useTS = useTabsetService().getTabset(tabsetId)
  if (useTS) {
    useCommandExecutor().execute(new AddTabToTabsetCommand(new Tab(uid(), currentChromeTab.value), useTS))
      .then((res: any) => {
        tabsetCandidates.value = _.filter(tabsetCandidates.value, (c: object) => c['candidateId' as keyof object] !== tabsetId)
      })
  } else {
    console.warn("expected to find tabsetId", tabsetId)
  }
}

const hideCurrentTabBox = () => useCommandExecutor().execute(new HideCurrentTabBoxCommand(true))

</script>
