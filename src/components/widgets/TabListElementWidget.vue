<template>

  <q-item-section class="q-mr-sm text-right" style="justify-content:start;width:70px;max-width:70px;">
    <q-img v-if="props.tab.image && props.tab.image.startsWith('blob://')"
           style="border:3px dotted white;border-radius:3px"
           :src="imgFromBlob" width="70px"/>
    <q-img v-else-if="props.tab.image"
           style="border:1px dotted white;border-radius:3px"
           :src="props.tab.image" width="70px"/>
    <q-img v-else-if="thumbnail" style="border:1px dotted white;border-radius:3px"
           :src="thumbnail" width="70px"/>
    <TabFaviconWidget v-else
                      :tab="props.tab" width="20px" height="20px" style="position: relative;left:30px;top:5px"/>
  </q-item-section>

  <!-- name, title, description, url && note -->
  <q-item-section :style="itemStyle(props.tab)"
                  :data-testid="useUtils().createDataTestIdentifier('tabListElementWidget', props.tab.chromeTab.title)">

    <!-- name or title -->
    <q-item-label>
      <div>
        <div class="q-pr-lg cursor-pointer" style="font-size: larger;line-height: 120%;">
          <q-chip v-if="isOpen(props.tab) && props.showIsOpened"
                  class="q-my-none q-py-none q-ml-none q-mr-sm"
                  clickable
                  style="float:left;position: relative;top:3px"
                  @click="NavigationService.openOrCreateTab(props.tab.chromeTab?.url)"
                  size="xs" icon="tab">
            opened
            <q-tooltip class="tooltip">This tab is open in your browser. Click to open the corresponding tab.
            </q-tooltip>
          </q-chip>
          <q-chip v-if="props.tab.isDuplicate"
                  class="q-my-none q-py-none q-ml-none q-mr-sm" color="warning"
                  clickable
                  style="float:left;position: relative;top:3px"
                  size="xs" icon="tab">
            duplicate
            <q-tooltip class="tooltip">This tab has a duplicate inside this tabset and could be deleted</q-tooltip>
          </q-chip>
          <span v-if="useTabsStore().getCurrentTabset?.sorting === 'alphabeticalTitle'">
            <q-icon name="arrow_right" size="16px" />
          </span>
          {{ nameOrTitle(props.tab) }}
          <q-popup-edit :model-value="dynamicNameOrTitleModel(tab)" v-slot="scope"
                        @update:model-value="val => setCustomTitle( tab, val)">
            <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"/>
          </q-popup-edit>
        </div>

      </div>
    </q-item-label>

    <!-- description -->
    <q-item-label class="ellipsis-2-lines text-grey-8">
      {{ props.tab.description }}
    </q-item-label>

    <!-- url -->
    <q-item-label
      v-if="props.tab.chromeTab.url"
      caption class="ellipsis-2-lines text-blue-10"
      @mouseover="showButtonsProp = true"
      @mouseleave="showButtonsProp = false">
      <div class="q-pr-lg cursor-pointer" style="display: inline-block;"
           @click.stop="NavigationService.openOrCreateTab(props.tab.chromeTab?.url )">

        <span v-if="useTabsStore().getCurrentTabset?.sorting === 'alphabeticalUrl'">
          <q-icon name="arrow_right" size="16px" />
        </span>
        <short-url :url="props.tab.chromeTab?.url" :hostname-only="true" />

        <q-icon class="q-ml-xs" name="open_in_new"/>
        <q-icon v-if="showButtonsProp"
                class="q-ml-md" name="content_copy"
                @click.stop="copyToClipboard(props.tab.chromeTab?.url)">
          <q-tooltip class="tooltip">Copy URL to clipboard</q-tooltip>
        </q-icon>
        <q-icon v-else class="q-ml-md"/>
      </div>
    </q-item-label>

    <!-- note -->
    <q-item-label v-if="props.tab.note" class="text-grey-10" text-subtitle1>
      <q-icon color="blue-10" name="edit_note"/>
      {{ props.tab.note }}
    </q-item-label>
  </q-item-section>

  <!-- new tab and edit note buttons -->
  <q-item-section side v-if="props.showButtons">
    <div class="row">
      <q-btn v-if="usePermissionsStore().hasFeature(FeatureIdent.NEW_TAB)"
             flat round color="primary" size="11px" icon="o_create_new_folder"
             @click.stop="addToNewTabUrlList(tab)">
        <q-tooltip class="tooltip">Add this tab to the list of tabs showing when you open a new tab in your browser
        </q-tooltip>
      </q-btn>
      <q-btn flat round :color="props.tab.note ? 'secondary':'primary'" size="11px" icon="edit_note"
             @click.stop="editNoteDialog(tab)">
        <q-tooltip v-if="props.tab.note">Edit note</q-tooltip>
        <q-tooltip v-else>Add a note to this tab</q-tooltip>
      </q-btn>
    </div>
  </q-item-section>
  <q-item-section side v-else>
    <div v-if="usePermissionsStore().hasFeature(FeatureIdent.NEW_TAB)"
         style="min-width:35px;">&nbsp;
    </div>
    <div style="min-width:35px;">&nbsp;</div>
  </q-item-section>

  <!-- Delete button -->
  <q-item-section side v-if="props.showButtons">
    <q-btn flat round color="red" size="11px" icon="delete_outline" @click.stop="deleteTab(tab)">
      <q-tooltip>Delete this tab from this list</q-tooltip>
    </q-btn>
  </q-item-section>
  <q-item-section side v-else>
    <q-btn flat round color="red" size="11px"/>
  </q-item-section>

