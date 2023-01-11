<template>

      <q-item-section avatar>

        <q-img
          class="rounded-borders" style="cursor: move"
          width="20px"
          height="20px"
          :src="getFaviconUrl(props.tab.chromeTab)">
          <q-tooltip>{{ props.tab.chromeTab?.id }} / {{ props.tab.id }}</q-tooltip>
        </q-img>

      </q-item-section>
      <q-item-section>
        <q-item-label>{{ props.tab.chromeTab?.title }}</q-item-label>
        <q-item-label caption>{{ props.tab.chromeTab?.url }}</q-item-label>
      </q-item-section>
      <q-item-section avatar>
        <q-icon name="launch" color="primary"
                @click.stop="NavigationService.openOrCreateTab(props.tab.chromeTab?.url )"></q-icon>
      </q-item-section>
      <!--      <q-item-section avatar>-->
      <!--        <q-icon name="close" @click.stop="closeTab(tab)"/>-->
      <!--      </q-item-section>-->


</template>

<script setup lang="ts">
import NavigationService from "src/services/NavigationService";
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {ref} from "vue";

const props = defineProps({
  tab: {
    type: Object,
    required: true
  },
  highlightUrl: {
    type: String,
    required: false
  }
})

const emits = defineEmits(['sendCaption'])

const line = ref(null);

// onMounted(() => {
//   if (line.value && line.value[0]) {
//     line.value[0].focus()
//   }
// })

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

function closeTab(tab: Tab) {
  NavigationService.closeTab(tab)
}

function cardStyle(tab: Tab) {
  const height = props.showActions ? "100px" : "66px"
  let borderColor = ""
  // if (TabStatus.CREATED === tab.status) {
  //   borderColor = "";
  // } else if (TabStatus.DELETED === tab.status) {
  //   borderColor = "border-color:#EF9A9A"
  // }
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
  return `height: ${height};max-height:${height}; min-height: ${height};${borderColor};${background}`
}

function isOpen(tab: Tab): boolean {
  //console.log("tabUrl", tab.chromeTab?.url);
  return TabsetService.isOpen(tab?.chromeTab?.url || '')
}

const setInfo = (tab: Tab) => {
  const parts = (tab.chromeTab?.url || '').split('?')
  if (parts.length > 1) {
    emits('sendCaption', parts[0] + "[... params omitted....]")
  } else if (parts.length === 1) {
    emits('sendCaption', parts[0].toString());
  }
}

const selectTab = (tab: Tab) => {
  console.log("tab selected", tab)

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
    return chromeTab.favIconUrl
  }
  return 'favicon-unknown-32x32.png'
}

</script>
