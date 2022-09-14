<template>

  <div class="row items-start">
    <div class="col-xs-12 col-sm-4 col-md-3 col-lg-2 q-pa-xs" v-for="tab in props.tabs">

      <q-card class="my-card" flat bordered :style="cardStyle(tab)" @mouseover="setInfo(tab)" @click="selectTab(tab)">
        <q-card-section horizontal>
          <q-card-section class="q-pt-xs cursor-pointer" style="width:100%;">
            <div class="row items-baseline">
              <div class="col-2">
                <q-img
                  class="rounded-borders"
                  width="20px"
                  height="20px"
                  :src="tab.chromeTab?.favIconUrl">
                  <q-tooltip>{{ tab.chromeTab?.id }} / {{ tab.id }}</q-tooltip>
                </q-img>
              </div>
              <div class="col-9 text-body2 ellipsis">
                {{ maxChar(20, tab.chromeTab?.title) }}
              </div>
              <div class="col-1">
                <q-icon name="close" @click="closeTab(tab)"/>
              </div>
              <q-tooltip>
                {{ getHost(tab.chromeTab?.url, true) }}
              </q-tooltip>
            </div>

            <div class="text-overline ellipsis">
              {{ getHost(tab.chromeTab?.url, true) }}
              <q-tooltip>
                {{ getHost(tab.chromeTab?.url, false) }}
              </q-tooltip>
            </div>

            <div class="text-caption text-grey wrap" style="overflow:hidden;">
              <q-item-label lines="1" class="q-mt-xs text-caption text-primary"
                            @click="Navigation.openOrCreateTab(tab.chromeTab?.url )">
                <span class="cursor-pointer">{{ maxChar(30, withoutHostname(tab.chromeTab?.url )) }}</span>
                <q-tooltip>
                  {{ tab.chromeTab?.url  }}
                </q-tooltip>
              </q-item-label>
            </div>

            <div class="row q-mt-md">

              <div class="col">
                <q-icon name="done" color="green" class="cursor-pointer q-mr-md" v-if="isOpen(tab)">
                  <q-tooltip>This url is open in one of your tabs</q-tooltip>
                </q-icon>

                <q-icon name="save" class="cursor-pointer q-mr-md"
                        v-if="tab.status !== TabStatus.DEFAULT"
                        @click="saveTab(tab)">
                  <q-tooltip>Save this tab to your current context</q-tooltip>
                </q-icon>

                <q-icon :name="tab.chromeTab?.pinned ? 'o_push_pin' : 'push_pin'" class="cursor-pointer"
                        @click="togglePin(tab.chromeTab.id)">
                  <q-tooltip v-text="tab.chromeTab?.pinned ? 'Unpin this tab' : 'Pin this tab'"/>
                </q-icon>

                <q-icon name="keyboard_arrow_left" class="cursor-pointer" v-if="tab.history?.length > 0">
                  <q-tooltip>{{tab.history}}</q-tooltip>

                </q-icon>
                <q-icon name="keyboard_arrow_right" class="cursor-pointer" v-if="tab.history?.length > 0">


                </q-icon>
              </div>
            </div>


            <!--            <div class="text-body1 q-mt-sm q-mb-xs">{{ maxChar(20, tab.chromeTab?.title || tab.title) }}</div>-->

          </q-card-section>

        </q-card-section>


      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import {date, LocalStorage} from "quasar";
import Navigation from "src/services/Navigation";
import {Tab, TabStatus} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {useNotificationsStore} from "stores/notificationsStore";

const props = defineProps({
  tabs: {
    type: Array,
    required: true
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
  console.log("saving tab", tab)
  TabsetService.saveToTabset(tab)
}

function togglePin(tabId: number) {
  console.log("toggling pin", tabId)
  TabsetService.togglePin(tabId)
}


function cardStyle(tab: Tab) {
  const height = "120px";
  let borderColor = ""
  if (TabStatus.CREATED === tab.status) {
    borderColor = "";
  } else if (TabStatus.DELETED === tab.status) {
    borderColor = "border-color:#EF9A9A"
  }
  if (tab.selected) {
    borderColor = "border-color:#000066"
  }

  let background = ''
  if (tab.isDuplicate) {
    background = "background: radial-gradient(circle, #FFFFFF 0%, #FFECB3 100%)"
  }
  // style=""
  return `height: ${height};max-height:${height}; min-height: ${height};${borderColor};${background}`
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
  console.log("tab selected", tab)
  TabsetService.setOnlySelectedTab(tab)
  const notificationStore = useNotificationsStore()
  notificationStore.setSelectedTab(tab)
}

</script>