</template>

<script setup lang="ts">
import NavigationService from "src/services/NavigationService";
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {onMounted, ref, watchEffect} from "vue";
import {useUtils} from "src/services/Utils"
import {useCommandExecutor} from "src/services/CommandExecutor";
import {DeleteTabCommand} from "src/domain/commands/DeleteTabCommand";
import EditNoteDialog from "components/dialogues/EditNoteDialog.vue";
import {useQuasar} from "quasar";
import {DrawerTabs, useUiStore} from "src/stores/uiStore";
import {usePermissionsStore} from "src/stores/permissionsStore";
import TabFaviconWidget from "components/widgets/TabFaviconWidget.vue";
import {UpdateTabNameCommand} from "src/domain/tabs/UpdateTabName";
import {FeatureIdent} from "src/models/AppFeature";
import {CopyToClipboardCommand} from "src/domain/commands/CopyToClipboard";
import {useTabsetService} from "src/services/TabsetService2";
import ShortUrl from "components/utils/ShortUrl.vue";
import {useTabsStore} from "src/stores/tabsStore";

const props = defineProps({
  tab: {type: Object, required: true},
  showButtons: {type: Boolean, default: false},
  showIsOpened: {type: Boolean, default: true},
  highlightUrl: {type: String, required: false}
})

const emits = defineEmits(['sendCaption'])

const $q = useQuasar()

const line = ref(null)
const showButtonsProp = ref<boolean>(false)
const thumbnail = ref<string | undefined>(undefined)
const imgFromBlob = ref<string>("")

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
  TabsetService.setOnlySelectedTab(tab)
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

const addToNewTabUrlList = (tab: Tab) => {
  console.log("got tab", tab)
  useUiStore().addToNewTabUrlList({
    url: tab.chromeTab.url,
    title: tab.chromeTab.title,
    favIconUrl: tab.chromeTab.favIconUrl
  })
}

const nameOrTitle = (tab: Tab) => {
  // if (tab.executionResult) {
  //   return tab.executionResult[0]['email' as keyof object] + " <img src='"+tab.executionResult[0]['picture' as keyof object]['medium' as keyof object]+"' />"
  // }
  return tab.name ? tab.name : tab.chromeTab?.title
}

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

</script>
