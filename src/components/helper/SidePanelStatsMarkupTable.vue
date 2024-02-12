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
                class="cursor-pointer"><q-icon name="restart_alt" class="q-mr-xs cursor-pointer"
                                               @click="saveStatsSnapshot()"/>{{ snapshotDate() }}
          </span>
        </th>
        <th style="max-width:20px">
          &nbsp;
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
        <td v-if="row['snapshot' as keyof object]">
          {{ row['count' as keyof object] - row['snapshot' as keyof object] }}
        </td>
        <td v-else>
          -
        </td>
        <td v-if="row['link' as keyof object] && row['count' as keyof object] === 0">
          <q-icon name="help" size="11px" color="warning" class="cursor-pointer" @click="NavigationService.openSingleTab(row['link' as keyof object])" />
        </td>
        <td v-else-if="row['snapshot' as keyof object] && row['count' as keyof object] > row['snapshot' as keyof object]">
          <q-icon name="north" size="11px" :color="row['name' as keyof object] === 'Open Tabs' ? 'negative' : 'positive'" />
        </td>
        <td v-else-if="row['snapshot' as keyof object] && row['count' as keyof object] < row['snapshot' as keyof object]">
          <q-icon name="south" size="11px" :color="row['name' as keyof object] === 'Open Tabs' ? 'positive' : 'negative'" />
        </td>
        <td v-else>
          <q-icon name="east" size="11px"  />
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
import NavigationService from "src/services/NavigationService";

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

watch(() => useTabsStore().allTabsCount, (a,b) => {
  rows.value = calcWindowRows()
})


watchEffect(() => {
  const res = useWindowsStore().currentChromeWindow && useWindowsStore().currentChromeWindow.id ?
    useWindowsStore().windowNameFor(useWindowsStore().currentChromeWindow.id || 0) || 'n/a' :
    'n/a'
  currentWindowName.value = res
})

watch(() => useTabsStore().tabsCount, (a, b) => {
  rows.value = calcWindowRows()
})

watch(() => useWindowsStore().currentChromeWindows, (a, b) => {
  rows.value = calcWindowRows()
})

const calcWindowRows = () => {
  return [
    {name: 'Tabs', count: useTabsStore().allTabsCount, snapshot: getFromSnapshot('Tabs')},
    {name: 'Tabsets', count: useTabsStore().tabsets.size, snapshot: getFromSnapshot('Tabsets')},
    {name: 'Spaces', count: useSpacesStore().spaces.size, snapshot: getFromSnapshot('Spaces')},
    {name: 'Bookmarks', count: useBookmarksStore().bookmarksCount, snapshot: getFromSnapshot('Bookmarks'), link:"https://docs.tabsets.net/bookmarks"},
    {name: 'Bookmark Folders', count: useBookmarksStore().foldersCount, snapshot: getFromSnapshot('Bookmark Folders'), link:"https://docs.tabsets.net/bookmarks"},
    {
      name: 'Open Windows',
      count: useWindowsStore().currentChromeWindows.length,
      snapshot: getFromSnapshot('Open Windows'),
      link: "https://docs.tabsets.net/windows-management"
    },
    {name: 'Open Tabs', count: useTabsStore().tabs.length, snapshot: getFromSnapshot('Open Tabs')}
  ]
}

const saveStatsSnapshot = () => {
  localstorage.set("stats", {
    date: new Date().getTime().toString(),
    values: calcWindowRows()
  })
  rows.value = calcWindowRows()
}

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
  const tstamp: string = statsSnapshot.value['date' as keyof object] as string
  return date.formatDate(Number(tstamp), 'DD.MM.YY HH:mm')
}

</script>

<style scoped>

.q-table th, .q-table td {
  padding-top: 0;
  padding-bottom: 0
}

</style>
