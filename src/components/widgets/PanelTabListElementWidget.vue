<template>

  <!-- left part: icon plus various -->
  <q-item-section v-if="useUiStore().listDetailLevelGreaterEqual(ListDetailLevel.SOME, props.tabset.details)"
                  @mouseover="hoveredTab = tab.id"
                  @mouseleave="hoveredTab = undefined"
                  class="q-mr-sm text-right" style="justify-content:start;width:25px;max-width:25px">
    <div class="bg-grey-3 q-pa-xs" :style="iconStyle()">

      <transition name="fade" mode="out-in">
        <div v-if="newState" key="newState">
          <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20.8 20.8">
            <circle class="checkmark__circle" cx="10.4" cy="10.4" r="10" fill="none"/>
            <path class="checkmark__check" fill="none" d="M5.64 10.88l2.84 2.88 6.68-6.72"/>
          </svg>
        </div>
        <div v-else key="oldState">
          <TabFaviconWidget
              :preventDragAndDrop="props.preventDragAndDrop"
              :tab="props.tab" width="16px" height="16px"/>
        </div>
      </transition>

    </div>
    <div v-if="props.tab?.httpInfo === 'UPDATED'"
         class="q-my-xs q-mx-none q-pa-none text-white bg-positive items-center justify-center"
         style="border-radius: 3px;max-height:15px;font-size:8px;text-align: center;">
      NEW
      <q-tooltip class="tooltip">This page indicates that its content has changed in the meantime.</q-tooltip>
    </div>
    <div v-else-if="props.tab?.httpStatus >= 300 && !props.tab?.placeholders"
         class="q-my-xs q-mx-none q-pa-none text-white items-center justify-center"
         :class="props.tab?.httpStatus >= 500 ? 'bg-red' : 'bg-warning'"
         style="border-radius: 3px;max-height:15px;font-size:8px;text-align: center;">
      {{ props.tab.httpStatus }}
      <q-tooltip class="tooltip">Tabsets has problems accessing this site.</q-tooltip>
    </div>

  </q-item-section>

  <!-- right part: name, title, description, url && note -->
  <q-item-section class="q-mb-sm"
                  @mouseover="hoveredTab = tab.id"
                  @mouseleave="hoveredTab = undefined">

    <!-- === name or title === -->
    <q-item-label @click.stop="gotoTab()">
      <div>
        <div class="q-pr-lg cursor-pointer ellipsis">
          <span v-if="props.header" class="text-bold">{{ props.header }}<br></span>
          <!--          <span v-if="useTabsStore().getCurrentTabset?.sorting === 'alphabeticalTitle'">-->
          <span v-if="props.sorting === TabSorting.TITLE">
              <q-icon name="arrow_right" size="16px"/>
           </span>

          <span v-if="props.tab?.extension === UrlExtension.NOTE"
                v-html="nameOrTitle(props.tab as Tab)"/>
          <span v-else :class="isCurrentTab(props.tab) ? 'text-bold':''">{{ nameOrTitle(props.tab as Tab) }}</span>

        </div>

      </div>
    </q-item-label>

    <!-- === description === -->
    <q-item-label class="ellipsis-2-lines text-grey-8"
                  v-if="useUiStore().listDetailLevelGreaterEqual(ListDetailLevel.MAXIMAL,props.tabset.details)"
                  @click.stop="gotoTab()">
      {{ props.tab.description }}
    </q-item-label>

    <!-- === url(s) === -->
    <q-item-label
        style="width:100%"
        v-if="props.tab?.url"
        caption class="ellipsis-2-lines text-blue-10"
        @mouseover="showButtonsProp = true"
        @mouseleave="showButtonsProp = false">
      <div class="row q-ma-none">
        <div class="col-11 q-pr-lg cursor-pointer" @click="gotoTab()">
           <span v-if="props.sorting === TabSorting.URL">
              <q-icon name="arrow_right" size="16px"/>
           </span>

          <template v-if="props.tab.extension !== UrlExtension.NOTE">
            <short-url @click.stop="gotoTab()"
                       :url="props.tab.url" :hostname-only="!useUiStore().showFullUrls"/>
            <q-icon v-if="props.tab.matcher && usePermissionsStore().hasFeature(FeatureIdent.ADVANCED_TAB_MANAGEMENT)"
                    @click.stop="openTabAssignmentPage(props.tab)"
                    name="o_settings">
              <q-tooltip class="tooltip">{{ matcherTooltip() }}</q-tooltip>
            </q-icon>
            <!-- <q-icon class="q-ml-xs" name="open_in_new"/>-->
            <ul v-if="placeholders.length > 0">
              <div v-for="placeholder in placeholders">
                <li>
                  <short-url
                      @click.stop="NavigationService.openOrCreateTab(
                          [placeholder['url' as keyof object]],
                          props.tab.matcher,
                          props.tab.groupName ? [props.tab.groupName] : [] )"
                      :label="placeholder['name' as keyof object]"
                      :url="placeholder['url' as keyof object]"/>
                </li>
              </div>
            </ul>
          </template>

        </div>
        <div v-if="!props.hideMenu"
             class="col text-right q-mx-sm cursor-pointer"
             @mouseover="hoveredTab = tab.id"
             @mouseleave="hoveredTab = undefined"
             style="max-width:25px;font-size: 12px;color:#bfbfbf">
            <span v-if="hoveredOver(tab.id)">
              <q-icon name="more_horiz" color="black" size="16px"/>
            </span>
          <span v-else>
              <q-icon color="primary" size="16px"/>
            </span>
          <PanelTabListContextMenu
              :tabset="props.tabset"
              :tab="tab" v-if="!props.hideMenu"/>

        </div>
      </div>

    </q-item-label>

    <!-- === group, last active & icons === -->
    <q-item-label
        style="width:100%;margin-top:0"
        v-if="props.tab?.url"
        caption class="ellipsis-2-lines text-blue-10"
        @mouseover="showButtonsProp = true"
        @mouseleave="showButtonsProp = false">
      <div class="row q-ma-none" @click="gotoTab()">
        <div class="col-12 q-pr-lg q-mt-none q-pt-none cursor-pointer">
          <div class="text-caption text-grey-5 ellipsis"
               v-if="useUiStore().listDetailLevelGreaterEqual(ListDetailLevel.SOME, props.tabset.details)">

            <span v-if="props.sorting === TabSorting.AGE">
              <q-icon name="arrow_right" size="16px"/>
            </span>

            <q-icon v-if="(props.tab as Tab).monitor"
                    @click.stop="monitoringDialog(props.tab as Tab)"
                    name="o_change_circle" class="q-mr-xs"
                    :color="(props.tab as Tab).placeholders ? 'negative' : 'accent'">
              <q-tooltip class="tooltip-small" v-if="!(props.tab as Tab).placeholders">This tab is being monitored for changes</q-tooltip>
              <q-tooltip class="tooltip-small" v-else>Tabs with placeholders cannot be monitored</q-tooltip>
            </q-icon>

            <q-icon v-if="suggestion"
                    @click.stop="showSuggestion()"
                    name="o_notifications" class="q-mr-xs" :color="suggestion.state === SuggestionState.NOTIFICATION ? 'negative' : 'accent'">
              <q-tooltip class="tooltip-small" v-if="suggestion.state === SuggestionState.NOTIFICATION">There is a new notification for this tab</q-tooltip>
              <q-tooltip class="tooltip-small" v-else>There is a notification for this tab</q-tooltip>
            </q-icon>

            <q-icon v-if="pngs.length > 0"
                    @click.stop="openImage()"
                    name="o_image" class="q-mr-xs" color="accent">
              <q-tooltip class="tooltip-small">There are snapshot images of this tab</q-tooltip>
            </q-icon>

            <q-icon v-if="(props.tab as Tab).placeholders"
                    name="published_with_changes" class="q-mr-xs" color="accent">
              <q-tooltip class="tooltip-small">This tab is created by substituting parts of its URL</q-tooltip>
            </q-icon>

            <q-icon v-if="(props.tab as Tab).annotations && (props.tab as Tab).annotations.length > 0"
                    name="feedback" class="q-mr-xs" color="warning">
              <q-tooltip class="tooltip-small">This tab has annotations</q-tooltip>
            </q-icon>

            <template v-if="(props.tab as Tab).monitor || suggestion || (props.tab as Tab).placeholders
                              || (props.tab as Tab).annotations && (props.tab as Tab).annotations.length > 0
                              || pngs.length > 0">
              <span>-</span>
            </template>

            <template v-if="groupName && usePermissionsStore().hasFeature(FeatureIdent.TAB_GROUPS)">
              Group <em>{{ groupName }}</em>
              <q-icon name="arrow_drop_down" class="q-mr-none" size="xs" color="text-grey-5"/>
              <q-menu :offset="[0,10]">
                <q-list dense>
                  <q-item v-if="groups.size > 1" class="text-grey-5" style="font-size: smaller">
                    Change group to...
                  </q-item>
                  <q-item clickable v-for="group in groupsWithout(groupName)"
                          @click="switchGroup(group)"
                          style="font-size: smaller">
                    ...{{ group.title }}
                  </q-item>
                  <q-separator v-if="groups.size > 1"/>
                  <q-item clickable style="font-size: smaller" @click="unsetGroup()">
                    Unset Group
                  </q-item>
                  <q-separator/>
                  <q-item clickable style="font-size: smaller" @click="removeGroup(groupName)">
                    Remove Group
                  </q-item>
                </q-list>
              </q-menu>
              -
            </template>

            {{ formatDate(props.tab.lastActive) }}

          </div>
        </div>
      </div>
    </q-item-label>

    <!-- === note === -->
    <q-item-label v-if="useUiStore().listDetailLevelGreaterEqual(ListDetailLevel.MAXIMAL, props.tabset.details) &&
      props['tab' as keyof object]['note']"
                  class="text-grey-10" text-subtitle1>
      <q-icon color="blue-10" name="edit_note"/>
      <div class="ellipsis-2-lines">
        {{ props['tab']['note'] }}
      </div>
    </q-item-label>

    <!-- === annotations === -->
    <q-item-label v-if="useUiStore().listDetailLevelGreaterEqual(ListDetailLevel.SOME, props.tabset.details) &&
      (props.tab as Tab).annotations && (props.tab as Tab).annotations.length > 0"
                  class="text-grey-10" text-subtitle1>
      <div class="row" v-for="a in (props.tab as Tab).annotations">
        <div class="col-10" @click="showAnnotation(props.tab as Tab, a)">{{ a.text }}</div>
        <div class="col-2 text-right">
          <q-icon name="delete" color="negative" @click="deleteAnnotation(props.tab as Tab, a)"/>
        </div>
      </div>
    </q-item-label>

    <!-- === badges === -->
    <q-item-label v-if="props.showTabsets">
      <template v-for="badge in tsBadges">
        <q-chip clickable @click.stop="openTabset(badge)"
                class="cursor-pointer q-ml-none q-mr-xs" size="9px" icon="tab">
          {{ badge['label' as keyof object] }}
        </q-chip>
      </template>
    </q-item-label>

  </q-item-section>

