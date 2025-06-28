<template>
  <q-layout view="lHh lpr lFf" container style="height: 100%">
    <q-header class="q-pa-none q-mt-none darkInDarkMode brightInBrightMode">
      <q-toolbar>
        <q-toolbar-title>
          <div class="row justify-start items-baseline">Public Tabsets</div>
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="q-pa-none">
        <q-list class="q-mt-none greyBorderTop">
          <q-item v-for="tabset in tabsets()" class="darken-on-hover">
            <q-item-section class="cursor-pointer q-ma-none q-pa-none" @click="selectTS(tabset)">
              <q-item-label>
                {{ tabset.name }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { useQuasar } from 'quasar'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { SelectTabsetCommand } from 'src/tabsets/commands/SelectTabsetCommand'
import { Tabset, TabsetStatus, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

const $q = useQuasar()

$q.loadingBar.setDefaults({
  color: 'green',
  size: '10px',
  position: 'bottom',
})

const tabsets = (): Tabset[] => {
  let tabsets = [...useTabsetsStore().tabsets.values()]
  return _.sortBy(
    _.filter(
      tabsets,
      (ts: Tabset) =>
        ts.type !== TabsetType.SPECIAL && ts.status !== TabsetStatus.ARCHIVED && ts.status !== TabsetStatus.DELETED,
    ),
    [
      function (o: any) {
        return o.status === TabsetStatus.FAVORITE ? 0 : 1
      },
      function (o: any) {
        return o.name.toLowerCase()
      },
    ],
  )
}

const selectTS = (tabset: Tabset) => {
  useCommandExecutor().execute(new SelectTabsetCommand(tabset.id))
}
</script>
