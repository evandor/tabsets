<template>

  <q-item-section avatar>

    <TabFaviconWidget :tab="props.tab" width="20px" height="20px"/>

  </q-item-section>
  <q-item-section :style="itemStyle(props.tab)"
                  :data-testid="useUtils().createDataTestIdentifier('tabListElementWidget', props.tab.chromeTab.title)"
                  class="cursor-pointer" @click.stop="NavigationService.openOrCreateTab(props.tab.chromeTab?.url )">
    <q-item-label>
      {{ props.tab.chromeTab?.title }}
      <q-badge v-if="isOpen(props.tab)" color="primary" label="opened" outline class="q-ml-sm"
               style="position: relative;top:-5px">
        <q-tooltip class="tooltip">This tab is currently open in your browser</q-tooltip>
      </q-badge>
      <q-badge v-if="props.tab.isDuplicate" color="warning" label="duplicate" outline class="q-ml-sm"
               style="position: relative;top:-5px">
        <q-tooltip class="tooltip">This tab has a duplicate inside this tabset and could be deleted</q-tooltip>
      </q-badge>
    </q-item-label>
    <q-item-label caption class="ellipsis-2-lines">{{ props.tab.chromeTab?.url }}</q-item-label>
    <q-item-label v-if="props.tab.note" class="text-grey-10" text-subtitle1>
      <q-icon color="blue-10" name="edit_note"/>
      {{ props.tab.note }}
    </q-item-label>
  </q-item-section>

  <q-item-section side v-if="props.showButtons">
    <div class="row">
      <q-btn flat round color="primary" size="11px" icon="o_info"
             @click.stop="showDetails(tab)">
        <q-tooltip class="tooltip">Show details about this tab</q-tooltip>
      </q-btn>
      <q-btn v-if="usePermissionsStore().hasFeature('newTab')"
        flat round color="primary" size="11px" icon="o_create_new_folder"
             @click.stop="addToNewTabUrlList(tab)">
        <q-tooltip class="tooltip">Add this tab to the list of tabs showing when you open a new tab in your browser</q-tooltip>
      </q-btn>
      <q-btn flat round :color="props.tab.note ? 'secondary':'primary'" size="11px" icon="edit_note"
             @click.stop="editNoteDialog(tab)">
        <q-tooltip v-if="props.tab.note">Edit note</q-tooltip>
        <q-tooltip v-else>Add a note to this tab</q-tooltip>
      </q-btn>
    </div>
  </q-item-section>
  <q-item-section side v-if="props.showButtons">

  </q-item-section>
  <q-item-section side v-if="props.showButtons">
    <q-btn flat round color="red" size="11px" icon="delete_outline" @click.stop="deleteTab(tab)">
      <q-tooltip>Delete this tab from this list</q-tooltip>
    </q-btn>
  </q-item-section>

</template>

<script setup lang="ts">
import NavigationService from "src/services/NavigationService";
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {ref} from "vue";
import {useUtils} from "src/services/Utils"
import {useCommandExecutor} from "src/services/CommandExecutor";
import {DeleteTabCommand} from "src/domain/commands/DeleteTabCommand";
import EditNoteDialog from "components/dialogues/EditNoteDialog.vue";
import {useQuasar} from "quasar";
import {DrawerTabs, useUiStore} from "stores/uiStore";
import {usePermissionsStore} from "stores/permissionsStore";
import TabFaviconWidget from "components/widgets/TabFaviconWidget.vue";

const props = defineProps({
  tab: {type: Object, required: true},
  showButtons: {type: Boolean, default: false},
  highlightUrl: {type: String, required: false}
})

const emits = defineEmits(['sendCaption'])

const $q = useQuasar()

const line = ref(null);

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
  if (tab.selected) {
    // borderColor = "border-color:#000066"
  }
  let background = ''
  if (tab.isDuplicate) {
    background = "background: radial-gradient(circle, #FFFFFF 0%, #FFECB3 100%)"
  }
  if (tab.chromeTab.url === props.highlightUrl) {
    border = "border: 1px dotted grey; padding:2px; border-radius:5px"
  }
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
  return ''//'favicon-unknown-32x32.png'
}

const deleteTab = (tab: Tab) => useCommandExecutor().executeFromUi(new DeleteTabCommand(tab))

const editNoteDialog = (tab: Tab) => $q.dialog({
  component: EditNoteDialog,
  componentProps: {tabId: tab.id, note: tab.note}
})

const showDetails = (tab: Tab) => {
  useUiStore().setSelectedTab(tab)
  useUiStore().rightDrawerSetActiveTab(DrawerTabs.TAB_DETAILS)
}

const addToNewTabUrlList = (tab: Tab) => {
  console.log("got tab", tab)
  useUiStore().addToNewTabUrlList({
    url: tab.chromeTab.url,
    title: tab.chromeTab.title,
    favIconUrl: tab.chromeTab.favIconUrl
  })
}

</script>
