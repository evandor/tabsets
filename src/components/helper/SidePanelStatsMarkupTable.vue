<template>
  <div class="col-12 text-right">
    <q-markup-table class="q-ma-none" dense flat>
      <thead>
        <tr>
          <th class="text-left">Type</th>
          <th class="text-right">Count</th>
          <th class="text-right q-pr-none">
            <span v-if="!statsSnapshot" class="cursor-pointer" @click="saveStatsSnapshot()"
              ><q-icon name="save" class="q-mr-xs" />Save snapshot
              <q-tooltip class="tooltip-small"> Store the current numbers for comparison </q-tooltip>
            </span>
            <span v-else>
              <span class="cursor-pointer">
                <q-icon name="restart_alt" class="q-mr-xs cursor-pointer" @click="saveStatsSnapshot()">
                  <q-tooltip class="tooltip-small">Reset Snapshot Counters</q-tooltip>
                </q-icon> </span
              >{{ snapshotDate() }}
            </span>
          </th>
          <th style="max-width: 20px">&nbsp;</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="row in rows" :key="row['id' as keyof object]" style="max-height: 15px">
          <td class="text-left">
            <span :data-testid="'windowDataColumn_name_' + row['id' as keyof object]">
              {{ row['name' as keyof object] }}
            </span>
          </td>
          <td>
            {{ row['count' as keyof object] }}
          </td>
          <td v-if="row['snapshot' as keyof object]">
            {{ row['count' as keyof object] - row['snapshot' as keyof object] }}
          </td>
          <td v-else>-</td>
          <td v-if="row['link' as keyof object] && row['count' as keyof object] === 0">
            <q-icon
              name="help"
              size="11px"
              color="warning"
              class="cursor-pointer"
              @click="NavigationService.openSingleTab(row['link' as keyof object])" />
          </td>
          <td
            v-else-if="
              row['snapshot' as keyof object] && row['count' as keyof object] > row['snapshot' as keyof object]
            ">
            <q-icon
              name="north"
              size="11px"
              :color="row['name' as keyof object] === 'Open Tabs' ? 'negative' : 'positive'" />
          </td>
          <td
            v-else-if="
              row['snapshot' as keyof object] && row['count' as keyof object] < row['snapshot' as keyof object]
            ">
            <q-icon
              name="south"
              size="11px"
              :color="row['name' as keyof object] === 'Open Tabs' ? 'positive' : 'negative'" />
          </td>
          <td v-else>
            <q-icon name="east" size="11px" />
          </td>
        </tr>
      </tbody>
    </q-markup-table>
  </div>
</template>

<script lang="ts" setup>
import { date, useQuasar } from 'quasar'
import { useBookmarksStore } from 'src/bookmarks/stores/bookmarksStore'
import NavigationService from 'src/services/NavigationService'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { onMounted, ref, watch, watchEffect } from 'vue'

const localstorage = useQuasar().localStorage

const rows = ref<object[]>([])
const currentWindowName = ref('---')
const statsSnapshot = ref<object | undefined>(undefined)

onMounted(() => {
  statsSnapshot.value = (localstorage.getItem('stats') as object) || undefined
  rows.value = calcStatsRows()
})

watch(
  () => useWindowsStore().currentBrowserWindows,
  (newWindows, oldWindows) => {
    rows.value = calcStatsRows()
  },
)

watch(
  () => useTabsetsStore().allTabsCount,
  (a, b) => {
    rows.value = calcStatsRows()
  },
)

watchEffect(() => {
  const res =
    useWindowsStore().currentBrowserWindow && useWindowsStore().currentBrowserWindow?.id
      ? useWindowsStore().windowNameFor(useWindowsStore().currentBrowserWindow!.id || 0) || 'n/a'
      : 'n/a'
  currentWindowName.value = res
})

watch(
  () => useTabsStore2().tabsCount,
  (a, b) => {
    rows.value = calcStatsRows()
  },
)

watch(
  () => useWindowsStore().currentBrowserWindows,
  (a, b) => {
    rows.value = calcStatsRows()
  },
)

const calcStatsRows = () => {
  return [
    { name: 'Tabs', count: useTabsetsStore().allTabsCount, snapshot: getFromSnapshot('Tabs') },
    {
      name: 'Tabsets',
      count: useTabsetsStore().tabsets.size,
      snapshot: getFromSnapshot('Tabsets'),
    },
    { name: 'Spaces', count: useSpacesStore().spaces.size, snapshot: getFromSnapshot('Spaces') },
    {
      name: 'Bookmarks',
      count: useBookmarksStore().bookmarksCount,
      snapshot: getFromSnapshot('Bookmarks'),
      link: 'https://docs.tabsets.net/bookmarks',
    },
    {
      name: 'Bookmark Folders',
      count: useBookmarksStore().foldersCount,
      snapshot: getFromSnapshot('Bookmark Folders'),
    },
    {
      name: 'Open Windows',
      count: useWindowsStore().currentBrowserWindows.length,
      snapshot: getFromSnapshot('Open Windows'),
      link: 'https://docs.tabsets.net/windows-management',
    },
    { name: 'Open Tabs', count: useTabsStore2().tabsCount, snapshot: getFromSnapshot('Open Tabs') },
  ]
}

const saveStatsSnapshot = () => {
  const newStats = {
    date: new Date().getTime().toString(),
    values: calcStatsRows(),
  }
  localstorage.set('stats', newStats)
  statsSnapshot.value = newStats
  rows.value = calcStatsRows()
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
  if (statsSnapshot.value) {
    const tstamp: string = statsSnapshot.value['date' as keyof object] as string
    return date.formatDate(Number(tstamp), 'DD.MM.YY HH:mm')
  }
  return '---'
}
</script>

<style scoped>
.q-table th,
.q-table td {
  padding-top: 0;
  padding-bottom: 0;
}
</style>
