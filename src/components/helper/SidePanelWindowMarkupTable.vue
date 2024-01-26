<template>
  <div class="col-12 text-right">

    <Transition name="bounceInLeft" appear>

      <q-markup-table class="q-ma-none" dense flat>
        <tr>
          <th class="text-left" style="border-bottom: 1px solid #efefef">Window Name (editable)</th>
          <th class="text-right" style="border-bottom: 1px solid #efefef">#Tabs</th>
          <th class="text-right" style="border-bottom: 1px solid #efefef">Actions</th>
        </tr>

        <vue-draggable-next
          class="q-ma-none"
          tag="tbody"
          :list="rows"
          :group="{ name: 'tabs', pull: 'clone' }"
          @change="(event:any) => handleDragAndDrop(event)">
          <tr v-for="row in rows" style="max-height:15px">
<!--            <td>{{ row['index' as keyof object] }}</td>-->
            <td class="text-left" :class="row['focused' as keyof object] ? 'text-bold':''" style="cursor:move">
              {{ row['name' as keyof object] }}
              <q-popup-edit v-model="row['name' as keyof object]" v-slot="scope">
                <q-input v-model="scope.value" dense autofocus counter
                         @update:model-value="(val:any) => setWindowName(row, val)"
                         @keyup.enter="scope.set"/>
              </q-popup-edit>
            </td>
            <td>
              {{ row['tabsCount' as keyof object] }}
            </td>
            <td>
              <q-icon name="open_in_new"
                      class="q-ml-sm"
                      :class="useWindowsStore().currentWindow?.id === row['id' as keyof object] ? 'text-grey' : 'text-blue-8 cursor-pointer'"
                      @click="openWindow(row['id' as keyof object])">
                <q-tooltip :delay=500 class="tooltip-small">Open this window</q-tooltip>
              </q-icon>
              <q-icon name="o_close"
                      class="q-ml-sm text-red-8 cursor-pointer"
                      @click="closeWindow(row['id' as keyof object])">
                <q-tooltip :delay=500 class="tooltip-small">Close this window</q-tooltip>
              </q-icon>
            </td>
          </tr>
        </vue-draggable-next>
      </q-markup-table>


    </Transition>

  </div>
</template>

<script lang="ts" setup>

import {useWindowsStore} from "stores/windowsStore";
import {onMounted, ref, watch, watchEffect} from "vue";
import {Window} from "src/models/Window"
import _ from "lodash";
import {LocalStorage, QTable} from "quasar";
import {VueDraggableNext} from 'vue-draggable-next'

const columns = [
  {name: 'index', field: 'index', label: '#', align: 'left', sortable: false},
  {name: 'name', field: 'name', required: true, label: 'Window Name (editable)', align: 'left', sortable: false},
  {name: 'state', field: 'state', label: 'State', align: 'left', sortable: false},
  {name: 'tabsCount', field: 'tabsCount', required: true, label: '#Tabs', align: 'right', sortable: false},
  {name: 'windowAction', align: 'center', label: 'Actions', field: 'windowAction', sortable: false}
]

const rows = ref<object[]>([])
const currentWindowName = ref('---')
const tableRef = ref<QTable>(null as unknown as QTable)

onMounted(() => {
  rows.value = calcWindowRows()
})

watch(() => useWindowsStore().currentWindows, (newWindows, oldWindows) => {
  console.log("windows changed", newWindows, oldWindows)
  rows.value = calcWindowRows()
})

watchEffect(() => {
  const res = useWindowsStore().currentWindow && useWindowsStore().currentWindow.id ?
    useWindowsStore().windowNameFor(useWindowsStore().currentWindow.id || 0) || 'n/a' :
    'n/a'
  currentWindowName.value = res
})

const openWindow = (windowId: number) => {
  if (useWindowsStore().currentWindow?.id !== windowId) {
    chrome.windows.update(windowId, {drawAttention: true, focused: true},
      (callback) => {
      })
  }
}

const hideWindow = (windowId: number) => {
  chrome.windows.update(windowId, {state: "minimized"})
  useWindowsStore().refreshCurrentWindows()
}

