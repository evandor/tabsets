<template>
  <!-- SidePanelOpenTabsListViewer -->
  <div class="row q-mt-xs">
    <div class="col-6 q-mt-sm q-mb-md">
      <template v-if="useTabsetsStore().tabsets.size > 1">
        <template v-if="viewContext != 'popup'">
          <div class="text-caption q-ml-sm">Reference Tabset:</div>
          <SidePanelTabsetsSelectorWidget
            :key="updated"
            :use-as-tabsets-switcher="true"
            @tabset-switched="updateTabs()" />
        </template>
        <template v-if="rows.length > 1">
          <q-checkbox
            v-model="currentWindowOnly"
            label="this window only"
            dense
            size="xs"
            color="text-grey-8"
            class="q-mt-sm q-ml-sm text-body2" />
        </template>
      </template>
    </div>
    <div class="col-6 text-right text-grey-8">
      <q-btn
        v-if="tabSelection.size > 0"
        @click.stop="createCollection()"
        size="sm"
        color="primary"
        outline
        class="q-mt-md"
        >Create Collection
      </q-btn>
    </div>
  </div>

  <div class="q-pa-none q-ma-none">
    <template v-if="currentWindowOnly">
      <div
        v-for="tab in tabsForCurrentWindow"
        class="q-my-none tabBorder q-mb-xs"
        :style="cardStyle(tab)"
        :key="(tab.id || tab.url || new Date().getTime()) + '_' + isSelected(tab)">
        <OpenTabCard2
          v-on:selectionChanged="tabSelectionChanged"
          v-on:addedToTabset="tabAddedToTabset"
          v-on:hasSelectable="hasSelectable"
          :selected="isSelected(tab)"
          :chromeTab="tab"
          :windowId="useWindowsStore().currentBrowserWindow?.id || 0"
          :useSelection="useSelection" />
      </div>
    </template>

    <template v-else>
      <q-expansion-item
        v-for="w in rows"
        default-opened
        dense-toggle
        expand-separator
        header-class="bg-grey-5"
        icon="o_grid_view"
        :label="'Window ' + w['name' as keyof object]"
        :caption="w['tabsCount' as keyof object] + ' tab(s)'">
        <div
          class="q-my-none tabBorder q-mb-xs"
          v-for="tab in filteredTabs(w['tabs' as keyof object] as chrome.tabs.Tab[])">
          <OpenTabCard2
            v-on:selectionChanged="tabSelectionChanged"
            v-on:addedToTabset="tabAddedToTabset"
            v-on:hasSelectable="hasSelectable"
            :chromeTab="tab"
            :windowId="w['id' as keyof object]"
            :useSelection="useSelection" />
        </div>
      </q-expansion-item>
    </template>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { date } from 'quasar'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import SidePanelTabsetsSelectorWidget from 'src/core/components/widgets/SidePanelTabsetsSelectorWidget.vue'
