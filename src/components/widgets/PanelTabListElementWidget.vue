<template>

  <q-item-section v-if="useUiStore().listDetailLevelGreaterEqual(ListDetailLevel.MEDIUM)"
                  @mouseover="hoveredTab = tab.id"
                  @mouseleave="hoveredTab = undefined"
                  class="q-mr-sm text-right" style="justify-content:start;width:25px;max-width:25px">
    <div class="bg-grey-3 q-pa-xs" style="border:0 solid grey;border-radius:3px">
      <TabFaviconWidget :tab="props.tab" width="16px" height="16px"/>
    </div>
  </q-item-section>

  <!-- name, title, description, url && note -->
  <q-item-section class="q-mb-sm" :style="itemStyle(props.tab)"
                  @click="selectTab(tab)"
                  @mouseover="hoveredTab = tab.id"
                  @mouseleave="hoveredTab = undefined">

    <!-- name or title -->
    <q-item-label v-if="props.type === 'categories'">
      <div>
        <div class="q-pr-sm cursor-pointer ellipsis" :class="classForCategoryTab(props.tab)">

          <span v-if="props.header" class="text-bold">{{ props.header }}<br></span>
          <span v-if="useTabsStore().getCurrentTabset?.sorting === 'alphabeticalTitle'">
              <q-icon name="arrow_right" size="16px"/>
           </span>
          {{ nameOrTitle(props.tab) }}
        </div>
      </div>
    </q-item-label>
    <q-item-label v-else>
      <div>
        <div class="q-pr-sm cursor-pointer ellipsis">

          <span class="text-bold" v-if="isCurrentTab(props.tab as Tab)">Current Tab:<br></span>

          <span v-if="props.header" class="text-bold">{{ props.header }}<br></span>
          <span v-if="useTabsStore().getCurrentTabset?.sorting === 'alphabeticalTitle'">
              <q-icon name="arrow_right" size="16px"/>
           </span>
          {{ nameOrTitle(props.tab) }}
          <q-popup-edit
            v-if="props.tab.extension !== UrlExtension.NOTE"
            :model-value="dynamicNameOrTitleModel(tab)" v-slot="scope"
            @update:model-value="val => setCustomTitle( tab, val)">
            <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"/>
          </q-popup-edit>
        </div>

      </div>
    </q-item-label>

    <!-- description -->
    <q-item-label class="ellipsis-2-lines text-grey-8"
                  v-if="useUiStore().listDetailLevelGreaterEqual(ListDetailLevel.LARGE)"
                  @click.stop="NavigationService.openOrCreateTab(props.tab.chromeTab?.url )">
      {{ props.tab.description }}
    </q-item-label>

    <!-- url -->
    <q-item-label
      style="width:100%"
      v-if="props.tab.chromeTab?.url"
      caption class="ellipsis-2-lines text-blue-10"
      @mouseover="showButtonsProp = true"
      @mouseleave="showButtonsProp = false">
      <div class="row q-ma-none">
        <div class="col-10 q-pr-lg cursor-pointer"
             @click.stop="NavigationService.openOrCreateTab(props.tab.chromeTab?.url )">
           <span v-if="useTabsStore().getCurrentTabset?.sorting === 'alphabeticalUrl'">
              <q-icon name="arrow_right" size="16px"/>
           </span>

          <span v-if="props.tab.extension === UrlExtension.NOTE">open Note</span>
          <short-url v-else :url="props.tab.chromeTab?.url" :hostname-only="true"/>
          <div class="text-caption text-grey-5">
            {{ formatDate(props.tab.created) }}
          </div>
          <!-- <q-icon class="q-ml-xs" name="open_in_new"/>-->
        </div>
        <div v-if="!props.hideMenu"
             class="col text-right q-mx-sm cursor-pointer"
             @mouseover="hoveredTab = tab.id"
             @mouseleave="hoveredTab = undefined"
             style="max-width:25px;font-size: 12px;color:#bfbfbf">
            <span v-if="hoveredOver(tab.id)">
              <q-icon name="more_horiz" color="primary" size="16px"/>
            </span>
          <span v-else>
              <q-icon color="primary" size="16px"/>
            </span>
          <PanelTabListContextMenu :tab="tab" v-if="!props.hideMenu"/>

        </div>
      </div>

    </q-item-label>

    <!-- note -->
    <q-item-label v-if="useUiStore().listDetailLevelGreaterEqual(ListDetailLevel.LARGE) && props['tab']['note']"
                  class="text-grey-10" text-subtitle1>
      <q-icon color="blue-10" name="edit_note"/>
      {{ props['tab']['note'] }}
    </q-item-label>

    <q-item-label v-if="props.showTabsets">
      <template v-for="badge in tsBadges">
        <q-chip class="cursor-pointer q-ml-none q-mr-xs" size="9px" icon="tab">
          {{ badge.label }}
        </q-chip>
      </template>
    </q-item-label>
  </q-item-section>

