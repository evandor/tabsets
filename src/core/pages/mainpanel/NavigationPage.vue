<template>
  <q-page style="border-bottom: 1px solid lightgrey">
    <template v-if="tab">
      <div class="row fit" ref="navigationRef" style="border: 0 solid red; background-color: white; min-height: 40px">
        <div class="col-2 text-body2 q-mt-sm q-ml-sm">
          <q-img src="/icons/favicon-32x32.png" height="16px" width="16px" />
          <span class="q-ml-sm">
            {{ rootTabset?.name }}
            <q-tooltip class="tooltip-small" :delay="1000">{{ rootTabsetTooltip() }}</q-tooltip>
          </span>
          <!--          <q-icon v-if="indexInCurrentTabset() >= 0" name="check" class="q-ml-xs" color="positive">-->
          <!--            <q-tooltip class="tooltip-small" style="width: 280px" :display="1000"-->
          <!--              >contained in current Tabset, created {{ date.formatDate(tab?.created, 'DD.MM.YY') }}-->
          <!--            </q-tooltip>-->
          <!--          </q-icon>-->
        </div>
        <div class="col-7" style="border: 0 solid green">
          <!--        {{ portName }}: {{ currentChromeTab?.url }}-->
          <div class="row" style="border: 0 solid blue">
            <div class="col-1" :style="tags.length > 0 ? 'max-width: 17px; border: 0 solid orange' : 'padding-top:8px'">
              <div class="text-caption" :style="tags.length > 0 ? 'transform: rotate(90deg)' : ''">&nbsp;Tags</div>
            </div>
            <div class="col-8" style="border: 0 solid green">
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
            <div class="col-3 text-right q-mt-sm cursor-pointer" @click="openHelpPage()">
              <q-badge v-if="badgeNotShownYet()" class="q-px-lg" align="middle" style="height: 20px"
                >where's this toolbar coming from?
              </q-badge>
            </div>
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
            v-if="showReadingMode()"
            name="o_menu_book"
            size="xs"
            class="cursor-pointer q-mr-sm"
            color="warning"
            @click.stop="showInReadingMode()">
            <q-tooltip :delay="1000">Open Reading Mode</q-tooltip>
          </q-icon>

          <template v-if="useFeaturesStore().hasFeature(FeatureIdent.SAVE_MHTML) && !pageCaptureInProgress">
            <span>
              <q-btn
                icon="save"
                @click="openSnapshotOverlay()"
                outline
                size="xs"
                class="cursor-pointer q-px-md q-mr-sm"
                color="primary">
                <q-tooltip :delay="1000">Save a snapshot of this page</q-tooltip>
                <q-badge v-if="snapshotsSize > 0" floating color="warning" size="xs" text-color="primary">{{
                  snapshotsSize
                }}</q-badge>
              </q-btn>
            </span>
          </template>
          <q-spinner
            v-if="useFeaturesStore().hasFeature(FeatureIdent.SAVE_MHTML) && pageCaptureInProgress"
            class="q-mr-sm"
            color="primary" />

          <q-btn
            icon="edit_note"
            @click="openNote()"
            outline
            size="xs"
            class="cursor-pointer q-px-md q-mr-sm"
            color="primary">
            <q-tooltip :delay="1000">Create or Edit Notes for this page</q-tooltip>
          </q-btn>

          <q-icon
            v-if="!badgeNotShownYet()"
            name="sym_o_help"
            @click="openHelpPage()"
            size="xs"
            class="cursor-pointer q-mr-sm"
            :color="tab && tab.note && tab.note.length >= 5 ? 'primary' : 'grey'">
          </q-icon>

          <q-badge color="blue" class="q-ml-sm" style="width: 50px; height: 17px">
            <template v-slot:default>
              <div class="text-right fit" style="text-align: center">
                {{ tab?.activatedCount }}x
                <q-tooltip class="tooltip-small" :delay="500" anchor="center left" self="center right"
                  >Opened x times
                </q-tooltip>
              </div>
            </template>
          </q-badge>
          <q-badge color="blue" class="q-ml-sm" style="width: 50px; height: 17px" v-if="tab?.readingTime">
            <template v-slot:default>
              <div class="text-right fit" style="text-align: center">
                <q-icon name="o_schedule" color="white" />
                {{ formatReadingTime(tab?.readingTime) }}
                <q-tooltip class="tooltip-small" :delay="500" anchor="center left" self="center right"
                  >Cumulated Reading Time
                </q-tooltip>
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
          <span class="q-ml-sm">{{ rootTabset?.name }}</span>
        </div>
        <div class="col-8 text-body2 q-mt-sm q-ml-sm"></div>
        <div class="col text-body2 q-mt-sm q-ml-sm text-right">
          <q-btn
            label="Add to Tabsets"
            color="primary"
            outline
            size="sm"
            class="q-mr-sm"
            @click="addToTabset()"></q-btn>
        </div>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { LocalStorage, uid, useQuasar } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { TabReferenceType } from 'src/content/models/TabReference'
