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
  <q-item-section class="q-mb-sm" :style="itemStyle(props.tab)">

    <!-- name or title -->
    <q-item-label>
      <div>
        <div class="q-pr-lg cursor-pointer ellipsis">
          {{ nameOrTitle(props.tab) }}
        </div>
      </div>
    </q-item-label>

    <!-- meta -->
    <q-item-label caption>
      <div class="row q-mx-sm q-mt-none">
        <div class="col-4 text-caption text-bold">created</div>
        <div class="col-8 text-right text-caption">{{ formatDate(props.tab.created) }}</div>
      </div>
      <div class="row q-mx-sm q-mt-none">
        <div class="col-4 text-caption text-bold">last active</div>
        <div class="col-8 text-right text-caption">{{ formatDate(props.tab.lastActive) }}</div>
      </div>
      <div class="row q-mx-sm q-mt-none">
        <div class="col-4 text-caption text-bold">#opened</div>
        <div class="col-8 text-right text-caption">{{ props.tab.activatedCount }}x</div>
      </div>
    </q-item-label>
  </q-item-section>

</template>

<script setup lang="ts">
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {onMounted, ref, watchEffect} from "vue";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {DeleteTabCommand} from "src/domain/tabs/DeleteTabCommand";
import {useQuasar} from "quasar";
import {ListDetailLevel, useUiStore} from "src/stores/uiStore";
import TabFaviconWidget from "components/widgets/TabFaviconWidget.vue";
import {useTabsetService} from "src/services/TabsetService2";
import {formatDistance} from "date-fns";

const props = defineProps({
  tab: {type: Object, required: true}
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

const isOpen = (tab: Tab): boolean => TabsetService.isOpen(tab?.url || '')

const setInfo = (tab: Tab) => {
  const parts = (tab.url || '').split('?')
  if (parts.length > 1) {
    emits('sendCaption', parts[0] + "[... params omitted....]")
  } else if (parts.length === 1) {
    emits('sendCaption', parts[0].toString());
  }
}

const getFaviconUrl = (chromeTab: chrome.tabs.Tab | undefined) => {
  if (chromeTab && .favIconUrl && !.favIconUrl.startsWith("chrome")) {
    return .favIconUrl
  }
  return ''//'favicon-unknown-32x32.png'
}

const deleteTab = (tab: Tab) => useCommandExecutor().executeFromUi(new DeleteTabCommand(tab))


const nameOrTitle = (tab: Tab) => tab.name ? tab.name : tab.title

const dynamicNameOrTitleModel = (tab: Tab) => tab.name ? tab.name : tab.title

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

const formatDate = (timestamp: number | undefined) =>
  timestamp ? formatDistance(timestamp, new Date(), {addSuffix: true}) : ""


</script>
