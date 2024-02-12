<template>
  <div class="col-12 text-right">

    <q-markup-table class="q-ma-none" dense flat>
      <thead>
      <tr>
        <th class="text-left">Type</th>
        <th class="text-right">Count</th>
        <th class="text-right q-pr-none">
          <span v-if="!statsSnapshot"
                class="cursor-pointer"
                @click="saveStatsSnapshot()"><q-icon name="save" class="q-mr-xs"/>Save snapshot
          </span>
          <span v-else
                class="cursor-pointer"><q-icon name="restart_alt" class="q-mr-xs" @click="saveStatsSnapshot()"/>{{ snapshotDate() }}
          </span>
        </th>
      </tr>
      </thead>

      <tbody>
      <tr v-for="row in rows" style="max-height:15px">
        <td class="text-left">
            <span class="cursor-pointer" :data-testid="'windowDataColumn_name_' + row['id' as keyof object]">
                {{ row['name' as keyof object] }}
                <q-tooltip class="tooltip-small" v-if="devMode">{{ row['id' as keyof object] }}</q-tooltip>
              </span>

        </td>
        <td>
          {{ row['count' as keyof object] }}
        </td>
        <td>
          {{ row['snapshot' as keyof object] - row['count' as keyof object] }}
        </td>
      </tr>
      </tbody>
    </q-markup-table>

  </div>
</template>

<script lang="ts" setup>

import {useWindowsStore} from "stores/windowsStore";
import {onMounted, ref, watch, watchEffect} from "vue";
import {date, useQuasar} from "quasar";
import {useSpacesStore} from "stores/spacesStore";
import {useTabsStore} from "stores/tabsStore";
import {useSettingsStore} from "stores/settingsStore";
import {useBookmarksStore} from "stores/bookmarksStore";

const localstorage = useQuasar().localStorage

const settingsStore = useSettingsStore()

const rows = ref<object[]>([])
const currentWindowName = ref('---')
const statsSnapshot = ref<object | undefined>(undefined)

const devMode = ref<boolean>(settingsStore.isEnabled('dev'))

onMounted(() => {
  statsSnapshot.value = localstorage.getItem("stats") as object || undefined
  rows.value = calcWindowRows()
})

watch(() => useWindowsStore().currentChromeWindows, (newWindows, oldWindows) => {
  rows.value = calcWindowRows()
})

watchEffect(() => {
  const res = useWindowsStore().currentChromeWindow && useWindowsStore().currentChromeWindow.id ?
    useWindowsStore().windowNameFor(useWindowsStore().currentChromeWindow.id || 0) || 'n/a' :
    'n/a'
  currentWindowName.value = res
})

const calcWindowRows = () => {
  return [
    {name: 'Tabs', count: useTabsStore().allTabsCount, snapshot: getFromSnapshot('Tabs')},
    {name: 'Tabsets', count: useTabsStore().tabsets.size, snapshot: getFromSnapshot('Tabsets')},
    {name: 'Spaces', count: useSpacesStore().spaces.size, snapshot: getFromSnapshot('Spaces')},
    {name: 'Bookmarks', count: useBookmarksStore().bookmarksCount, snapshot: getFromSnapshot('Bookmarks')},
    {name: 'Bookmark Folders', count: useBookmarksStore().foldersCount, snapshot: getFromSnapshot('Bookmark Folders')},
    {name: 'Open Windows', count: useWindowsStore().currentChromeWindows.length, snapshot: getFromSnapshot('Open Windows')},
    {name: 'Open Tabs', count: useTabsStore().tabs.length, snapshot: getFromSnapshot('Open Tabs')}
  ]
}

const saveStatsSnapshot = () => localstorage.set("stats", {date: new Date().getTime().toString(), values: calcWindowRows()})

const getFromSnapshot = (ident: string) => {
  if (!statsSnapshot.value) {
    return undefined
  }
  const vals = statsSnapshot.value['values' as keyof object] as Array<any>
  if (!vals) {
    return undefined
  }
  for (const v of [...vals]) {
    if (v['name'] === ident) {
      return v['count' as keyof object]
    }
  }
}

const snapshotDate = () => {
  const tstamp = statsSnapshot.value['date' as keyof object]
  console.log("formatting tstamp", tstamp)
  return date.formatDate(tstamp, 'DD.MM.YYYY HH:mm')
}

</script>

<style scoped>

.q-table th, .q-table td {
  padding-top: 0;
  padding-bottom: 0
}

</style>