const restoreWindow = (windowId: number) => {
  if (useWindowsStore().currentWindow?.id !== windowId) {
    chrome.windows.update(windowId, {state: "normal"})
    useWindowsStore().refreshCurrentWindows()
  }
}

const closeWindow = (windowId: number) => {
  chrome.windows.remove(windowId)
  useWindowsStore().refreshCurrentWindows()
}

const calcWindowRows = () => {
  //let index = 100
  //const usedIndices: number[] = []
  const result = _.map(useWindowsStore().currentWindows as chrome.windows.Window[], (cw: chrome.windows.Window) => {
    const windowFromStore: Window | undefined = useWindowsStore().windowForId(cw.id || -1)
    // if (!windowFromStore || !windowFromStore.index) {
    //   console.log("found windowfromstore without index", windowFromStore)
    // }
    //let indexToUse = windowFromStore && windowFromStore.index ? windowFromStore.index : index++
    // if (usedIndices.indexOf(indexToUse) >= 0) {
    //   console.log("found used index", indexToUse, usedIndices)
    //   indexToUse = 1 + Math.max(...usedIndices)
    //   useWindowsStore().upsertWindow(cw, windowFromStore?.title, indexToUse)
    // }
    // usedIndices.push(indexToUse)

    console.debug(`setting window ${cw.id} ['${windowFromStore?.title}'] (#${cw.tabs?.length} tabs) -> #${windowFromStore?.index}`)

    return {
      id: cw.id,
      index: windowFromStore?.index || -1,
      tabsCount: cw.tabs?.length || 0,
      name: useWindowsStore().windowNameFor(cw.id || 0) || cw.id,
      windowHeight: cw['height' as keyof object],
      windowWidth: cw['width' as keyof object],
      focused: cw.focused,
      alwaysOnTop: cw.alwaysOnTop,
      incognito: cw.incognito,
      sessionId: cw.sessionId,
      state: cw.state,
      type: cw.type,
      windowIcon: "*"
    }
  })

  return _.sortBy(result,"index")
}


const setWindowName = (windowRow: object, newName: string) => {
  if (newName && newName.toString().trim().length > 0) {
    const id = windowRow['id' as keyof object]
    chrome.windows.get(id, (cw) => {
      useWindowsStore().upsertWindow(cw, newName.toString().trim(), windowRow['index' as keyof object])
      if (useWindowsStore().currentWindow?.id === id) {
        currentWindowName.value = newName
        //console.log("setting window name to ", currentWindowName.value)
        useWindowsStore().currentWindowName = newName
      }
    })
  }

}

const handleDragAndDrop = async (event: any) => {
  const {moved, added} = event
  console.log("event!", event)
  if (moved) {
    console.log(`moved event: '${moved.element.id}' ${moved.oldIndex} -> ${moved.newIndex}`, rows.value)
    //useWindowsStore().moveWindow(rows.value, moved.element.id, moved.oldIndex, moved.newIndex)
    const windowIndex = moved.element.id
    console.log("moving window", windowIndex)
    //const theWindows = getSortedWindows(windowForId);

    //console.log("*** theWindows", theWindows)
    const oldIndex = moved.oldIndex
    const newIndex = moved.newIndex

    console.log("moving", windowIndex, oldIndex, newIndex)
    if (oldIndex >= 0 && rows.value.length > 0) {
      console.log("old rows", _.map(rows.value, r => r['id' as keyof object] + ":" + r['index' as keyof object]))
      const newOrder = _.map(rows.value, r => r['id' as keyof object] as number)
      const startIndex = rows.value[0]['index' as keyof object]
      let index = startIndex
      console.log("newOrder", newOrder, startIndex)
      for (const r of newOrder) {
        await useWindowsStore().updateWindowIndex(r, index++)
      }
    }
    rows.value = calcWindowRows()

    //useWindowsStore().refreshCurrentWindows()
  }
}

</script>

<style scoped>

.q-table th, .q-table td {
  padding-top: 0;
  padding-bottom: 0
}
</style>
