<template>
  <q-card
    :data-testid="useUtils().createDataTestIdentifier('tabcardpending', tab.chromeTab.url)"
    class="my-card" bordered :style="cardStyle(tab)" @mouseover="setInfo(tab)" @click="selectTab(tab)">

    <q-card-section class="bg-grey-1 text-black cursor-pointer">

      <div class="row items-baseline">

        <!-- favicon -->
        <div class="col-2">
          <q-img
            class="rounded-borders"
            width="24px"
            height="24px"
            :src="getFaviconUrl(tab.chromeTab)">
            <q-tooltip v-if="featureToggles.isEnabled('debug')">{{ tab.chromeTab?.id }} / {{ tab.id }} /
              {{ tab.chromeTab.pinned }}
            </q-tooltip>
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

        <q-badge color="warning" v-if="tab.chromeTab.pinned" floating>
          <q-icon name="push_pin" size="16px" color="white">
            <q-tooltip>This tab is pinned</q-tooltip>
          </q-icon>
        </q-badge>

        <q-badge color="warning" v-if="tab.chromeTab.groupId !== -1" floating>
          <q-icon name="content_copy" size="16px" color="white">
            <q-tooltip>This tab is part of a group</q-tooltip>
          </q-icon>
        </q-badge>

      </div>


      <div class="text-subtitle2 ellipsis text-secondary">
        {{ tab.chromeTab?.url }}
        <q-icon name="launch" color="secondary"
                @click.stop="NavigationService.openOrCreateTab(tab.chromeTab?.url )"></q-icon>
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
          <q-btn flat round color="red" size="11px" icon="cancel" @click.stop="close(tab)">
            <q-tooltip>Remove this tab from this list</q-tooltip>
          </q-btn>
        </div>
      </div>

    </q-card-section>


  </q-card>


</template>

<script setup lang="ts">
import NavigationService from "src/services/NavigationService";
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {SavePendingTabToCurrentTabsetCommand} from "src/domain/commands/SavePendingTabToCurrentTabsetCommand";
import {useTabsetService} from "src/services/TabsetService2";
import {useUtils} from "src/services/Utils";

const {closeTab} = useTabsetService()

const props = defineProps({
  tab: {
    type: Tab,
    required: true
  }
})

const emits = defineEmits(['sendCaption', 'selectionChanged'])

const featureToggles = useFeatureTogglesStore()

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

function close(tab: Tab) {
  closeTab(tab)
}

function ignoreTab(tab: Tab) {
  console.log("ignoring tab", tab)
  TabsetService.ignoreTab(tab)
  closeTab(tab)
}

const saveTab = (tab: Tab) => useCommandExecutor().executeFromUi(new SavePendingTabToCurrentTabsetCommand(tab))


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
  const parts = (tab.chromeTab?.url || '').split('?')
  if (parts.length > 1) {
    emits('sendCaption', parts[0] + "[... params omitted....]")
  } else if (parts.length === 1) {
    emits('sendCaption', parts[0].toString());
  }
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