</template>

<script setup lang="ts">
import NavigationService from "src/services/NavigationService";
import {Tab, UrlExtension} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {onMounted, ref, watchEffect} from "vue";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {DeleteTabCommand} from "src/domain/commands/DeleteTabCommand";
import {useQuasar} from "quasar";
import {ListDetailLevel, useUiStore} from "src/stores/uiStore";
import TabFaviconWidget from "components/widgets/TabFaviconWidget.vue";
import {UpdateTabNameCommand} from "src/domain/tabs/UpdateTabName";
import {CopyToClipboardCommand} from "src/domain/commands/CopyToClipboard";
import {useTabsetService} from "src/services/TabsetService2";
import ShortUrl from "components/utils/ShortUrl.vue";
import {useTabsStore} from "src/stores/tabsStore";
import PanelTabListContextMenu from "components/widgets/helper/PanelTabListContextMenu.vue";
import _ from "lodash";
import {formatDistance} from "date-fns";

const props = defineProps({
  tab: {type: Object, required: true},
  header: {type: String, required: false},
  type: {type: String, default: 'sidepanel'},
  hideMenu: {type: Boolean, default: false},
  showTabsets: {type: Boolean, default: false}
})

const emits = defineEmits(['sendCaption'])

const $q = useQuasar()
const tabsStore = useTabsStore()

const line = ref(null)
const showButtonsProp = ref<boolean>(false)
const thumbnail = ref<string | undefined>(undefined)
const imgFromBlob = ref<string>("")
const hoveredTab = ref<string | undefined>(undefined)
const tsBadges = ref<object[]>([])
const tabsetCandidates = ref<object[]>([])

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
    tabsetCandidates.value = c ? (c['tabsetCandidates' as keyof object] || []) : []
  }
})


function getShortHostname(host: string) {
  const nrOfDots = (host.match(/\./g) || []).length
  if (nrOfDots >= 2) {
    return host.substring(host.indexOf(".", nrOfDots - 2) + 1)
  }
  return host
}

function getHost(urlAsString: string, shorten: Boolean = true): string {
  try {
    const url = new URL(urlAsString)
    if (!shorten) {
      return url.protocol + "://" + url.host.toString()
    }
    return getShortHostname(url.host)
  } catch (e) {
    return "---";
  }
}

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

const selectTab = (tab: Tab) => {
  // useUiStore().setSelectedTab(tab)
  // TabsetService.setOnlySelectedTab(tab)
  // const notificationStore = useNotificationsStore()
  // notificationStore.setSelectedTab(tab)
}


const getFaviconUrl = (chromeTab: chrome.tabs.Tab | undefined) => {
  if (chromeTab && chromeTab.favIconUrl && !chromeTab.favIconUrl.startsWith("chrome")) {
    return chromeTab.favIconUrl
  }
  return ''//'favicon-unknown-32x32.png'
}

const deleteTab = (tab: Tab) => useCommandExecutor().executeFromUi(new DeleteTabCommand(tab))


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

const hoveredOver = (tabsetId: string) => hoveredTab.value === tabsetId

const classForCategoryTab = (tab: Tab) => {
  const url = tab.chromeTab.url
  if (url && useTabsetService().tabsetsFor(url).length > 0) {
    return "text-grey-5"
  }
  return ""
}

const formatDate = (timestamp: number | undefined) =>
  timestamp ? formatDistance(timestamp, new Date(), {addSuffix: true}) : ""

const isCurrentTab = (tab: Tab) => {
    //console.log("xxx", tabsStore.getCurrentTabset.tabs[0].chromeTab.url, tab.chromeTab.url)
    return tabsStore.currentChromeTab.url === tab.chromeTab.url;

}
</script>
