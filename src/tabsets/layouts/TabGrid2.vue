<template>
  <!-- TabGrid2 -->
  <div class="row">
    <div class="col-2 text-center cursor-pointer" v-for="index in 6">
      {{ columns[index]?.title || '&nbsp;' }}
      <q-popup-edit v-if="columns[index]" v-model="columns[index].title" auto-save v-slot="scope">
        <q-input
          v-model="scope.value"
          dense
          autofocus
          counter
          @update:model-value="(val) => setColumn(index, val)"
          @keyup.enter="scope.set" />
      </q-popup-edit>
    </div>
  </div>

  <GridLayout
    v-model:layout="state2.layout"
    :col-num="6"
    :row-height="rowHeight"
    :is-draggable="state2.draggable"
    :is-resizable="false"
    :vertical-compact="false"
    :use-css-transforms="true">
    <GridItem
      v-for="(item, index) in state2.layout"
      :key="index"
      @moved="movedEvent"
      :static="item.static"
      :maxH="1"
      :maxW="1"
      :minW="1"
      :minH="1"
      :x="item.x"
      :y="item.y"
      :w="item.w"
      :h="item.h"
      :i="item.i">
      <TabGridWidget :tab="item.tab as Tab" :sharedById="props.tabset?.sharing.sharedById" />
      <q-badge
        v-if="newCommentIds.get(item.tab.id) && newCommentIds.get(item.tab.id)!.length > 0"
        color="accent"
        rounded
        floating>
        &nbsp;{{ newCommentIds.get(item.tab.id)?.length }}&nbsp;</q-badge
      >
      <q-menu touch-position context-menu v-if="inBexMode()">
        <q-list dense style="min-width: 100px">
          <q-item clickable v-close-popup @click="createThumbnail(item.tab, props.tabset)">
            <q-item-section>(re-)create thumbnail</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </GridItem>
  </GridLayout>
</template>

<script setup lang="ts">
import _ from 'lodash'
import AppEventDispatcher from 'src/app/AppEventDispatcher'
import { useUtils } from 'src/core/services/Utils'
import { useEventsServices } from 'src/events/services/EventsServices'
import { Tab, TabCoordinate } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { TabsetColumn } from 'src/tabsets/models/TabsetColumn'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import TabGridWidget from 'src/tabsets/widgets/TabGridWidget.vue'
import { useThumbnailsService } from 'src/thumbnails/services/ThumbnailsService'
import { onMounted, onUnmounted, PropType, reactive, ref, watch, watchEffect } from 'vue'
import { GridItem, GridLayout } from 'vue-grid-layout-v3'

type LayoutType = {
  tab: Tab
  x: number
  y: number
  w: number
  h: number
  i: string
  static: boolean
}
type StateType = { layout: LayoutType[]; draggable: boolean; resizable: boolean; index: number }

const { sendMsg, inBexMode } = useUtils()

const props = defineProps({
  tabs: { type: Array as PropType<Array<Tab>>, required: true },
  tabset: { type: Object as PropType<Tabset>, required: true },
  tabsetFolder: { type: Object as PropType<Tabset>, required: true },
  coordinatesIdentifier: { type: String, required: true },
})

const state2 = reactive<StateType>({
  layout: [],
  draggable: true,
  resizable: true,
  index: 0,
})

const emits = defineEmits(['wasClicked'])

const layout = ref<any[]>([])

let windowWidth = ref(window.innerWidth)
const rowHeight = ref(Math.round(window.innerWidth / 9))
const columns = ref<any[]>([
  { title: 'click to add title' },
  { title: ' ' },
  { title: ' ' },
  { title: ' ' },
  { title: ' ' },
  { title: ' ' },
])
const currentTabsetFolderId = ref<string | undefined>(undefined)
const newCommentIds = ref<Map<string, string[]>>(new Map())

const onWidthChange = () => (windowWidth.value = window.innerWidth)

onMounted(async () => {
  window.addEventListener('resize', onWidthChange)
  currentTabsetFolderId.value = await useTabsetsStore().getCurrentTabsetId()

  layout.value = []
  state2.layout = []
  let defForX = 0
  for (const t of props.tabs) {
    if (!t.coordinates) {
      t.coordinates = []
    }
    const griddata = {
      tab: t,
      x: getCoordinate(t, 'x', defForX++ % 6),
      y: getCoordinate(t, 'y', Math.floor(defForX / 6)),
      w: getCoordinate(t, 'w', 1),
      h: getCoordinate(t, 'h', 1),
      i: t.id,
      static: false,
    }
    //console.log(`===> x=${JSON.stringify(griddata)})`)
    layout.value.push(griddata)
    state2.layout.push(griddata)
  }
  if (props.tabset.id) {
    newCommentIds.value = new Map()
    props.tabset.tabs.forEach((tab: Tab) => {
      newCommentIds.value.set(tab.id, useEventsServices().listNewComments(props.tabset.id, tab))
    })
  }
})

onUnmounted(() => window.removeEventListener('resize', onWidthChange))

watchEffect(() => {
  rowHeight.value = Math.round(windowWidth.value / 9)
  console.log('rowHeight:', windowWidth.value, rowHeight.value)
})

