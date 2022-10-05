<template>

  <q-list bordered separator>
    <!-- manual-focus :focused="selected === index" :active="selected === index" -->
    <q-item clickable v-ripple v-for="(tab,index) in props.tabs" @click="selectTab(tab, index)" autofocus>
      <q-item-section avatar>

          <q-img
            class="rounded-borders"
            width="20px"
            height="20px"
            :src="tab.chromeTab?.favIconUrl">
            <q-tooltip>{{ tab.chromeTab?.id }} / {{ tab.id }}</q-tooltip>
          </q-img>

      </q-item-section>
      <q-item-section>
        <q-item-label>{{ tab.chromeTab?.title }}</q-item-label>
        <q-item-label caption>{{ tab.chromeTab?.url }}</q-item-label>
      </q-item-section>
      <q-item-section avatar><q-icon name="launch" color="primary" @click.stop="Navigation.openOrCreateTab(tab.chromeTab?.url )"></q-icon></q-item-section>
      <q-item-section avatar><q-icon name="close" @click.stop="closeTab(tab)"/>      </q-item-section>
    </q-item>
  </q-list>


</template>

<script setup lang="ts">
import Navigation from "src/services/Navigation";
import {Tab, TabStatus} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {useNotificationsStore} from "stores/notificationsStore";
import {onMounted, ref, unref, watchEffect} from "vue";

const props = defineProps({
  tabs: {
    type: Array,
    required: true
  },
  showActions: {
    type: Boolean,
    default: false
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

function withoutHostname(url: string) {
  const splits = url?.split(getHost(url))
  if (splits?.length > 1) {
    return "..." + splits[1]
  }
  return "---"
}

function closeTab(tab: Tab) {
  Navigation.closeTab(tab)
}

function togglePin(tabId: number) {
  console.log("toggling pin", tabId)
  TabsetService.togglePin(tabId)
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
  const notificationsStore = useNotificationsStore()
  const parts = (tab.chromeTab?.url || '').split('?')
  if (parts.length > 1) {
    emits('sendCaption', parts[0] + "[... params omitted....]")
  } else if (parts.length === 1) {
    emits('sendCaption', parts[0].toString());
  }
//  notificationsStore.setInfo(`created: ${date.formatDate(tab.created, 'DD.MM.YYYY HH:mm')}`)
}

const selectTab = (tab: Tab, index: number) => {
  console.log("tab selected",  tab)

  TabsetService.setOnlySelectedTab(tab)
  const notificationStore = useNotificationsStore()
  notificationStore.setSelectedTab(tab)
}

const setCustomTitle = (tab: Tab, newValue: string) => {
  console.log(" -> ", newValue)
  TabsetService.setCustomTitle(tab, newValue)
}

const tabClicked = () => {
  console.log("clicked tab")
}

</script>
