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
      <div class="q-pr-sm cursor-pointer ellipsis">
        <span class="text-bold">Current Tab:<br></span>
        {{ currentChromeTab?.title }}
      </div>
      <div>
        <div class="q-pr-sm q-mb-xs ellipsis">
          <short-url :url="currentChromeTab?.url || ''" :hostname-only="true"/>
        </div>
      </div>
    </div>
  </div>

  <!-- <q-separator v-if="!alreadyInSomeTabset()" color="lightgray" inset/>-->

<!--  <div class="row" v-if="alreadyInSomeTabset()">-->
<!--    <div class="col-2 text-caption">-->
<!--      &lt;!&ndash; <q-icon class="q-ma-xs q-ml-sm" size="18px" name="tab" color="primary">-->
<!--         <q-tooltip class="tooltip">Saved in tabsets:</q-tooltip>-->
<!--       </q-icon>&ndash;&gt;-->
<!--    </div>-->
<!--    <div class="col-10">-->
<!--      <template v-for="badge in tsBadges">-->
<!--        <q-chip-->
<!--          :clickable="badge.tabsetId !== props.tabsetId"-->
<!--          @click="switchTabset(badge.tabsetId, badge.label)"-->
<!--          :color="tabsetChipColor(badge.tabsetId)"-->
<!--          style="max-width:70px"-->
<!--          class="cursor-pointer q-ml-none q-mr-xs ellipsis" size="9px">-->
<!--          {{ shorten(badge.label, 12) }}-->
<!--          <q-tooltip v-if="badge.tabsetId !== props.tabsetId"-->
<!--                     class="tooltip" :delay="1000">This tab has been added to the tabset '{{ badge.label }}'-->
<!--            {{ created }}. Click to go to this tabset.'-->
<!--          </q-tooltip>-->
<!--          <q-tooltip v-else-->
<!--                     class="tooltip" :delay="1000">This tab has been added to the current tabset '{{ badge.label }}'-->
<!--            {{ created }}-->
<!--          </q-tooltip>-->
<!--        </q-chip>-->
<!--      </template>-->
<!--      &lt;!&ndash;      <span class="text-caption">{{ created }}</span>&ndash;&gt;-->
<!--    </div>-->
<!--    <div class="col-2">-->
<!--    </div>-->
<!--    <div class="col-10">-->
<!--      ***<svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">-->
<!--      <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>-->
<!--      <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>-->
<!--    </svg>-->
<!--    </div>-->
<!--  </div>-->
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

      <template class="text-caption" v-if="tabsetCandidates.length > 0"> or use AI suggestion:
        <template v-for="c in tabsetCandidates">
          <q-chip clickable
                  @click="saveInTabset(c.candidateId)"
                  class="cursor-pointer q-ml-none q-mr-xs" size="9px" icon="o_auto_awesome">
            {{ c.candidateName }}
            <q-tooltip class="tooltip">Suggestion from AI Module (with confidence {{
                Math.round(100 * c.score)
              }}%)
            </q-tooltip>
          </q-chip>
        </template>
      </template>

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
  const current = useTabsStore()?.currentChromeTab
  if (current) {
    currentChromeTab.value = current
  }
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
    useCommandExecutor().executeFromUi(new AddTabToTabsetCommand(new Tab(uid(), currentChromeTab.value), useTS))
      .then((res: any) => {
        tabsetCandidates.value = _.filter(tabsetCandidates.value, (c: object) => c['candidateId' as keyof object] !== tabsetId)
      })
  } else {
    console.warn("expected to find tabsetId", tabsetId)
  }
}

const alreadyInCurrentTabset = () => {
  if (currentChromeTab.value?.url) {
    return useTabsetService().urlExistsInCurrentTabset(currentChromeTab.value.url)
  }
  return false
}

const alreadyInSomeTabset = () => {
  if (currentChromeTab.value?.url) {
    return useTabsetService().tabsetsFor(currentChromeTab.value.url).length > 0
  }
  return false
}

const switchTabset = (tsId: string, name: string) => {
  useCommandExecutor()
    .execute(new SelectTabsetCommand(tsId, useSpacesStore().space?.id))
    .then((res: any) => {
      Notify.create({
        color: 'positive',
        message: "switched to tabset " + name
      })
    })
}

const tabsetChipColor = (tsId: string) => tsId !== props.tabsetId ? 'white' : ''
const shorten = (text: string, maxLength: number) => text.length > maxLength ? text.substring(0, maxLength - 2) + "..." : text
</script>