</template>

<script setup lang="ts">
import NavigationService from "src/services/NavigationService";
import {Tab, TabSorting, UrlExtension} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {onMounted, PropType, ref, watchEffect} from "vue";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {ListDetailLevel, useUiStore} from "src/stores/uiStore";
import TabFaviconWidget from "components/widgets/TabFaviconWidget.vue";
import {useTabsetService} from "src/services/TabsetService2";
import ShortUrl from "components/utils/ShortUrl.vue";
import {useTabsStore} from "src/stores/tabsStore";
import PanelTabListContextMenu from "components/widgets/helper/PanelTabListContextMenu.vue";
import _ from "lodash";
import {formatDistance} from "date-fns";
import {Tabset, TabsetType} from "src/models/Tabset";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {useUtils} from "src/services/Utils";
import {useRouter} from "vue-router";
import {useGroupsStore} from "stores/groupsStore";
import {DeleteChromeGroupCommand} from "src/domain/groups/DeleteChromeGroupCommand";
import {PlaceholdersType} from "src/models/Placeholders";
import {uid, useQuasar} from "quasar";
import MonitoringDialog from "components/dialogues/MonitoringDialog.vue";
import {useSuggestionsStore} from "stores/suggestionsStore";
import {Suggestion, SuggestionState} from "src/models/Suggestion";
import PdfService from "src/services/PdfService";
import {SavedBlob} from "src/models/SavedBlob";
// @ts-ignore
import rangy from "rangy/lib/rangy-core.js";
import "rangy/lib/rangy-serializer";

