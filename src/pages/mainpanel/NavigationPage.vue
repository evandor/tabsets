<template>
  <q-page style="border-bottom: 1px solid lightgrey">
    <template v-if="tab">
      <div class="row fit" ref="navigationRef" style="border: 0 solid red; background-color: white; min-height: 40px">
        <div class="col-2 text-body2 q-mt-sm q-ml-sm">
          <q-img src="/icons/favicon-32x32.png" height="16px" width="16px" />
          <span class="q-ml-sm">{{ currentTabset?.name }}</span>
          <q-icon v-if="indexInCurrentTabset() >= 0" name="check" class="q-ml-xs" color="positive">
            <q-tooltip class="tooltip-small" style="width: 280px" :display="1000"
              >contained in current Tabset, created {{ date.formatDate(tab?.created, 'DD.MM.YY') }}
            </q-tooltip>
          </q-icon>
        </div>
        <div class="col-7" style="border: 0 solid green">
          <!--        {{ portName }}: {{ currentChromeTab?.url }}-->
          <div class="row" style="border: 0 solid blue">
            <div class="col-1" :style="tags.length > 0 ? 'max-width: 17px; border: 0 solid orange' : 'padding-top:8px'">
              <div class="text-caption" :style="tags.length > 0 ? 'transform: rotate(90deg)' : ''">&nbsp;Tags</div>
            </div>
            <div class="col-5">
              <q-select
                input-class="q-ma-none q-pa-none"
                borderless
                dense
                options-dense
                v-model="tags"
                use-input
                use-chips
                multiple
                hide-dropdown-icon
                input-debounce="0"
                new-value-mode="add-unique"
                @update:model-value="(val) => updatedTags(val)" />
            </div>
            <div class="col-6"></div>
          </div>
        </div>
        <div class="col text-caption q-mt-sm q-mr-sm text-right" style="border: 0 solid orange">
          <!--        <q-icon-->
          <!--          name="o_mail"-->
          <!--          @click="share()"-->
          <!--          size="xs"-->
          <!--          class="cursor-pointer q-mr-sm"-->
          <!--          :color="tab && tab.note && tab.note.length >= 5 ? 'primary' : 'grey'">-->
          <!--          <q-tooltip :delay="1000">Mail</q-tooltip>-->
          <!--        </q-icon>-->
          <q-icon
            name="save"
            @click="save()"
            size="xs"
            class="cursor-pointer q-mr-sm"
            :color="tab && tab.note && tab.note.length >= 5 ? 'primary' : 'grey'">
            <q-tooltip :delay="1000">Save a snapshot of this page</q-tooltip>
          </q-icon>
          <q-icon
            name="edit_note"
            @click="openNote()"
            size="sm"
            class="cursor-pointer"
            :color="tab && tab.note && tab.note.length >= 5 ? 'primary' : 'grey'">
            <q-tooltip :delay="1000">Create or Edit Notes for this page</q-tooltip>
          </q-icon>
          <q-badge color="blue" class="q-ml-sm" style="width: 50px; height: 17px">
            <template v-slot:default>
              <div class="text-right fit" style="text-align: center">
                {{ tab?.activatedCount }}x
                <q-tooltip :delay="1000" anchor="center middle">Opened x times</q-tooltip>
              </div>
            </template>
          </q-badge>
          <q-badge color="blue" class="q-ml-sm" style="width: 50px; height: 17px" v-if="tab?.readingTime">
            <template v-slot:default>
              <div class="text-right fit" style="text-align: center">
                <q-icon name="o_schedule" color="white" />
                {{ formatReadingTime(tab?.readingTime) }}
                <q-tooltip :delay="1000" anchor="center middle">Cumulated Reading Time</q-tooltip>
              </div>
            </template>
          </q-badge>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="row fit" ref="navigationRef" style="border: 0 solid red; background-color: white; min-height: 40px">
        <div class="col-2 text-body2 q-mt-sm q-ml-sm">
          <q-img src="/icons/favicon-32x32.png" height="16px" width="16px" />
          <span class="q-ml-sm">{{ currentTabset?.name }}</span>
        </div>
        <div class="col-8 text-body2 q-mt-sm q-ml-sm"></div>
        <div class="col text-body2 q-mt-sm q-ml-sm text-right">
          <q-btn label="Add to Tabsets" color="primary" outline size="sm" class="q-mr-sm"></q-btn>
        </div>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { date, useQuasar } from 'quasar'
