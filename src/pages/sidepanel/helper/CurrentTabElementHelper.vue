<template>

  <q-item-section v-if="useUiStore().listDetailLevelGreaterEqual(ListDetailLevel.MEDIUM)"
                  @mouseover="hoveredTab = tab.id"
                  @mouseleave="hoveredTab = undefined"
                  class="q-mr-sm text-right" style="justify-content:start;width:45px;max-width:45px">
    <q-img v-if="props.tab?.image && props.tab.image.startsWith('blob://')"
           style="border:3px dotted white;border-radius:3px"
           :src="imgFromBlob" width="25px"/>
    <q-img v-else-if="props.tab.image"
           style="border:1px dotted white;border-radius:3px"
           :src="props.tab.image" width="25px"/>
    <q-img v-else-if="thumbnail" style="border:1px dotted white;border-radius:3px"
           :src="thumbnail" width="25px"/>
    <TabFaviconWidget v-else
                      :tab="props.tab" width="25px" height="25px"/>

    <div class="col q-mt-md text-caption">
      save in
    </div>
  </q-item-section>

  <!-- name, title, description, url && note -->
  <q-item-section class="q-mb-sm" :style="itemStyle(props.tab)">

    <!-- name or title -->
    <q-item-label>
      <div>
        <div class="q-pr-sm cursor-pointer ellipsis">
          <span class="text-bold">Current Tab:<br></span>
          {{ nameOrTitle(props.tab) }}
        </div>

      </div>
    </q-item-label>

    <q-item-label>
      <q-btn  @click.stop="saveInTabset(tabsStore.currentTabsetId)" label="test" />
      <q-chip
        @click.stop="saveInTabset(tabsStore.currentTabsetId)"
        class="cursor-pointer q-ml-none q-mr-xs" size="9px" icon="tab">
        {{ tabsStore.currentTabsetName }}
        <q-tooltip>current tabset</q-tooltip>
      </q-chip>
      <template v-for="c in tabsetCandidates">
        <q-chip
          @click="saveInTabset(c.candidateId)"
          class="cursor-pointer q-ml-none q-mr-xs" size="9px" icon="tab">
          {{ c.candidateName }}
          <q-tooltip>Suggestion from AI Module (with confidence {{Math.round(100 * c.score)}}%)</q-tooltip>
        </q-chip>
      </template>
    </q-item-label>
  </q-item-section>

</template>

<script setup lang="ts">
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {onMounted, ref, watchEffect} from "vue";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {uid, useQuasar} from "quasar";
import {ListDetailLevel, useUiStore} from "src/stores/uiStore";
import TabFaviconWidget from "components/widgets/TabFaviconWidget.vue";
import {UpdateTabNameCommand} from "src/domain/tabs/UpdateTabName";
import {CopyToClipboardCommand} from "src/domain/commands/CopyToClipboard";
import {useTabsetService} from "src/services/TabsetService2";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash";
import {AddTabToTabsetCommand} from "src/domain/tabs/AddTabToTabset";

const props = defineProps({
  tab: {type: Object, required: true}
})

const emits = defineEmits(['sendCaption'])

const $q = useQuasar()

const line = ref(null)
const showButtonsProp = ref<boolean>(false)
const thumbnail = ref<string | undefined>(undefined)
const imgFromBlob = ref<string>("")
const hoveredTab = ref<string | undefined>(undefined)
const tsBadges = ref<object[]>([])
const tabsetCandidates = ref<object[]>([])

const tabsStore = useTabsStore()

onMounted(() => {
  const blobImgPath = props.tab.image
  if (blobImgPath && blobImgPath.startsWith('blob://')) {
    useTabsetService().getBlob(blobImgPath.replace("blob://", ""))
      .then((res) => {
        var reader = new FileReader();
        reader.readAsDataURL(res.content);
        reader.onloadend = function () {
          var base64data = reader.result;
          if (base64data) {
            imgFromBlob.value = base64data.toString()
          }
        }
      })
      .catch((err) => console.error(err))
  }
})

watchEffect(() => {
  if (props.tab && props.tab.chromeTab.url) {
    const url = props.tab.chromeTab.url
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
  if (props.tab.chromeTab.url) {
    const c = await TabsetService.getContentForUrl(props.tab.chromeTab.url)
    if (c && c['tabsetCandidates' as keyof object]) {
      tabsetCandidates.value = _.filter(c['tabsetCandidates' as keyof object],
        (c: object) => (c['candidateName' as keyof object] || '') !== tabsStore.currentTabsetName)
    } else {
      tabsetCandidates.value = []
    }
  }
})

const itemStyle = (tab: Tab) => {
  let border = ""
  let background = ''
  return `${border};${background}`
}

const isOpen = (tab: Tab): boolean => TabsetService.isOpen(tab?.chromeTab?.url || '')

const setInfo = (tab: Tab) => {
  const parts = (tab.chromeTab?.url || '').split('?')
  if (parts.length > 1) {
    emits('sendCaption', parts[0] + "[... params omitted....]")
  } else if (parts.length === 1) {
    emits('sendCaption', parts[0].toString());
  }
}

const selectTab = (tab: Tab) => useUiStore().setSelectedTab(tab)

const getFaviconUrl = (chromeTab: chrome.tabs.Tab | undefined) => {
  if (chromeTab && chromeTab.favIconUrl && !chromeTab.favIconUrl.startsWith("chrome")) {
    return chromeTab.favIconUrl
  }
  return ''//'favicon-unknown-32x32.png'
}


const nameOrTitle = (tab: Tab) => tab.name ? tab.name : tab.chromeTab?.title

const dynamicNameOrTitleModel = (tab: Tab) => tab.name ? tab.name : tab.chromeTab?.title

const setCustomTitle = (tab: Tab, newValue: string) =>
  useCommandExecutor().executeFromUi(new UpdateTabNameCommand(tab, newValue))

const copyToClipboard = (text: string) =>
  useCommandExecutor().executeFromUi(new CopyToClipboardCommand(text))

const thumbnailFor = async (tab: Tab): Promise<object> => {
  return await TabsetService.getThumbnailFor(tab)
}

watchEffect(() => {
  if (props.tab) {
    // @ts-ignore
    thumbnailFor(props.tab)
      .then((tn: object) => {
        //console.log("tn", tn)
        if (tn && tn['thumbnail' as keyof object]) {
          thumbnail.value = tn['thumbnail' as keyof object]
        }
      })
      .catch((err) => {
        //console.log("could not get thumbnail for ", props.tab)
      })
  }
})

const saveInTabset = (tabsetId: string) => {
  console.log("saving to tabset ", tabsetId)
  //if (currentChromeTab && tabsStore.getCurrentTabset) {
  //const tabsetId = tabsStore.getCurrentTabset.id // tabsetName.value['value' as keyof object]
  // useTabsetService().addToTabsetId(tabset['value' as keyof object], new Tab(uid(), currentChromeTab))
  const useTS = useTabsetService().getTabset(tabsetId)
  if (useTS) {
    useCommandExecutor().executeFromUi(new AddTabToTabsetCommand(new Tab(uid(), props.tab as chrome.tabs.Tab), useTS))
  }
  // }
}
</script>
