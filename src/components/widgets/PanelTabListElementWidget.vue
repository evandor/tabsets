<template>

  <q-item-section v-if="useUiStore().listDetailLevelGreaterEqual(ListDetailLevel.MEDIUM)"
                  @mouseover="hoveredTab = tab.id"
                  @mouseleave="hoveredTab = undefined"
                  class="q-mr-sm text-right" style="justify-content:start;width:25px;max-width:25px">
    <div class="bg-grey-3 q-pa-xs" style="border:0 solid grey;border-radius:3px">
      <!---->

      <transition name="fade" mode="out-in">
        <div v-if="newState" key="newState">
          <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20.8 20.8">
            <circle class="checkmark__circle" cx="10.4" cy="10.4" r="10" fill="none"/>
            <path class="checkmark__check" fill="none" d="M5.64 10.88l2.84 2.88 6.68-6.72"/>
          </svg>
        </div>
        <div v-else key="oldState">
          <TabFaviconWidget :tab="props.tab" width="16px" height="16px"/>
        </div>
      </transition>

    </div>
    <div v-if="props.tab?.httpInfo === 'UPDATED'"
         class="q-my-xs q-mx-none q-pa-none text-white bg-positive items-center justify-center"
         style="border-radius: 3px;max-height:15px;font-size:8px;text-align: center;">
      NEW
      <q-tooltip class="tooltip">This page indicates that its content has changed in the meantime.</q-tooltip>
    </div>
    <div v-else-if="props.tab?.httpStatus >= 300"
         class="q-my-xs q-mx-none q-pa-none text-white items-center justify-center"
         :class="props.tab?.httpStatus >= 500 ? 'bg-red' : 'bg-warning'"
         style="border-radius: 3px;max-height:15px;font-size:8px;text-align: center;">
      {{ props.tab.httpStatus }}
      <q-tooltip class="tooltip">Tabsets has problems accessing this site.</q-tooltip>
    </div>

  </q-item-section>

  <!-- name, title, description, url && note -->
  <q-item-section class="q-mb-sm"
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

          <!--          <span class="text-bold" v-if="isCurrentTab(props.tab as Tab)">Current Tab::<br></span>-->

          <span v-if="props.header" class="text-bold">{{ props.header }}<br></span>
          <span v-if="useTabsStore().getCurrentTabset?.sorting === 'alphabeticalTitle'">
              <q-icon name="arrow_right" size="16px"/>
           </span>
          <span v-html="nameOrTitle(props.tab as Tab)"/>
          <q-popup-edit
            v-if="props.tab?.extension !== UrlExtension.NOTE"
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
                  @click.stop="NavigationService.openOrCreateTab(props.tab?.url || '' )">
      {{ props.tab.description }}
    </q-item-label>

    <!-- url -->
    <q-item-label
      style="width:100%"
      v-if="props.tab?.url"
      caption class="ellipsis-2-lines text-blue-10"
      @mouseover="showButtonsProp = true"
      @mouseleave="showButtonsProp = false">
      <div class="row q-ma-none">
        <div class="col-10 q-pr-lg cursor-pointer"
             @click.stop="NavigationService.openOrCreateTab(props.tab.url )">
           <span v-if="useTabsStore().getCurrentTabset?.sorting === 'alphabeticalUrl'">
              <q-icon name="arrow_right" size="16px"/>
           </span>

          <!-- url or note -->
          <template v-if="props.tab.extension === UrlExtension.NOTE">
            <span>open Note</span>
          </template>
          <template v-else>
            <short-url :url="props.tab.url" :hostname-only="true"/>
          </template>
          <div class="text-caption text-grey-5">
            {{ formatDate(props.tab.lastActive) }}
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
          <PanelTabListContextMenu
            :tabsetType="props.tabsetType"
            :tab="tab" v-if="!props.hideMenu"/>

        </div>
      </div>

    </q-item-label>

    <!-- note -->
    <q-item-label v-if="useUiStore().listDetailLevelGreaterEqual(ListDetailLevel.LARGE) &&
      props['tab' as keyof object]['note']"
                  class="text-grey-10" text-subtitle1>
      <q-icon color="blue-10" name="edit_note"/>
      <div class="ellipsis-2-lines">
        {{ props['tab']['note'] }}
      </div>
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
import {onMounted, PropType, ref, watchEffect} from "vue";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {DeleteTabCommand} from "src/domain/tabs/DeleteTabCommand";
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
import {TabsetType} from "src/models/Tabset";
import {useWindowsStore} from "stores/windowsStores";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";

