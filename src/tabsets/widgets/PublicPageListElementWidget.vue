<template>
  <!-- left part: icon plus various -->
  <q-item-section
    v-if="useUiStore().listDetailLevelGreaterEqual('SOME', props.tabset?.details)"
    @mouseover="hoveredTab = tab.id"
    @mouseleave="hoveredTab = undefined"
    class="q-mr-sm q-mt-sm text-right"
    style="justify-content: start; width: 30px; max-width: 30px">
    <div class="bg-grey-3 q-pa-none" :style="iconStyle()">
      <transition name="fade" mode="out-in">
        <div v-if="newState" key="newState">
          <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20.8 20.8">
            <circle class="checkmark__circle" cx="10.4" cy="10.4" r="10" fill="none" />
            <path class="checkmark__check" fill="none" d="M5.64 10.88l2.84 2.88 6.68-6.72" />
          </svg>
        </div>
        <div v-else key="oldState" class="flex-center">
          <q-img
            v-if="props.tab.preview === TabPreview.THUMBNAIL"
            @dblclick="togglePreview()"
            :src="thumbnail"
            width="30px" />
          <TabFaviconWidget
            v-else
            style="margin: auto; display: block"
            @dblclick="togglePreview()"
            :preventDragAndDrop="true"
            :tab="props.tab"
            width="20px"
            height="20px" />
        </div>
      </transition>
    </div>
  </q-item-section>

  <!-- middle part: name, title, description, url && note -->
  <q-item-section
    class="q-mb-sm q-mt-sm q-mx-none q-pa-none"
    @mouseover="hoveredTab = tab.id"
    @mouseleave="hoveredTab = undefined">
    <!-- === name or title === -->
    <q-item-label @click.stop="gotoTab()">
      <div class="row">
        <div class="col-11 q-pr-lg cursor-pointer ellipsis">
          <span v-if="props.header" class="text-caption">{{ props.header }}<br /></span>

          <span v-if="props.tab?.extension === UrlExtension.NOTE" v-html="nameOrTitle(props.tab as Tab)" />
          <span v-else :class="TabService.isCurrentTab(props.tab) ? 'text-bold' : ''">
            <q-icon
              v-if="props.tab?.favorite && props.tab?.favorite !== TabFavorite.NONE"
              :color="props.tab.favorite === TabFavorite.TABSET ? 'warning' : 'positive'"
              name="star"
              class="q-ma-mone">
              <q-tooltip class="tooltip_small">This tab is marked as favorite</q-tooltip>
            </q-icon>
            {{ nameOrTitle(props.tab as Tab) }}
          </span>
        </div>
      </div>
    </q-item-label>

    <!-- === description === -->
    <template v-if="useUiStore().listDetailLevelGreaterEqual('SOME', props.tabset?.details)">
      <template v-if="props.tab?.extension !== UrlExtension.NOTE">
        <q-item-label
          class="ellipsis-2-lines text-body2 darkColors lightColors"
          :class="props.tab?.extension === UrlExtension.RSS ? 'ellipsis-3-lines' : 'ellipsis-2-lines'"
          @click.stop="gotoTab()">
          {{ props.tab.longDescription || props.tab.description }}
        </q-item-label>
      </template>
      <template v-else>
        <q-item-label class="ellipsis-2-lines text-grey-8" @click.stop="gotoTab()">
          {{ props.tab.description }}
        </q-item-label>
      </template>
    </template>

    <!-- === url(s) === -->
    <q-item-label
      style="width: 100%"
      v-if="props.tab?.url"
      caption
      class="ellipsis-2-lines text-accent q-pt-xs"
      @mouseover="showButtonsProp = true"
      @mouseleave="showButtonsProp = false">
      <div class="row q-ma-none">
        <div class="col-12 q-pr-lg q-mb-xs cursor-pointer" @click="gotoTab()">
          <template v-if="props.tab.extension !== UrlExtension.RSS">
            <short-url @click.stop="gotoTab()" :url="props.tab.url" :hostname-only="!useUiStore().showFullUrls" />
          </template>
        </div>
      </div>
    </q-item-label>
  </q-item-section>

  <!-- right part -->
</template>

<script setup lang="ts">
import ShortUrl from 'src/core/utils/ShortUrl.vue'
import { useEventsServices } from 'src/events/services/EventsServices'
import TabService from 'src/services/TabService'
import { useAuthStore } from 'src/stores/authStore'
import { Tab, TabFavorite, TabPreview, UrlExtension } from 'src/tabsets/models/Tab'
import { MonitoredTab, Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import TabFaviconWidget from 'src/tabsets/widgets/TabFaviconWidget.vue'
import { useThumbnailsService } from 'src/thumbnails/services/ThumbnailsService'
import { useUiStore } from 'src/ui/stores/uiStore'
import { onMounted, PropType, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  tab: { type: Object as PropType<Tab>, required: true },
  header: { type: String, required: false },
  type: { type: String, default: 'sidepanel' },
  showTabsets: { type: Boolean, default: false },
  tabset: { type: Object as PropType<Tabset>, required: false },
  tabsetId: { type: String, required: false },
})

const router = useRouter()

const showButtonsProp = ref<boolean>(false)
const thumbnail = ref<string | undefined>(undefined)
const hoveredTab = ref<string | undefined>(undefined)
const newState = ref(false)
const newCommentIds = ref<string[]>([])
const monitor = ref<MonitoredTab | undefined>(undefined)

onMounted(() => {
  if (new Date().getTime() - props.tab.created < 500) {
    newState.value = true
    const audio = document.getElementById('myAudio')
    if (audio) {
      // @ts-expect-error TODO
      audio.play()
    }
    setTimeout(() => (newState.value = false), 2000)
  }
  if (props.tabsetId) {
    newCommentIds.value = useEventsServices().listNewComments(props.tabsetId, props.tab)
  }
  monitor.value =
    props.tabset &&
    props.tabset.monitoredTabs &&
    props.tabset.monitoredTabs.find((mt: MonitoredTab) => mt.tabId === props.tab.id)
})

const thumbnailFor = async (tab: Tab): Promise<string> => {
  return useThumbnailsService().getThumbnailFor(tab.id, useAuthStore().user.uid)
}

watchEffect(() => {
  if (props.tab && props.tab.preview === TabPreview.THUMBNAIL) {
    thumbnailFor(props.tab)
      .then((tn: string) => {
        if (tn) {
          thumbnail.value = tn
        }
      })
      .catch((err) => {})
  }
})

const nameOrTitle = (tab: Tab) => (tab.name ? tab.name : tab.title)

const iconStyle = () => {
  if (TabService.isCurrentTab(props.tab)) {
    return 'border:1px solid #bfbfbf;border-radius:3px'
  } else {
    return 'border:0px solid white;border-radius:3px'
  }
}

const gotoTab = () => {
  console.log('hier', props.tab?.useInIframe)
  if (props.tab && (props.tab.useInIframe === undefined || props.tab.useInIframe)) {
    router.push('/p/tabs/' + props.tab.id)
    // useCommandExecutor().executeFromUi(new OpenTabCommand(props.tab))
  } else {
    open(props.tab.url)
  }
}

const togglePreview = () => {
  if (props.tab) {
    props.tab.preview =
      props.tab.preview === undefined || props.tab.preview === TabPreview.FAVICON
        ? TabPreview.THUMBNAIL
        : TabPreview.FAVICON
    useTabsetService().saveCurrentTabset()
  }
}
</script>
