<template>
  <q-menu :offset="[0, 0]">
    <q-list dense style="min-width: 200px">
      <template v-for="l in actions">
        <template v-if="'context' in l">
          <component
            :key="l.component.name"
            :is="l.component"
            :tabset="props.tabset"
            :folder="props.folder"
            :currentChromeTab="props.currentChromeTab"
            :level="props.level"
            element="contextmenu" />
        </template>
      </template>
    </q-list>
  </q-menu>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { NoopAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/NoopAddUrlToTabsetHandler'
import { ComponentWithContext, TabActionMatcher } from 'src/tabsets/actionHandling/TabActionMatcher'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref, shallowRef, watchEffect } from 'vue'

const props = defineProps<{
  currentChromeTab: chrome.tabs.Tab
  tabset: Tabset
  folder?: Tabset
  level: 'root' | 'folder'
}>()

const emits = defineEmits(['toggleExpand', 'buttonClicked'])

const $q = useQuasar()

const currentTabsetId = ref<string | undefined>(undefined)
const actions = shallowRef<ComponentWithContext[]>([])

const handler = ref<TabActionMatcher>(new NoopAddUrlToTabsetHandler())

const { getHandler } = useActionHandlers($q)

watchEffect(() => {
  handler.value = getHandler(props.currentChromeTab.url, props.folder)
  actions.value = handler.value.actions(currentTabsetId.value, {
    tabset: props.tabset,
    folder: props.folder,
    level: 'folder',
    currentChromeTab: props.currentChromeTab,
    element: 'contextmenu',
  })
})

watchEffect(() => {
  useTabsetsStore()
    .getCurrentTabsetId()
    .then((tsId: string | undefined) => (currentTabsetId.value = tsId))
})

async function tabToUse(tab: Tab) {
  let useTab: Tab = tab
  if (tab.placeholders?.templateId) {
    const tabInfo = useTabsetsStore().getTabAndTabsetId(tab.placeholders?.templateId)
    if (tabInfo) {
      useTab = tabInfo.tab
      console.log('useTab', useTab, tab.placeholders?.templateId)
    }
  }
  return useTab
}
</script>