const props = defineProps({
  tab: {type: Object as PropType<Tab>, required: true},
  header: {type: String, required: false},
  type: {type: String, default: 'sidepanel'},
  hideMenu: {type: Boolean, default: false},
  showTabsets: {type: Boolean, default: false},
  tabsetType: {type: String, default: TabsetType.DEFAULT.toString()}
})

const emits = defineEmits(['sendCaption'])
const cnt = ref(0)
const $q = useQuasar()
const tabsStore = useTabsStore()

const line = ref(null)
const showButtonsProp = ref<boolean>(false)
const thumbnail = ref<string | undefined>(undefined)
const imgFromBlob = ref<string>("")
const hoveredTab = ref<string | undefined>(undefined)
const tsBadges = ref<object[]>([])
const tabsetCandidates = ref<object[]>([])
const newState = ref(false)

onMounted(() => {
  if ((new Date().getTime() - props.tab.created) < 500) {
    newState.value = true
    const audio = document.getElementById('myAudio')
    if (audio) {
      // @ts-ignore
      audio.play()
    }
    setTimeout(() => newState.value = false, 2000)
  }
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
  if (props.tab && props.tab.url) {
    cnt.value = cnt.value + 1
    const url = props.tab.url
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
  if (props.tab.url) {
    const c = await TabsetService.getContentForUrl(props.tab.url)
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

const isOpen = (tab: Tab): boolean => TabsetService.isOpen(tab?.url || '')

const setInfo = (tab: Tab) => {
  const parts = (tab?.url || '').split('?')
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


const nameOrTitle = (tab: Tab) => {
  let nameOrTitle = tab.name ? tab.name : tab.title
  if (usePermissionsStore().hasFeature(FeatureIdent.ANNOTATIONS) && tab.annotations?.length > 0) {
    nameOrTitle = "("+tab.annotations.length+") " + nameOrTitle
  }
  if (isCurrentTab(props.tab as Tab)) {
    nameOrTitle = "<span class='text-bold'>Current Tab: </span>" + nameOrTitle
  }
  return nameOrTitle
}

const dynamicNameOrTitleModel = (tab: Tab) => tab.name ? tab.name : tab.title

const setCustomTitle = (tab: Tab, newValue: string) =>
  useCommandExecutor().executeFromUi(new UpdateTabNameCommand(tab, newValue))

const copyToClipboard = (text: string) =>
  useCommandExecutor().executeFromUi(new CopyToClipboardCommand(text))

const hoveredOver = (tabsetId: string) => hoveredTab.value === tabsetId

const classForCategoryTab = (tab: Tab | undefined) => {
  if (!tab) {
    return ""
  }
  const url = tab.url
  if (url && useTabsetService().tabsetsFor(url).length > 0) {
    return "text-grey-5"
  }
  return ""
}

const formatDate = (timestamp: number | undefined) =>
  timestamp ? formatDistance(timestamp, new Date(), {addSuffix: true}) : ""

const isCurrentTab = (tab: Tab) => {
  //console.log("xxx", tabsStore.getCurrentTabset.tabs[0].chromeTab.url, tab.chromeTab.url)
  //return tabsStore.currentChromeTab.url === tab.url;
  const windowId = useWindowsStore().currentWindow.id || 0
  return (tabsStore.getCurrentChromeTab(windowId) || tabsStore.currentChromeTab).url === tab.url

}
</script>

<!--https://stackoverflow.com/questions/41078478/css-animated-checkmark -->
<style>

.checkmark__circle {
  stroke-dasharray: 66;
  stroke-dashoffset: 66;
  stroke-width: 2;
  stroke-miterlimit: 10;
  stroke: #8ACB88;
  fill: none;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.checkmark {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: block;
  stroke-width: 2;
  stroke: #fff;
  stroke-miterlimit: 10;
  margin: 10% auto;
  box-shadow: inset 0px 0px 0px #8ACB88;
  animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
}

.checkmark__check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

@keyframes stroke {
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes scale {
  0%, 100% {
    transform: none;
  }
  50% {
    transform: scale3d(1.1, 1.1, 1);
  }
}

@keyframes fill {
  100% {
    box-shadow: inset 0px 0px 0px 30px #8ACB88;
  }
}
</style>