import BexFunctions from 'src/core/communication/BexFunctions'
import { useUtils } from 'src/core/services/Utils'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { Tab } from 'src/tabsets/models/Tab'
import { TabAndTabsetId } from 'src/tabsets/models/TabAndTabsetId'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const { formatReadingTime } = useUtils()

const portName = ref('---')
const currentSpace = ref('---')
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab | undefined>()
const navigationRef = ref<HTMLDivElement>(null as unknown as HTMLDivElement)
const tabAndTabsetIds = ref<TabAndTabsetId[]>([])
const large = ref(false)
const tab = ref<Tab | undefined>(undefined)
const tags = ref<string[]>([])

const $q = useQuasar()
const route = useRoute()
const { sendMsg } = useUtils()

const callerPortName = route.query.portName as string
// console.log('route', route.query.portName)

watchEffect(async () => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
})

watchEffect(() => {
  currentSpace.value = useSpacesStore().space?.label || ''
})

watchEffect(() => {
  currentChromeTab.value = useTabsStore2().currentChromeTab
  if (currentChromeTab.value?.url) {
    tabAndTabsetIds.value = useTabsetsStore().tabsForUrl(currentChromeTab.value.url)
  }
})

watchEffect(() => {
  //console.log('window height', window.innerHeight)
  if (navigationRef.value) {
    navigationRef.value.style.height = window.innerHeight + 'px'
  }
})

watchEffect(() => {
  portName.value = $q.bex.portName
})

watchEffect(() => {
  const tabInCurrentTs: Tab | undefined = tabAndTabsetIds.value
    .filter((tabWithTsId: TabAndTabsetId) => tabWithTsId.tabsetId === currentTabset.value?.id)
    .at(0)?.tab
  if (!tabInCurrentTs) {
    tab.value = undefined
    return
  }
  tab.value = tabInCurrentTs
  //console.log('got', tab.value.url, tab.value.tags.length)
  if (tab.value.tags.constructor === Array) {
    tags.value = [...new Set(tab.value.tags)]
    Tab.setTags(tab.value, tags.value)
  } else {
    tags.value = []
  }
})

const openNote = () => {
  large.value = !large.value
  //BexFunctions.bexSendWithRetry($q, 'open-comment-request', callerPortName)
  BexFunctions.bexSendWithRetry($q, 'open-viewport', callerPortName, {
    name: 'note',
    page: 'overlay/note',
    width: '350px',
    height: '450px',
  })
}

const save = () => {
  BexFunctions.bexSendWithRetry($q, 'open-viewport', callerPortName, {
    name: 'snapshots',
    page: 'overlay/snapshots',
    height: '200px',
    width: '290px',
  })
  // if (tab.value && tab.value.url) {
  //   useCommandExecutor().executeFromUi(new SaveMHtmlCommand(tab.value.id, tab.value.url))
  // }
}

const indexInCurrentTabset = () => {
  return tabAndTabsetIds.value
    .map((tabWithTsId: TabAndTabsetId) => tabWithTsId.tabsetId)
    .findIndex((tsId: string) => tsId === currentTabset.value?.id)
}

const updatedTags = (val: string[]) => {
  if (tab.value) {
    //console.log('updating tag', val, useTabsetsStore().getCurrentTabset)
    tab.value.tags = val
    useTabsetService()
      .saveCurrentTabset()
      .then(() => {
        sendMsg('refresh-store')
        // all those did not work:
        // chrome.runtime.sendMessage(null, { message: 'refresh-store' }, function (response) {
        //   console.log('refreshed store', response)
        // })
        // BexFunctions.bexSendWithRetry($q, 'reload-current-tabset', 'background')
        // useTabsetsStore().reloadTabset(currentTabset.value!.id)
      })
      .catch((err) => console.error(err))
  }
}

const share = () => {
  const text = encodeURIComponent(`Note: ${tab.value?.note}<br><br> Website: ${tab.value?.url}`)
  window.open(`mailto:?subject=${encodeURIComponent('Website: ' + tab.value?.url)}&body=${text}`)
}
</script>

<style scoped>
.html {
  background-color: green;
}
</style>
