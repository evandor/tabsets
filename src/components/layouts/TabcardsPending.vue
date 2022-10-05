<template>
  <div class="row items-start">
    <div class="col-xs-12 col-sm-4 col-md-3 col-lg-2 q-pa-xs" v-for="(tab,index) in tabsWithLimit()">
      <q-card class="my-card" bordered :style="cardStyle(tab)" @mouseover="setInfo(tab)" @click="selectTab(tab)">
        <q-card-section class="bg-grey-1 text-black cursor-pointer">

          <div class="row items-baseline">

            <!-- favicon -->
            <div class="col-2">
              <q-img
                class="rounded-borders"
                width="24px"
                height="24px"
                :src="getFaviconUrl(tab.chromeTab)">
                <q-tooltip>{{ tab.chromeTab?.id }} / {{ tab.id }}</q-tooltip>
              </q-img>
            </div>

            <!-- title or name if given -->
            <div class="col-10 text-subtitle1 text-black ellipsis">
              {{ nameOrTitle(tab) }}
              <q-popup-edit :model-value="dynamicNameOrTitleModel(tab)" v-slot="scope"
                            @update:model-value="val => setCustomTitle( tab, val)">
                <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"/>
              </q-popup-edit>
              <q-tooltip>{{ tab.chromeTab.title }}</q-tooltip>
            </div>

          </div>


          <div class="text-subtitle2 ellipsis text-secondary">
            {{ tab.chromeTab?.url }}
            <q-icon name="launch" color="secondary"
                    @click.stop="Navigation.openOrCreateTab(tab.chromeTab?.url )"></q-icon>
            <q-tooltip>
              {{ tab.chromeTab?.url }}
            </q-tooltip>
          </div>

          <div class="row fit">
            <div class="col-6">
              <q-checkbox
                v-model="tab.selected"
                size="30px"
                checked-icon="task_alt"
                @update:model-value="val => selectionChanged(val)"
                unchecked-icon="check_box_outline_blank"
              />
              <q-btn flat round color="positive" size="11px" icon="file_download" @click="saveTab(tab)">
                <q-tooltip>Save this tab to this tabset</q-tooltip>
              </q-btn>
            </div>
            <div class="col-6 text-right">
              <q-btn flat round color="warning" size="11px" icon="highlight_off" @click.stop="ignoreTab(tab)">
                <q-tooltip>Ignore the tab's url from now on</q-tooltip>
              </q-btn>
              <q-btn flat round color="red" size="11px" icon="delete_outline" @click.stop="closeTab(tab)">
                <q-tooltip>Delete this tab from this list</q-tooltip>
              </q-btn>
            </div>
          </div>

        </q-card-section>

      </q-card>
    </div>
    <div class="col-xs-12 col-sm-4 col-md-3 col-lg-2 q-pa-xs">
      <q-card class="my-card" bordered v-if="props.tabs.length >= 1+MAX_TABS_TO_SHOW">
        <q-card-section class="bg-grey-1 text-black cursor-pointer">

          <div class="row items-baseline">

            <!-- favicon -->
            <div class="col-2 text-body1">
              &gt;&gt;&gt;
            </div>

            <!-- title or name if given -->
            <div class="col-10 text-subtitle1 ellipsis">
              more tabs...
            </div>

          </div>


          <div class="text-subtitle2 ellipsis text-secondary">
            {{ 1 + props.tabs.length - MAX_TABS_TO_SHOW }} more tabs to show

          </div>

        </q-card-section>


        <q-card-actions>
          <div class="row fit">
            <div class="col-12 text-right">
              <q-btn flat round color="positive" icon="double_arrow">
                <q-tooltip>Show All</q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-card-actions>

      </q-card>
    </div>
  </div>


</template>

<script setup lang="ts">
import Navigation from "src/services/Navigation";
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {useNotificationsStore} from "stores/notificationsStore";
import {MAX_TABS_TO_SHOW} from 'boot/constants'

const props = defineProps({
  tabs: {
    type: Array,
    required: true
  }
})

const emits = defineEmits(['sendCaption', 'selectionChanged'])



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

function withoutHostname(url: string) {
  const splits = url?.split(getHost(url))
  if (splits?.length > 1) {
    return "..." + splits[1]
  }
  return "---"
}

function maxChar(max: number, t: string): string {
  if (t?.length > max - 3) {
    return t.substring(0, max - 3) + "..."
  }
  return t;
}


function closeTab(tab: Tab) {
  Navigation.closeTab(tab)
}

function ignoreTab(tab: Tab) {
  console.log("ignoring tab", tab)
  TabsetService.ignoreTab(tab)
  Navigation.closeTab(tab)
}

function saveTab(tab: Tab) {
  //console.log("saving tab", tab)
  TabsetService.saveToTabset(tab)
}

function togglePin(tabId: number) {
  console.log("toggling pin", tabId)
  TabsetService.togglePin(tabId)
}


function cardStyle(tab: Tab) {
  let borderColor = ""
  if (isOpen(tab)) {
    borderColor = "border-color:#8f8f8f"
  }
  if (tab.selected) {
    borderColor = "border-color:#000066"
  }

  let background = ''
  if (tab.isDuplicate) {
    background = "background: radial-gradient(circle, #FFFFFF 0%, #FFECB3 100%)"
  }
  // style=""
  return `${borderColor};${background}`
}

function isOpen(tab: Tab): boolean {
  //console.log("tabUrl", tab.chromeTab?.url);
  return TabsetService.isOpen(tab?.chromeTab?.url || '')
}

const setInfo = (tab: Tab) => {
  const notificationsStore = useNotificationsStore()
  const parts = (tab.chromeTab?.url || '').split('?')
  if (parts.length > 1) {
    emits('sendCaption', parts[0] + "[... params omitted....]")
  } else if (parts.length === 1) {
    emits('sendCaption', parts[0].toString());
  }
//  notificationsStore.setInfo(`created: ${date.formatDate(tab.created, 'DD.MM.YYYY HH:mm')}`)
}

const selectTab = (tab: Tab) => {
  //console.log("tab selected", tab)
  TabsetService.setOnlySelectedTab(tab)
  const notificationStore = useNotificationsStore()
  notificationStore.setSelectedTab(tab)
}

const setCustomTitle = (tab: Tab, newValue: string) => {
  console.log(" -> ", newValue)
  TabsetService.setCustomTitle(tab, newValue)
}

const nameOrTitle = (tab: Tab) => tab.name ? tab.name : tab.chromeTab?.title
const dynamicNameOrTitleModel = (tab: Tab) => tab.name ? tab.name : tab.chromeTab?.title

const selectionChanged = (val: any) => emits('selectionChanged', val)

const tabsWithLimit = () => {
  const allTabs = props.tabs
  if (allTabs.length > MAX_TABS_TO_SHOW) {
    const firstTabs = allTabs.slice(0, MAX_TABS_TO_SHOW - 1)
    //firstTabs.push(new Tab(uid(), null as unknown as chrome.tabs.Tab))
    return firstTabs
  }
  return allTabs
}

const getFaviconUrl = (chromeTab: chrome.tabs.Tab | undefined) => {
  if (chromeTab && chromeTab.favIconUrl && !chromeTab.favIconUrl.startsWith("chrome")) {
    return chromeTab.favIconUrl
  }
  return ''
}

</script>

<style lang="sass" scoped>
.my-card
  width: 100%
</style>