const {inBexMode, isCurrentTab} = useUtils()

const props = defineProps({
  tab: {type: Object as PropType<Tab>, required: true},
  header: {type: String, required: false},
  type: {type: String, default: 'sidepanel'},
  hideMenu: {type: Boolean, default: false},
  sorting: {type: String as PropType<TabSorting>, default: TabSorting.CUSTOM},
  showTabsets: {type: Boolean, default: false},
  preventDragAndDrop: {type: Boolean, default: false},
  tabset: {type: Object as PropType<Tabset>, required: true}
})

const $q = useQuasar()
const cnt = ref(0)
const router = useRouter()

const showButtonsProp = ref<boolean>(false)
//const imgFromBlob = ref<string>("")
const hoveredTab = ref<string | undefined>(undefined)
const tsBadges = ref<object[]>([])
const newState = ref(false)
const groupName = ref<string | undefined>(undefined)
const groups = ref<Map<string, chrome.tabGroups.TabGroup>>(new Map())
const placeholders = ref<Object[]>([])
const suggestion = ref<Suggestion | undefined>(undefined)
const pngs = ref<SavedBlob[]>([])

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
  // const blobImgPath = props.tab.image
  // if (blobImgPath && blobImgPath.startsWith('blob://')) {
  //   useTabsetService().getBlob(blobImgPath.replace("blob://", ""))
  //       .then((res) => {
  //         let reader = new FileReader();
  //         reader.readAsDataURL(res.content);
  //         reader.onloadend = function () {
  //           const base64data = reader.result;
  //           if (base64data) {
  //             imgFromBlob.value = base64data.toString()
  //           }
  //         }
  //       })
  //       .catch((err) => console.error(err))
  // }
})

