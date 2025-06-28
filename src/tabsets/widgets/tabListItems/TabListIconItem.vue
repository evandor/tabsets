<template>
  <div class="q-pa-none column" style="border: 0 solid white; border-radius: 3px">
    <transition name="fade" mode="out-in" v-once>
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
        <!--        :preventDragAndDrop="props.preventDragAndDrop"-->
        <TabFaviconWidget
          v-else
          v-once
          style="margin: auto; display: block"
          @dblclick="togglePreview()"
          :tab="props.tab"
          width="20px"
          height="20px" />
      </div>
    </transition>
  </div>
  <template v-if="showDetailsForThreshold('SOME')">
    <div
      v-if="props.tab?.httpInfo === 'UPDATED'"
      class="q-my-xs q-mx-none q-pa-none text-white bg-positive items-center justify-center"
      style="border-radius: 3px; max-height: 15px; font-size: 8px; text-align: center">
      NEW
      <q-tooltip class="tooltip">This page indicates that its content has changed in the meantime.</q-tooltip>
    </div>
    <div
      v-else-if="(props.tab?.httpStatus >= 300 || props.tab?.httpStatus === 0) && !props.tab?.placeholders"
      class="q-my-xs q-mx-sm q-pa-none text-white items-center justify-center column"
      :class="props.tab?.httpStatus >= 500 ? 'bg-red' : 'bg-warning'"
      style="border-radius: 3px; max-height: 15px; font-size: 8px; text-align: center">
      {{ props.tab.httpStatus }}
      <q-tooltip class="tooltip">Tabsets has problems accessing this site.</q-tooltip>
    </div>
    <div v-if="props.tab.reminder || monitor" class="text-center">
      <q-icon v-if="props.tab.reminder" name="o_alarm" @click="openReminderDialog()" size="14px">
        <q-tooltip class="tooltip-small"
          >Reminder set to {{ date.formatDate(props.tab.reminder, 'DD.MM.YYYY') }}
          {{ props.tab.reminderComment ? ' - ' : '' }} {{ props.tab.reminderComment }}
        </q-tooltip>
      </q-icon>
      <q-icon
        v-if="monitor"
        :name="monitor.changed ? 'o_notifications_active' : 'o_notifications'"
        :color="monitor.changed ? 'negative' : ''"
        size="14px">
        <q-tooltip v-if="monitor.changed" class="tooltip-small"
          >Tab's content has changed at {{ date.formatDate(monitor.changed, 'DD.MM.YYYY') }}
        </q-tooltip>
        <q-tooltip v-else class="tooltip-small">Tab is being monitored for content changes</q-tooltip>
      </q-icon>
    </div>
  </template>
</template>

<script lang="ts" setup>
import { date, useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/authStore'
import ReminderDialog from 'src/tabsets/dialogues/ReminderDialog.vue'
import { Tab, TabPreview } from 'src/tabsets/models/Tab'
import { MonitoredTab, Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import TabFaviconWidget from 'src/tabsets/widgets/TabFaviconWidget.vue'
import { useThumbnailsService } from 'src/thumbnails/services/ThumbnailsService'
import { ListDetailLevel, useUiStore } from 'src/ui/stores/uiStore'
import { onMounted, ref, watchEffect } from 'vue'

const props = defineProps<{
  tabset: Tabset | undefined
  tab: Tab
  detailLevel: ListDetailLevel | undefined
  hideMenu?: boolean
}>()

const $q = useQuasar()

const newState = ref(false)
const monitor = ref<MonitoredTab | undefined>(undefined)
const thumbnail = ref<string | undefined>(undefined)

onMounted(() => {
  if (new Date().getTime() - props.tab.created < 500) {
    newState.value = true
    let playPromise: Promise<any> | undefined = undefined
    const audio = document.getElementById('myAudio')
    if (audio && !playPromise) {
      // @ts-expect-error TODO
      audio.play().catch((err) => {})
    }
    setTimeout(() => (newState.value = false), 2000)
  }
  // if (props.tabsetId) {
  //   newCommentIds.value = useEventsServices().listNewComments(props.tabsetId, props.tab)
  // }
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
      .catch((err) => {
        //console.log("could not get thumbnail for ", props.tab)
      })
  }
})

const showDetailsForThreshold = (level: ListDetailLevel) =>
  useUiStore().listDetailLevelGreaterEqual(level, props.tabset?.details, props.detailLevel)

const openReminderDialog = () =>
  $q.dialog({
    component: ReminderDialog,
    componentProps: { tabId: props.tab.id, date: props.tab.reminder, comment: props.tab?.reminderComment },
  })

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

<style lang="scss" src="src/tabsets/widgets/tabListItems/css/tabListIconItem.scss" />
