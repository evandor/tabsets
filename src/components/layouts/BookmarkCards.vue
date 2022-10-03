<template>

  <div class="row items-start">
    <div v-for="tab in props.bookmarks"
         :key="tab.id"
         draggable="true"
         @dragstart="startDrag($event, tab)"
         class="col-xs-12 col-sm-4 col-md-3 col-lg-2 q-pa-xs">

      <q-card class="my-card" flat bordered :style="cardStyle(tab)" @mouseover="setInfo(tab)" @click="selectTab(tab)">

        <q-card-section class="q-pt-xs cursor-pointer bg-amber-1 text-black" style="width:100%;">
          <div class="row items-baseline">

            <!-- favicon -->
            <div class="col-2">
              <q-icon name="bookmark_border" size="24px"></q-icon>
            </div>

            <!-- title or name if given -->
            <div class="col-10 text-h6 ellipsis">
              {{ nameOrTitle(tab) }}
              <q-popup-edit :model-value="dynamicNameOrTitleModel(tab)" v-slot="scope"
                            @update:model-value="val => setCustomTitle( tab, val)">
                <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"/>
              </q-popup-edit>
              <q-tooltip>{{ tab.chromeTab.title }}</q-tooltip>
            </div>

          </div>


          <div class="text-subtitle2 ellipsis text-secondary">
            {{ getHost(tab.chromeTab?.url, true) }}
            <q-icon name="launch" color="secondary"
                    @click.stop="Navigation.openOrCreateTab(tab.chromeTab?.url )"></q-icon>
            <q-tooltip>
              {{ tab.chromeTab?.url }}
            </q-tooltip>
          </div>

        </q-card-section>


        <q-card-actions align="right">
          <q-btn flat round color="red" size="11px" icon="delete_outline" @click.stop="closeTab(tab)">
            <q-tooltip>Delete this tab from this list</q-tooltip>
          </q-btn>
        </q-card-actions>

      </q-card>
    </div>
  </div>


</template>

<script setup lang="ts">
import Navigation from "src/services/Navigation";
import {Tab, TabStatus} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {useNotificationsStore} from "stores/notificationsStore";

const props = defineProps({
  bookmarks: {
    type: Array,
    required: true
  },
  showActions: {
    type: Boolean,
    default: false
  }
})

const emits = defineEmits(['sendCaption'])

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
  if (tab?.selected) {
    borderColor = "border-color:#000066"
  }

  let background = ''
  if (tab?.isDuplicate) {
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

const getFaviconUrl = (chromeTab: chrome.tabs.Tab | undefined) => {
  if (chromeTab && chromeTab.favIconUrl && !chromeTab.favIconUrl.startsWith("chrome")) {
    //console.log("chromeTab.favIconUrl", chromeTab.favIconUrl)
    return chromeTab.favIconUrl
  }
  return ''
}

const nameOrTitle = (tab: Tab) => tab.name ? tab.name : tab.chromeTab?.title
const dynamicNameOrTitleModel = (tab: Tab) => tab.name ? tab.name : tab.chromeTab?.title

const startDrag = (evt: DragEvent, tab: Tab) => {
  //console.log("drag started", evt, tab.id)
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = 'move'
    evt.dataTransfer.effectAllowed = 'move'
    evt.dataTransfer.setData('text/plain', tab.id)
  }
}


</script>

<style lang="sass" scoped>
.my-card
  width: 100%
</style>
