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
            <span :data-testid="'windowDataColumn_name_' + row['id' as keyof object]" :class="colorForQuota(row.quota)">
              {{ row['name' as keyof object] }}
              {{ row.quota ? '(' + row.quota + '%)' : '' }}
            </span>
          </td>
          <td>
            {{ row.count }}
          </td>
          <td v-if="row['snapshot' as keyof object]">{{ row.count - row.snapshot }}</td>
          <td v-else>-</td>
          <td v-if="row.link && row.count === 0">
            <q-icon
              name="help"
              size="11px"
              color="warning"
              class="cursor-pointer"
              @click="NavigationService.openSingleTab(row.link)" />
          </td>
          <td v-else-if="row.snapshot && row.count > row.snapshot">
            <q-icon name="north" size="11px" :color="row.name === 'Open Tabs' ? 'negative' : 'positive'" />
          </td>
          <td v-else-if="row['snapshot' as keyof object] && row.count < row.snapshot">
            <q-icon name="south" size="11px" :color="row.name === 'Open Tabs' ? 'positive' : 'negative'" />
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
import StatsUtils, { StatRow } from 'src/core/utils/StatsUtils'
import NavigationService from 'src/services/NavigationService'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { onMounted, ref, watch, watchEffect } from 'vue'

const localstorage = useQuasar().localStorage

const rows = ref<StatRow[]>([])
const currentWindowName = ref('---')
const statsSnapshot = ref<object | undefined>(undefined)

onMounted(() => {
  statsSnapshot.value = (localstorage.getItem('stats') as object) || undefined
  rows.value = StatsUtils.calcStatsRows()
})

watch(
  () => useWindowsStore().currentBrowserWindows,
  (newWindows, oldWindows) => {
    rows.value = StatsUtils.calcStatsRows()
  },
)

watch(
  () => useTabsetsStore().allTabsCount,
  (a, b) => {
    rows.value = StatsUtils.calcStatsRows()
  },
)

watch(
  () => useTabsetsStore().tabsets.size,
  (a, b) => {
    rows.value = StatsUtils.calcStatsRows()
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
    rows.value = StatsUtils.calcStatsRows()
  },
)

watch(
  () => useWindowsStore().currentBrowserWindows,
  (a, b) => {
    rows.value = StatsUtils.calcStatsRows()
  },
)

const saveStatsSnapshot = () => {
  const newStats = {
    date: new Date().getTime().toString(),
    values: StatsUtils.calcStatsRows(),
  }
  localstorage.set('stats', newStats)
  statsSnapshot.value = newStats
  rows.value = StatsUtils.calcStatsRows()
}

const snapshotDate = () => {
  if (statsSnapshot.value) {
    const tstamp: string = statsSnapshot.value['date' as keyof object] as string
    return date.formatDate(Number(tstamp), 'DD.MM.YY HH:mm')
  }
  return '---'
}

const colorForQuota = (quota: number | undefined) => {
  if (!quota) {
    return ''
  } else if (quota > 90) {
    return 'text-negative'
  } else if (quota > 70) {
    return 'text-warning'
  }
  return 'text-green'
}
</script>

<style scoped>
.q-table th,
.q-table td {
  padding-top: 0;
  padding-bottom: 0;
}
</style>
