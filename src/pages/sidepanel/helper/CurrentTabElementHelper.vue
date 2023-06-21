<template>

  <q-item-section class="q-mr-sm text-right" style="justify-content:start;width:50px;max-width:50px">

    <q-img
      class="rounded-borders q-ml-sm"
      width="24px"
      height="24px"
      :src="currentChromeTab?.favIconUrl">
    </q-img>

    <div class="col text-caption" style="position:relative;top:25px">
      {{ alreadyInTabset() ? 'saved in' : 'save in' }}
    </div>
  </q-item-section>

  <q-item-section class="q-mb-sm">

    <!-- title -->
    <q-item-label>
      <div>
        <div class="q-pr-sm cursor-pointer ellipsis">
          <span class="text-bold">Current Tab:<br></span>
          {{ currentChromeTab?.title }}
        </div>
      </div>
    </q-item-label>
    <!-- url -->
    <q-item-label>
      <div>
        <div class="q-pr-sm ellipsis">
          <short-url :url="currentChromeTab?.url || ''" :hostname-only="true"/>
        </div>
      </div>
    </q-item-label>

    <!-- saved in / save to tabset -->
    <q-item-label>
      <template v-if="!alreadyInTabset()">
        <q-chip clickable
                @click="saveInTabset(tabsStore.currentTabsetId)"
                class="cursor-pointer q-ml-none q-mr-xs" size="9px" icon="tab">
          {{ tabsStore.currentTabsetName }}
          <q-tooltip>current tabset</q-tooltip>
        </q-chip>
        <template v-for="c in tabsetCandidates">
          <q-chip clickable color="warning"
                  @click="saveInTabset(c.candidateId)"
                  class="cursor-pointer q-ml-none q-mr-xs" size="9px" icon="tab">
            {{ c.candidateName }}
            <q-tooltip>Suggestion from AI Module (with confidence {{ Math.round(100 * c.score) }}%)</q-tooltip>
          </q-chip>
        </template>
      </template>
      <template v-else>
        <template v-for="badge in tsBadges">
          <q-chip class="cursor-pointer q-ml-none q-mr-xs" size="9px" icon="tab">
            {{ badge.label }}
          </q-chip>
        </template>
      </template>
    </q-item-label>
  </q-item-section>

</template>

<script setup lang="ts">
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {ref, watchEffect} from "vue";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {uid, useQuasar} from "quasar";
import {useTabsetService} from "src/services/TabsetService2";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash";
import {AddTabToTabsetCommand} from "src/domain/tabs/AddTabToTabset";
import ShortUrl from "components/utils/ShortUrl.vue";

const emits = defineEmits(['sendCaption'])

const $q = useQuasar()

const line = ref(null)
const thumbnail = ref<string | undefined>(undefined)
const tsBadges = ref<object[]>([])
const tabsetCandidates = ref<object[]>([])
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)

const tabsStore = useTabsStore()

watchEffect(() => currentChromeTab.value = useTabsStore().currentChromeTab)

watchEffect(() => {
  if (currentChromeTab.value?.url) {
    const url = currentChromeTab.value.url
    const tabsetIds = useTabsetService().tabsetsFor(url)
    tsBadges.value = []
    _.forEach(tabsetIds, tsId => tsBadges.value.push({
      label: TabsetService.nameForTabsetId(tsId),
      tabsetId: tsId,
      encodedUrl: btoa(url || '')
    }))
  }
})


watchEffect(async () => {
  if (currentChromeTab.value?.url) {
    const c = await TabsetService.getContentForUrl(currentChromeTab.value.url)
    if (c && c['tabsetCandidates' as keyof object]) {
      tabsetCandidates.value = _.filter(c['tabsetCandidates' as keyof object],
        (c: object) => (c['candidateName' as keyof object] || '') !== tabsStore.currentTabsetName)
    } else {
      tabsetCandidates.value = []
    }
  }
})

const isOpen = (tab: Tab): boolean => TabsetService.isOpen(tab?.chromeTab?.url || '')

const setInfo = (tab: Tab) => {
  const parts = (tab.chromeTab?.url || '').split('?')
  if (parts.length > 1) {
    emits('sendCaption', parts[0] + "[... params omitted....]")
  } else if (parts.length === 1) {
    emits('sendCaption', parts[0].toString());
  }
}


const thumbnailFor = async (tab: Tab): Promise<object> => {
  return await TabsetService.getThumbnailFor(tab)
}

const saveInTabset = (tabsetId: string) => {
  console.log("saving to tabset ", tabsetId)
  const useTS = useTabsetService().getTabset(tabsetId)
  if (useTS) {
    useCommandExecutor().executeFromUi(new AddTabToTabsetCommand(new Tab(uid(), currentChromeTab.value), useTS))
  }
}

const alreadyInTabset = () => {
  if (currentChromeTab.value?.url) {
    return useTabsetService().urlExistsInCurrentTabset(currentChromeTab.value.url)
  }
  return false
}
</script>
