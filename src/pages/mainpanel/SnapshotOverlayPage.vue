<template>
  <q-page style="border-bottom: 1px solid lightgrey">
    <div class="row fit" ref="navigationRef" style="border-bottom: 1px solid grey; background-color: white">
      <div class="col-6 text-body2 q-ma-xs text-body1">Snapshots</div>
      <div class="col-4" style="border: 0 solid green">
        <!--        {{ portName }}: {{ currentChromeTab?.url }}-->
      </div>
      <div class="col ellipsis text-caption q-mt-none q-mr-sm text-right">
        <q-icon name="close" @click="closeComment()" size="xs" class="cursor-pointer"></q-icon>
      </div>
    </div>
    <div class="row q-ma-sm text-right cursor-pointer">
      <div class="col-12 q-ma-none q-pa-none text-caption" @click="save()">create new Snapshot of Page</div>
    </div>
    <div class="row q-ma-sm q-pa-none">
      <div class="col-12 q-ma-none q-pa-none text-caption" @click="openSnapshot(md)" v-for="md in mds">
        <SnapshotViewHelper :snapshotId="md.id" :created="md.created" :extension="md.type" />
      </div>
    </div>
    <!--    <div class="row">-->
    <!--      <div class="col-12 q-ma-none q-pa-none">*{{ tab?.id }}</div>-->
    <!--    </div>-->
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import BexFunctions from 'src/core/communication/BexFunctions'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUtils } from 'src/core/services/Utils'
import SnapshotViewHelper from 'src/pages/sidepanel/helper/SnapshotViewHelper.vue'
import { SaveMHtmlCommand } from 'src/snapshots/commands/SaveMHtmlCommand'
import { BlobMetadata } from 'src/snapshots/models/BlobMetadata'
import { useSnapshotsStore } from 'src/snapshots/stores/SnapshotsStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { Tab } from 'src/tabsets/models/Tab'
import { TabAndTabsetId } from 'src/tabsets/models/TabAndTabsetId'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const { sendMsg } = useUtils()

const portName = ref('---')
const currentSpace = ref('---')
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab | undefined>()
const navigationRef = ref<HTMLDivElement>(null as unknown as HTMLDivElement)
const tabAndTabsetIds = ref<TabAndTabsetId[]>([])
const tab = ref<Tab | undefined>(undefined)
const mds = ref<BlobMetadata[]>([])

const $q = useQuasar()
const route = useRoute()

const callerPortName = route.query.portName as string
console.log('route', route.query.portName)

watchEffect(() => {
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
  console.log('window height', window.innerHeight)
  if (navigationRef.value) {
    navigationRef.value.style.height = window.innerHeight + 'px'
  }
})

watchEffect(() => {
  portName.value = $q.bex.portName
})

watchEffect(async () => {
  const tabInCurrentTs: Tab | undefined = tabAndTabsetIds.value
    .filter((tabWithTsId: TabAndTabsetId) => tabWithTsId.tabsetId === currentTabset.value?.id)
    .at(0)?.tab
  if (!tabInCurrentTs) {
    tab.value = undefined
    return
  }
  tab.value = tabInCurrentTs
  mds.value = await useSnapshotsStore().metadataFor(tab.value.id)
  console.log('got', mds.value)
})

const closeComment = () => {
  $q.bex.log('hier closeComment')
  //window.parent.document.getElementById('tabset-nav-iframe')?.height = '500px';
  //BexFunctions.bexSendWithRetry($q, 'close-comment-request', callerPortName)
  BexFunctions.bexSendWithRetry($q, 'close-overlay', callerPortName, {
    name: 'snapshots',
  })
  // $q.bex
  //   .send({
  //     event: 'close-comment-request',
  //     to: callerPortName,
  //   })
  //   .then((res: any) => console.log('got res', res))
}

const save = () => {
  if (tab.value?.id && tab.value.url) {
    useCommandExecutor().executeFromUi(new SaveMHtmlCommand(tab.value.id, tab.value.url))
  }
}

const openSnapshot = (md: BlobMetadata) => {}
</script>

<style scoped>
.html {
  background-color: green;
}
</style>