watchEffect(() => {
  groups.value = useGroupsStore().tabGroups
})

watchEffect(() => {
  groupName.value = props.tab?.groupName
})

watchEffect(() => {
  if (props.tab.url) {
    suggestion.value = useSuggestionsStore().getSuggestionForUrl(props.tab.url)
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

watchEffect(() => {
  if (props.tab) {
    const t = props.tab
    if (t.placeholders && t.placeholders.type === PlaceholdersType.URL_SUBSTITUTION) {
      const subs = t.placeholders.config
      Object.entries(subs).forEach(e => {
        const name = e[0]
        const val = e[1]
        val.split(",").forEach((v: string) => {
          const substitution = v.trim()
          if (substitution.length > 0) {
            let useUrl = t.url || ''
            let useName = t.name || t.title || ''
            Object.entries(subs).forEach(e1 => {
              useUrl = useUrl.replaceAll("${" + name + "}", substitution)
              useName = useName.replaceAll("${" + name + "}", substitution)
            })
            placeholders.value.push({url: useUrl, name: substitution})
          }
        })
      })
    }
  }
})

watchEffect(async () => {
  if (props.tab) {
    pngs.value = await PdfService.getPngsForTab(props.tab.id)
  }
})

const nameOrTitle = (tab: Tab) => tab.name ? tab.name : tab.title

const hoveredOver = (tabsetId: string) => hoveredTab.value === tabsetId

const formatDate = (timestamp: number | undefined) =>
    timestamp ? formatDistance(timestamp, new Date(), {addSuffix: true}) : ""

const iconStyle = () => {
  if (isCurrentTab(props.tab)) {
    return "border:1px solid #bfbfbf;border-radius:3px"
  } else {
    return "border:0px solid white;border-radius:3px"
  }
}

const openTabset = (badge: any) => {
  console.log("clicked badge", badge)
  useTabsetService().selectTabset(badge.tabsetId)
  // @ts-ignore
  if (!inBexMode() || !chrome.sidePanel) {
    router.push("/tabsets/" + badge.tabsetId + "?highlight=" + badge.encodedUrl)
  } else {
    router.push("/sidepanel" + "?highlight=" + badge.encodedUrl)
  }
}

const openTabAssignmentPage = (tab: Tab) =>
    NavigationService.openOrCreateTab([chrome.runtime.getURL("/www/index.html#/mainpanel/tabAssignment/" + tab.id)])

const matcherTooltip = () => {
  const split = props.tab.matcher?.split("|")
  if (split && split.length > 1) {
    if (split[0] === 'sw') { // 'sw' = 'startsWith'
      return "This tab will open in any tab with an URL starting with " + split[1]
    }
  }
  return "This tab will open in any tab which url matches " + props.tab.matcher
}

const unsetGroup = () => {
  if (props.tab) {
    props.tab.groupName = undefined
    const res = useTabsStore().getTabAndTabsetId(props.tab.id)
        //.then((res: TabAndTabsetId | undefined) => {
          if (res) {
            const tab = res.tab
            const tabsetId = res.tabsetId
            tab.groupName = undefined
            tab.groupId = -1
            const ts = useTabsetService().getTabset(tabsetId)
            if (ts) {
              useTabsetService().saveTabset(ts)
            }
          }
       // })
  }
}

const removeGroup = (groupName: string) => {
  unsetGroup()
  if (props.tab && groupName) {
    useCommandExecutor().executeFromUi(new DeleteChromeGroupCommand(groupName))
  }
}

const groupsWithout = (groupName: string): chrome.tabGroups.TabGroup[] =>
    _.filter([...groups.value.values()], (g: chrome.tabGroups.TabGroup) => g.title !== groupName)

const switchGroup = (group: chrome.tabGroups.TabGroup): void => {
  if (props.tab) {
    props.tab.groupName = group.title
    const res = useTabsStore().getTabAndTabsetId(props.tab.id)
       // .then((res: TabAndTabsetId | undefined) => {
          if (res) {
            const tab = res.tab
            const tabsetId = res.tabsetId
            tab.groupName = group.title
            tab.groupId = group.id
            const ts = useTabsetService().getTabset(tabsetId)
            if (ts) {
              useTabsetService().saveTabset(ts)
            }
          }
       // })
  }
}

const gotoTab = () => NavigationService.openOrCreateTab(
    [props.tab.url || ''],
    props.tab.matcher,
    props.tab.groupName ? [props.tab.groupName] : [])

const showSuggestion = () => {
  const url = chrome.runtime.getURL('www/index.html') + "#/mainpanel/suggestions/" + suggestion.value?.id
  NavigationService.openOrCreateTab([url])
}

const monitoringDialog = (tab: Tab) => {
  console.log("calling dialog with tab", tab)
  $q.dialog({
    component: MonitoringDialog,
    componentProps: {tab: tab, note: tab.note}
  })
}

const openImage = () => window.open(chrome.runtime.getURL('www/index.html#/mainpanel/png/' + props.tab.id + "/" + pngs.value[0].id))

const deleteAnnotation = async (tab: Tab, annotationToDelete:any) => {
  //console.log("deleting annotatin", tab, annotationToDelete)
  tab.annotations = _.filter(tab.annotations, a => a.id !== annotationToDelete.id)
  useTabsetService().saveCurrentTabset()
}

const showAnnotation = async (tab: Tab, a:any) => {
  console.log("a!", a, tab.chromeTabId)

 // await $q.bex.send('highlight.content', { selector: '.div' })
  //$q.notify('Text has been highlighted')

  console.log("a!!", $q.bex)
  //await $q.bex.send('highlight.annotations', { selector: '.some-class' })
  //$q.notify('Text has been highlighted')
  //$q.bex.send('highlight.content', { selector: '.some-class' })
  console.log("done")
  const range: string = a['range']
  chrome.scripting.executeScript({
    target: {tabId: tab.chromeTabId || 0, allFrames: true},
    files: ['highlight-annotations.js']
     //args: [tab.chromeTabId || 0, range],
    // func: (tabId: number, rangeString: string) => {
    //   console.log("tabId", tabId, rangeString)
    //   const range = rangy.deserializeRange(rangeString)
    // }
  }, (result: any) => {
    console.log("result", result)
    //window.close()
  });
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
  box-shadow: inset 0 0 0 #8ACB88;
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
    box-shadow: inset 0 0 0 30px #8ACB88;
  }
}
</style>
