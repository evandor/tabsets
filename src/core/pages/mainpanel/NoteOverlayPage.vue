<template>
  <q-page style="border-bottom: 1px solid lightgrey">
    <div class="row fit" ref="navigationRef" style="border-bottom: 1px solid grey; background-color: white">
      <div class="col-6 text-body2 q-ma-xs text-body1">Tabsets Note</div>
      <div class="col-4" style="border: 0 solid green">
        <!--        {{ portName }}: {{ currentChromeTab?.url }}-->
      </div>
      <div class="col ellipsis text-caption q-mt-none q-mr-sm text-right">
        <q-icon name="close" @click="closeComment()" size="xs" class="cursor-pointer"></q-icon>
      </div>
    </div>
    <div class="row">
      <div class="col-12 q-ma-none q-pa-none">
        <!--        <q-editor v-model="editor" min-height="20rem" dense />-->

        <q-editor
          v-model="editor"
          flat
          dense
          style="height: 300px"
          content-class="bg-grey-2 fit"
          toolbar-text-color="primary"
          toolbar-toggle-color="yellow-8"
          toolbar-bg="white"
          :definitions="{
            save: {
              tip: 'Save your work',
              icon: 'save',
              label: 'Save',
              handler: saveWork,
            },
          }"
          :toolbar="[
            ['bold', 'italic', 'underline'],
            [
              {
                label: $q.lang.editor.formatting,
                icon: $q.iconSet.editor.formatting,
                list: 'no-icons',
                options: ['p', 'h3', 'h4', 'h5', 'h6', 'code'],
              },
            ],
            ['save'],
          ]" />

        <q-card flat bordered>
          <q-card-section>
            <pre style="white-space: pre-line">{{ editor }}</pre>
          </q-card-section>
        </q-card>

        <!--        <q-card flat bordered>-->
        <!--          <q-card-section v-html="editor" />-->
        <!--        </q-card>-->
        *{{ tab?.id }}
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import BexFunctions from 'src/core/communication/BexFunctions'
import { useUtils } from 'src/core/services/Utils'
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
const editor = ref<string>('')
const tab = ref<Tab | undefined>(undefined)

const props = defineProps<{ tabId: string }>()

const $q = useQuasar()
const route = useRoute()

const callerPortName = route.query.portName as string
console.log('route', route.query.portName)

// eslint-disable-next-line @typescript-eslint/no-misused-promises
watchEffect(async () => {
  const ts: [Tabset[], Tab | undefined] = useTabsetsStore().getParentChainForTabId(props.tabId)
  if (!ts[1]) {
    //console.log('****3 checking tab done** ---')
    tab.value = undefined
    return
  }
  tab.value = ts[1]
  editor.value = tab.value.note
})

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

// watchEffect(() => {
//   const tabInCurrentTs: Tab | undefined = tabAndTabsetIds.value
//     .filter((tabWithTsId: TabAndTabsetId) => tabWithTsId.tabsetId === currentTabset.value?.id)
//     .at(0)?.tab
//   if (!tabInCurrentTs) {
//     tab.value = undefined
//     return
//   }
//   tab.value = tabInCurrentTs
//   editor.value = tab.value.note
// })

const closeComment = () => {
  $q.bex.log('hier closeComment')
  //window.parent.document.getElementById('tabset-nav-iframe')?.height = '500px';
  BexFunctions.bexSendWithRetry($q, 'close-overlay', callerPortName, {
    name: 'note',
  })
  // $q.bex
  //   .send({
  //     event: 'close-comment-request',
  //     to: callerPortName,
  //   })
  //   .then((res: any) => console.log('got res', res))
}

const saveWork = () => {
  if (!tab.value?.id || !currentTabset.value) {
    $q.notify({
      message: 'Problem encountered',
      color: 'red-4',
    })
  }
  tab.value!.note = editor.value
  useTabsetsStore()
    .saveTabset(currentTabset.value!)
    .then(() => {
      sendMsg('refresh-store')
    })
  // $q.bex
  //   .send({
  //     event: 'save-comment-request',
  //     to: callerPortName,
  //     payload: { editor: editor.value },
  //   })
  //   .then((res: any) => {
  //     console.log('got res', res)
  $q.notify({
    message: 'Saved',
    color: 'green-4',
    textColor: 'white',
    icon: 'cloud_done',
  })
  //   })
}
</script>

<style scoped>
.html {
  background-color: green;
}
</style>
