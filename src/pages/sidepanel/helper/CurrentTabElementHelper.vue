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
    <div class="col-2"></div>
    <div class="col-5">
      <template v-if="tsBadges.length > 0">
        <q-chip class="cursor-pointer q-ml-none q-mr-sm q-mt-md" size="9px" clickable icon="tab" @click="openTabset(tsBadges[0])">
          {{ tsBadges[0]['label' as keyof object] }}
          <q-tooltip class="tooltip">This tab is already contained in this tabset</q-tooltip>
        </q-chip>
        <template v-if="tsBadges.length > 1">
          <q-chip class="q-ml-none q-mr-sm q-mt-md" size="9px">
            +{{ tsBadges.length -1 }}
            <q-tooltip class="tooltip">{{tooltipForMoreTabsets()}}</q-tooltip>
          </q-chip>
        </template>
      </template>
    </div>
    <div class="col-5 text-right">
      <q-btn
             label="Save"
             color="warning"
             class="q-ma-sm q-px-md"
             style="cursor: pointer"
             size="10px"
             data-testid="saveInTabsetBtn"
             @click="saveInTabset(props.tabsetId)"
             icon="o_save"/>


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
import {useRouter} from "vue-router";

const props = defineProps({
  tabsetId: {type: String, required: true}
})

const {formatDate} = useUtils()

const router = useRouter()

const tsBadges = ref<object[]>([])
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

const saveInTabset = (tabsetId: string) => {
  const useTS = useTabsetService().getTabset(tabsetId)
  if (useTS) {
    useCommandExecutor().execute(new AddTabToTabsetCommand(new Tab(uid(), currentChromeTab.value), useTS))
  } else {
    console.warn("expected to find tabsetId", tabsetId)
  }
}

const hideCurrentTabBox = () => useCommandExecutor().execute(new HideCurrentTabBoxCommand(true))

const tooltipForMoreTabsets = () => {
  let res = "There are more tabsets this tab is already contained in: "
  if (tsBadges.value.length > 1) {
    const allButFirst = tsBadges.value.slice(1)
    return res + _.join(_.map(allButFirst, (e) => e['label' as keyof object]), ', ')
  }
  return res
}

const openTabset = (badge: any) => {
  useTabsetService().selectTabset(badge.tabsetId)
  // @ts-ignore
  if (!inBexMode() || !chrome.sidePanel) {
    router.push("/tabsets/" + badge.tabsetId + "?highlight=" + badge.encodedUrl)
  } else {
    router.push("/sidepanel" + "?highlight=" + badge.encodedUrl)
  }
}

</script>