import { ViewContext } from 'src/core/models/ViewContext'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import Analytics from 'src/core/utils/google-analytics'
import OpenTabCard2 from 'src/opentabs/components/OpenTabCard2.vue'
import { CreateTabsetCommand } from 'src/tabsets/commands/CreateTabsetCommand'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'
import { Window } from 'src/windows/models/Window'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { onMounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

type Props = { filterTerm: string | undefined; viewContext?: ViewContext }

const props = withDefaults(defineProps<Props>(), {
  viewContext: 'default',
})

const emits = defineEmits(['tabSelectionChanged', 'filtered-tabs'])

const useSelection = ref(true)
const userCanSelect = ref(false)
const currentWindowOnly = ref(true)
const tabsForCurrentWindow = ref<chrome.tabs.Tab[]>([])

const tabSelection = ref<Set<string>>(new Set<string>())
const tabs = ref<chrome.tabs.Tab[]>([])
const filter = ref('')
const filterRef = ref(null)
const filteredTabsCount = ref(0)
const rows = ref<object[]>([])
const updated = ref<number>(new Date().getTime())

const router = useRouter()

onMounted(async () => {
  Analytics.firePageViewEvent('SidePanelOpenTabsListViewer', document.location.href)
  rows.value = await calcWindowRows()
  tabsForCurrentWindow.value = filteredTabs(useTabsStore2().browserTabs)
  emits('filtered-tabs', tabsForCurrentWindow.value.length)
})

// TODO use Windows Store
// eslint-disable-next-line @typescript-eslint/no-misused-promises
chrome.windows.onCreated.addListener(async (w: chrome.windows.Window) => (rows.value = await calcWindowRows()))
// eslint-disable-next-line @typescript-eslint/no-misused-promises
chrome.windows.onRemoved.addListener(async (wId: Number) => (rows.value = await calcWindowRows()))

const filteredTabs = (tabs: chrome.tabs.Tab[]): chrome.tabs.Tab[] => {
  function checkMatch(val: string | undefined): boolean {
    return !props.filterTerm || (val !== undefined && val.toLowerCase().indexOf(props.filterTerm.toLowerCase()) >= 0)
  }

  const res = tabs.filter((t: chrome.tabs.Tab) => {
    if (props.filterTerm) {
      return checkMatch(t.title) || checkMatch(t.url)
    }
    return true
  })
  filteredTabsCount.value = res.length
  return res
}

watchEffect(() => {
  tabsForCurrentWindow.value = filteredTabs(useTabsStore2().browserTabs)
  emits('filtered-tabs', tabsForCurrentWindow.value.length)
})

const updateTabs = () => {
  updated.value = new Date().getTime()
  tabsForCurrentWindow.value = filteredTabs(useTabsStore2().browserTabs)
  console.log('updating', tabsForCurrentWindow.value)
  emits('filtered-tabs', tabsForCurrentWindow.value.length)
}

watchEffect(() => {
  tabs.value = useTabsStore2().browserTabs
  const filterTerm = useUiStore().toolbarFilterTerm.toLowerCase()
  if (filterTerm.length > 0) {
    tabs.value = _.filter(
      tabs.value,
      (t: chrome.tabs.Tab) =>
        !!((t.url && t.url?.indexOf(filterTerm) >= 0) || (t.title && t.title.toLowerCase()?.indexOf(filterTerm) >= 0)),
    )
  }
})

watchEffect(() => {
  userCanSelect.value = false
})

const tabSelectionChanged = (a: any) => {
  const { tabId, selected } = a
  if (selected) {
    tabSelection.value.add('' + tabId)
  } else {
    tabSelection.value.delete('' + tabId)
  }
  emits('tabSelectionChanged', tabSelection.value)
  //console.log('tabsetlection', tabSelection.value)
}

const tabAddedToTabset = (a: any) => {
  const { tabId } = a
  tabSelection.value.delete(tabId)
}

const hasSelectable = () => (userCanSelect.value = true)

const resetFilter = () => {
  filter.value = ''
  if (filterRef.value) {
    // @ts-expect-error TODO
    filterRef.value.focus()
  }
}

const calcWindowRows = async () => {
  await useWindowsStore().refreshCurrentWindows('calcWindowRows')
  const result = _.map(
    useWindowsStore().currentBrowserWindows as chrome.windows.Window[],
    (cw: chrome.windows.Window) => {
      const windowFromStore: Window | undefined = useWindowsStore().windowForId(
        cw.id || -2,
        'SidePanelOpenTabsListViewer',
      )

      return {
        id: cw.id,
        index: windowFromStore?.index || 0,
        tabsCount: cw.tabs?.length || 0,
        tabs: cw.tabs,
        name: useWindowsStore().windowNameFor(cw.id || 0) || cw.id!.toString(),
        focused: cw.focused,
        state: cw.state,
        type: cw.type,
      }
    },
  )
  return result // _.sortBy(result, "index")
}

const cardStyle = (tab: chrome.tabs.Tab) => {
  let background = ''
  if (hasDuplicate(tab)) {
    background = 'background: radial-gradient(circle, #FFFFFF 0%, #FFECB3 100%)'
  }
  if (useTabsetService().urlExistsInCurrentTabset(tab.url || '')) {
    //background = 'background: #efefef'
  } else {
    // emits('hasSelectable', true)
  }
  return `${background}`
}

const hasDuplicate = (tab: chrome.tabs.Tab) => {
  const allCurrentTabs: chrome.tabs.Tab[] = (useWindowsStore().currentBrowserWindow?.tabs || []) as chrome.tabs.Tab[]
  return (
    _.filter(allCurrentTabs, (t: chrome.tabs.Tab) => {
      if (tab.url && t.url === tab.url) {
        return true
      }
      return false
    }).length > 1
  )
}

const invertSelection = () => {
  const oldSelection = tabSelection.value
  //console.log('inverting', currentWindowOnly.value)
  if (currentWindowOnly.value) {
    tabsForCurrentWindow.value.forEach((t: chrome.tabs.Tab) => {
      //console.log('checking', t.id)
      if (t.id) {
        if (oldSelection.has('' + t.id)) {
          tabSelection.value.delete('' + t.id)
        } else {
          tabSelection.value.add('' + t.id)
        }
      }
    })
  }
}

defineExpose({ invertSelection })

const isSelected = (tab: chrome.tabs.Tab) => tabSelection.value.has('' + tab.id)

const createCollection = () => {
  const tabsToUse: chrome.tabs.Tab[] = filteredTabs(useTabsStore2().browserTabs).filter((t: chrome.tabs.Tab) => {
    return !!(t.id && tabSelection.value.has('' + t.id))
  })
  useCommandExecutor()
    .executeFromUi(new CreateTabsetCommand('Collection ' + date.formatDate(new Date(), 'DD.MM.YYYY'), tabsToUse))
    .then((res: any) => {
      useUiStore().sidePanelSetActiveView(SidePanelViews.MAIN)
      router.push('/sidepanel?first=true')
    })
}

const toggleSelectionIcon = () => {
  if (tabSelection.value.size === 0) {
    return 'o_check_box'
  } else if (tabSelection.value.size === filteredTabs(useTabsStore2().browserTabs).length) {
    return 'o_check_box_outline_blank'
  }
  return 'o_published_with_changes'
}
</script>

<style lang="sass" scoped>

.tabBorder
  border-radius: 5px 5px 0 0
  border: 1px solid $lightgrey
  border-bottom: 0
</style>