import BexFunctions from 'src/core/communication/BexFunctions'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useUtils } from 'src/core/services/Utils'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useSnapshotsStore } from 'src/snapshots/stores/SnapshotsStore'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const { formatReadingTime } = useUtils()

const portName = ref('---')
const rootTabset = ref<Tabset | undefined>(undefined)
const navigationRef = ref<HTMLDivElement>(null as unknown as HTMLDivElement)
const large = ref(false)
const tab = ref<Tab | undefined>(undefined)
const parentChain = ref<[Tabset[], Tab | undefined]>([[] as Tabset[], undefined])
const tags = ref<string[]>([])
const pageCaptureInProgress = ref(false)
const snapshotsSize = ref(0)

const $q = useQuasar()
const route = useRoute()
const { sendMsg } = useUtils()

const callerPortName = route.query.portName as string

const currentTabId = LocalStorage.getItem('ui.currentTab.id') as string | undefined

const updateSnapshotSize = async () => {
  if (tab.value) {
    console.log('updateSnapshot', tab.value.id)
    const mds = await useSnapshotsStore().metadataFor(tab.value.id)
    snapshotsSize.value = mds.length
  }
}

watchEffect(() => {
  if (currentTabId && !tab.value) {
    parentChain.value = useTabsetsStore().getParentChainForTabId(currentTabId)
    if (!parentChain.value[1]) {
      tab.value = undefined
      return
    }
    tab.value = parentChain.value[1]
    rootTabset.value = parentChain.value[0][0]

    if (tab.value.tags.constructor === Array) {
      tags.value = [...new Set(tab.value.tags)]
      Tab.setTags(tab.value, tags.value)
    } else {
      tags.value = []
    }

    updateSnapshotSize()
  }
})

watchEffect(() => {
  portName.value = $q.bex.portName
})

watchEffect(() => {
  const loading = useUiStore().pageCaptureLoading
  console.log('loading', loading)
  pageCaptureInProgress.value = loading
  if (!loading) {
    console.log('hier')
    updateSnapshotSize()
  }
})

const openNote = () => {
  large.value = !large.value
  BexFunctions.bexSendWithRetry($q, 'open-viewport', callerPortName, {
    name: 'note',
    page: `overlay/note/${tab.value?.id}`,
    width: '350px',
    height: '450px',
  })
}

const openSnapshotOverlay = () => {
  BexFunctions.bexSendWithRetry($q, 'open-viewport', callerPortName, {
    name: 'snapshots',
    page: `overlay/snapshots/${tab.value?.id}`,
    height: '200px',
    width: '290px',
  })
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
        // chrome.runtime.sendMessage(null, { message: 'refresh-store' }, function (response) {...
        // BexFunctions.bexSendWithRetry($q, 'reload-current-tabset', 'background')
        // useTabsetsStore().reloadTabset(currentTabset.value!.id)
      })
      .catch((err) => console.error(err))
  }
}

const addToTabset = () => {
  console.log('save tabet')
  const currentTs = useTabsetsStore().getCurrentTabset
  if (currentTs) {
    chrome.tabs.getCurrent().then((chromeTab: chrome.tabs.Tab | undefined) => {
      console.log('save tabet', chromeTab)
      if (chromeTab) {
        const t = new Tab(uid(), chromeTab)
        useCommandExecutor()
          .execute(new AddTabToTabsetCommand(t, currentTs))
          .then((res: ExecutionResult<any>) => {
            tab.value = t
          })
          .catch((err: any) => console.error(err))
      }
    })
  }
}

const openHelpPage = () => {
  LocalStorage.setItem('ui.toolbar.info.badge.shown', true)
  useNavigationService().browserTabFor('https://docs.tabsets.net/tabsets-toolbar')
}

const badgeNotShownYet = () => !LocalStorage.getItem('ui.toolbar.info.badge.shown')

const rootTabsetTooltip = () =>
  'contained in Tabset ' + parentChain.value[0].map((tabset: Tabset) => tabset.name).join(' > ')

const showReadingMode = () => {
  if (tab.value) {
    const t: Tab = Object.assign(new Tab(tab.value.id, BrowserApi.createChromeTabObject('', '')), tab.value)
    console.log('checking reading mode', t)
    return useFeaturesStore().hasFeature(FeatureIdent.READING_MODE) && t.hasTabReference(TabReferenceType.READING_MODE)
  }
  return false
}

const showInReadingMode = () =>
  useNavigationService().browserTabFor(chrome.runtime.getURL(`/www/index.html#/mainpanel/readingmode/${tab.value?.id}`))
</script>

<style scoped>
.html {
  background-color: green;
}
</style>