function getCoordinate(t: Tab, ident: string, def: number) {
  if (!t.coordinates) {
    return def
  }
  const coordinates = _.find(t.coordinates, (c: TabCoordinate) => c.identifier === props.coordinatesIdentifier)
  return coordinates && coordinates.val && coordinates.val[ident as keyof object] >= 0
    ? coordinates.val[ident as keyof object]
    : def
}

watchEffect(() => {
  _.forEach(props.tabsetFolder?.columns, (c: TabsetColumn) => {
    if (c.id.startsWith('grid_')) {
      var index = parseInt(c.id.split('_')[1]!)
      if (index >= 0 && index <= 6) {
        columns.value[index] = { title: c.title }
      }
    }
  })
})

watch(
  () => useTabsetsStore().currentTabsetFolderId,
  (n: any, o: any) => {
    currentTabsetFolderId.value = n
    //console.log('=====>>>', currentTabsetFolderId.value, n, o)
  },
)

const setColumn = (i: number, v: any) => {
  console.log('setting column', i, v)
  const tsCol = new TabsetColumn('grid_' + i, v)
  columns.value[i].title = tsCol.title
  var newColumns = _.filter(props.tabsetFolder?.columns, (c: TabsetColumn) => c.id !== tsCol.id)
  newColumns.push(tsCol)
  props.tabsetFolder.columns = newColumns
  useTabsetsStore().saveTabset(props.tabsetFolder)
}

const movedEvent = (i: any, newX: any, newY: any) => {
  const msg = 'MOVED i=' + i + ', X=' + newX + ', Y=' + newY
  console.log(msg)
  const tab: Tab | undefined = _.find(props.tabs, (t: Tab) => t.id === i)
  if (tab) {
    if (!tab.coordinates) {
      tab.coordinates = []
    }
    const optionalGriddataIndex = _.findIndex(
      tab.coordinates,
      (c: TabCoordinate) => c.identifier === props.coordinatesIdentifier,
    )
    const gd: { [k: string]: any } =
      optionalGriddataIndex >= 0
        ? tab.coordinates.at(optionalGriddataIndex)
          ? tab.coordinates.at(optionalGriddataIndex)!.val
          : {}
        : {}
    gd['x'] = newX
    gd['y'] = newY
    if (optionalGriddataIndex < 0) {
      tab.coordinates.push(new TabCoordinate(props.coordinatesIdentifier, gd))
    }
    useTabsetsStore().saveTabset(props.tabset)
    sendMsg('tabsets.app.change.currentTabset', {})
  }
}

const createThumbnail = async (tab: Tab, tabset: Tabset) => {
  if (!tab || !tab.url) {
    return
  }
  const browserTabs = useTabsStore2().getChromeTabs as chrome.tabs.Tab[]
  console.log('checking for url', tab.url)
  const openTab: chrome.tabs.Tab | undefined = _.find(browserTabs, (bt: chrome.tabs.Tab) => bt.url === tab.url)
  const currentTab = await chrome.tabs.getCurrent()
  if (openTab) {
    console.log('found open tab', openTab.id)
    await chrome.tabs.update(openTab.id || 0, { active: true })
    useThumbnailsService().captureVisibleTab(tab.id, tabset.id, (tabId: string, tabsetId: string, dataUrl: string) => {
      AppEventDispatcher.dispatchEvent('capture-screenshot', {
        tabId: tabId,
        tabsetId: tabset.id,
        data: dataUrl,
      })
      if (currentTab) {
        setTimeout(() => {
          console.log('going back to ', currentTab.id)
          chrome.tabs.update(currentTab.id || 0, { active: true }).then(() => chrome.tabs.reload())
        }, 1000)
      }
    })
  } else {
    const newTab: chrome.tabs.Tab = await chrome.tabs.create({ url: tab.url })
    console.log('opened new tab...', newTab.id)
    setTimeout(() => {
      useThumbnailsService().captureVisibleTab(tab.id, '??', (tabId: string, tabsetId: string, dataUrl: string) => {
        AppEventDispatcher.dispatchEvent('capture-screenshot', {
          tabId: tabId,
          tabsetId: '????',
          data: dataUrl,
        })
      })
      setTimeout(() => {
        chrome.tabs.remove(newTab.id || 0).then(() => chrome.tabs.reload())
      }, 1000)
    }, 2000)
  }
}
</script>

<style scoped>
.vue-grid-layout {
}

.vue-grid-item:not(.vue-grid-placeholder) {
  border: 0 solid black;
}

.vue-grid-item .resizing {
  opacity: 0.9;
}

.vue-grid-item .static {
}

.vue-grid-item .text {
  font-size: 24px;
  text-align: center;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  height: 100%;
  width: 100%;
}

.vue-grid-item .no-drag {
  height: 100%;
  width: 100%;
}

.vue-grid-item .minMax {
  font-size: 12px;
}

.vue-grid-item .add {
  cursor: pointer;
}

.vue-draggable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  top: 0;
  left: 0;
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><circle cx='5' cy='5' r='5' fill='#999999'/></svg>")
    no-repeat;
  background-position: bottom right;
  padding: 0 8px 8px 0;
  background-repeat: no-repeat;
  background-origin: content-box;
  box-sizing: border-box;
  cursor: pointer;
}
</style>
