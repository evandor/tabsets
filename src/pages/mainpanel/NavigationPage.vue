<template>
  <q-page style="border-bottom: 1px solid lightgrey">
    <div class="row fit" ref="navigationRef" style="border: 0 solid red; background-color: white; min-height: 40px">
      <div class="col-2 text-body2 q-ma-xs">
        <q-img src="/icons/favicon-32x32.png" height="16px" width="16px" />
        {{ currentTabset?.name }}
        <q-icon v-if="indexInCurrentTabset() >= 0" name="check" color="positive">
          <q-tooltip class="tooltip-small">This tab is contained in the current Tabset</q-tooltip>
        </q-icon>
      </div>
      <div class="col-8" style="border: 0 solid green">
        <!--        {{ portName }}: {{ currentChromeTab?.url }}-->
        <div class="row" style="border: 0 solid blue">
          <div class="col-1" style="max-width: 17px; border: 0 solid orange">
            <div class="text-caption" style="transform: rotate(90deg)">&nbsp;Tags</div>
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
          <div class="col-6">
            <q-icon name="o_comment" @click="openComments()" class="rotate-90"></q-icon>
          </div>
        </div>
      </div>
      <div class="col ellipsis">{{ callerPortName }}</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { Tab } from 'src/tabsets/models/Tab'
import { TabAndTabsetId } from 'src/tabsets/models/TabAndTabsetId'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

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

watchEffect(() => {
  const tabInCurrentTs: Tab | undefined = tabAndTabsetIds.value
    .filter((tabWithTsId: TabAndTabsetId) => tabWithTsId.tabsetId === currentTabset.value?.id)
    .at(0)?.tab
  if (!tabInCurrentTs) {
    tab.value = undefined
    return
  }
  tab.value = tabInCurrentTs
  if (tab.value.tags.constructor === Array) {
    tags.value = [...new Set(tab.value.tags)]
    Tab.setTags(tab.value, tags.value)
  } else {
    tags.value = []
  }
})

const openComments = () => {
  large.value = !large.value
  $q.bex.log('hier', large.value)
  //window.parent.document.getElementById('tabset-nav-iframe')?.height = '500px';
  $q.bex.send({
    event: 'resize-frame-request',
    to: callerPortName,
    payload: { height: large.value ? '200px' : '62px' },
  })
}

const indexInCurrentTabset = () => {
  return tabAndTabsetIds.value
    .map((tabWithTsId: TabAndTabsetId) => tabWithTsId.tabsetId)
    .findIndex((tsId: string) => tsId === currentTabset.value?.id)
}

const updatedTags = (val: string[]) => {
  console.log('val', val)
  if (tab.value) {
    console.log('updating tag', val, useTabsetsStore().getCurrentTabset)
    tab.value.tags = val
    useTabsetService()
      .saveCurrentTabset()
      .catch((err) => console.error(err))
  }
}
</script>

<style scoped>
.html {
  background-color: green;
}
</style>
