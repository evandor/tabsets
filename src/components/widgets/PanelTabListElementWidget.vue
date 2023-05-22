<template>

  <q-item-section v-if="useUiStore().listDetailLevelGreaterEqual(ListDetailLevel.MEDIUM)"
                  @mouseover="hoveredTab = tab.id"
                  @mouseleave="hoveredTab = undefined"
                  class="q-mr-sm text-right" style="justify-content:start;width:40px;max-width:40px">
    <q-img v-if="props.tab?.image && props.tab.image.startsWith('blob://')"
           style="border:3px dotted white;border-radius:3px"
           :src="imgFromBlob" width="40px"/>
    <q-img v-else-if="props.tab.image"
           style="border:1px dotted white;border-radius:3px"
           :src="props.tab.image" width="40px"/>
    <q-img v-else-if="thumbnail" style="border:1px dotted white;border-radius:3px"
           :src="thumbnail" width="40px"/>
    <TabFaviconWidget v-else
                      :tab="props.tab" width="40px" height="40px"/>
  </q-item-section>

  <!-- name, title, description, url && note -->
  <q-item-section class="q-mb-sm" :style="itemStyle(props.tab)"
                  @mouseover="hoveredTab = tab.id"
                  @mouseleave="hoveredTab = undefined">

    <!-- name or title -->
    <q-item-label>
      <div>
        <div class="q-pr-lg cursor-pointer ellipsis">
          <span v-if="props.header" class="text-bold">{{ props.header }}<br></span>
          {{ nameOrTitle(props.tab) }}
          <q-popup-edit :model-value="dynamicNameOrTitleModel(tab)" v-slot="scope"
                        @update:model-value="val => setCustomTitle( tab, val)">
            <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"/>
          </q-popup-edit>
        </div>

      </div>
    </q-item-label>

    <!-- description -->
    <q-item-label class="ellipsis-2-lines text-grey-8"
                  v-if="useUiStore().listDetailLevelGreaterEqual(ListDetailLevel.LARGE)">
      {{ props.tab.description }}
    </q-item-label>

    <!-- url -->
    <q-item-label
      v-if="props.tab.chromeTab?.url"
      caption class="ellipsis-2-lines text-blue-10"
      @mouseover="showButtonsProp = true"
      @mouseleave="showButtonsProp = false">
      <div class="q-pr-lg cursor-pointer" style="display: inline-block;"
           @click.stop="NavigationService.openOrCreateTab(props.tab.chromeTab?.url )">

        <span v-if="useTabsStore().getCurrentTabset?.sorting === 'alphabeticalUrl'">
          <q-icon name="arrow_right" size="16px"/>
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
    <q-item-label v-if="useUiStore().listDetailLevelGreaterEqual(ListDetailLevel.LARGE) && props['tab']['note']" class="text-grey-10" text-subtitle1>
      <q-icon color="blue-10" name="edit_note"/>
      {{ props['tab']['note'] }}
    </q-item-label>
  </q-item-section>

  <!--  <q-item-section class="q-mb-sm" style="width:30px;max-width:30px">-->
  <!--  +-->
  <!--  </q-item-section>-->

  <q-item-section class="text-right q-mx-sm cursor-pointer"
                  @mouseover="hoveredTab = tab.id"
                  @mouseleave="hoveredTab = undefined"
                  style="max-width:25px;font-size: 12px;color:#bfbfbf">
            <span v-if="hoveredOver(tab.id)">
              <q-icon name="more_horiz" color="primary" size="16px"/>
            </span>
    <span v-else>

            </span>
    <PanelTabListContextMenu :tab="tab"/>

    <!--    :index="index"-->
    <!--    :hoveredTab="hoveredTab"-->
    <!--    @toggleExpand="(index:number) => toggleExpand(index)"-->

  </q-item-section>

</template>

<script setup lang="ts">
import NavigationService from "src/services/NavigationService";
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {onMounted, ref, watchEffect} from "vue";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {DeleteTabCommand} from "src/domain/commands/DeleteTabCommand";
import {useQuasar} from "quasar";
import {ListDetailLevel, useUiStore} from "src/stores/uiStore";
import TabFaviconWidget from "components/widgets/TabFaviconWidget.vue";
import {UpdateTabNameCommand} from "src/domain/tabs/UpdateTabName";
import {CopyToClipboardCommand} from "src/domain/commands/CopyToClipboard";
import {useTabsetService} from "src/services/TabsetService2";
import ShortUrl from "components/utils/ShortUrl.vue";
import {useTabsStore} from "src/stores/tabsStore";
import PanelTabListContextMenu from "components/widgets/helper/PanelTabListContextMenu.vue";

const props = defineProps({
  tab: {type: Object, required: true},
  header: {type: String, required: false}
})

const emits = defineEmits(['sendCaption'])

const $q = useQuasar()

const line = ref(null)
const showButtonsProp = ref<boolean>(false)
const thumbnail = ref<string | undefined>(undefined)
const imgFromBlob = ref<string>("")
const hoveredTab = ref<string | undefined>(undefined)

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
  const notificationStore = useNotificationsStore()
  notificationStore.setSelectedTab(tab)
}


const getFaviconUrl = (chromeTab: chrome.tabs.Tab | undefined) => {
  if (chromeTab && chromeTab.favIconUrl && !chromeTab.favIconUrl.startsWith("chrome")) {
    return chromeTab.favIconUrl
  }
  return ''//'favicon-unknown-32x32.png'
}

const deleteTab = (tab: Tab) => useCommandExecutor().executeFromUi(new DeleteTabCommand(tab))


const nameOrTitle = (tab: Tab) => tab.name ? tab.name : tab.chromeTab?.title

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

const hoveredOver = (tabsetId: string) => hoveredTab.value === tabsetId


</script>
