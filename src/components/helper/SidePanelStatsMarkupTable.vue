<template>
  <div class="col-12 text-right">

    <q-markup-table class="q-ma-none" dense flat>
      <thead>
      <tr>
        <th class="text-left">Type</th>
        <th class="text-right">Count</th>
        <th class="text-right q-pr-none">
          <span class="cursor-pointer"><q-icon name="save" class="q-mr-xs"/>Save current values</span>
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
        </td>
      </tr>
      </tbody>
    </q-markup-table>

  </div>
</template>

<script lang="ts" setup>

import {useWindowsStore} from "stores/windowsStore";
import {onMounted, ref, watch, watchEffect} from "vue";
import {Window} from "src/models/Window"
import _ from "lodash";
import {uid, useQuasar} from "quasar";
import {VueDraggableNext} from 'vue-draggable-next'
import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import {useSpacesStore} from "stores/spacesStore";
import {useTabsStore} from "stores/tabsStore";
import {Tabset} from "src/models/Tabset";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {RestoreTabsetCommand} from "src/domain/tabsets/RestoreTabset";
import {useUtils} from "src/services/Utils";
import {useNotificationHandler} from "src/services/ErrorHandler";
import RenameWindowDialog from "components/dialogues/RenameWindowDialog.vue";
import {useSettingsStore} from "stores/settingsStore";
import {useBookmarksStore} from "stores/bookmarksStore";

const settingsStore = useSettingsStore()

const rows = ref<object[]>([])
const currentWindowName = ref('---')

const devMode = ref<boolean>(settingsStore.isEnabled('dev'))

onMounted(() => {
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
    {name: 'Tabs', count: useTabsStore().allTabsCount},
    {name: 'Tabsets', count: useTabsStore().tabsets.size},
    {name: 'Spaces', count: useSpacesStore().spaces.size},
    {name: 'Bookmarks', count: useBookmarksStore().bookmarksCount},
    {name: 'Bookmark Folders', count: useBookmarksStore().foldersCount},
    {name: 'Open Windows', count: useWindowsStore().currentChromeWindows.length},
    {name: 'Open Tabs', count: useTabsStore().tabs.length},
  ]
}

</script>

<style scoped>

.q-table th, .q-table td {
  padding-top: 0;
  padding-bottom: 0
}

</style>
