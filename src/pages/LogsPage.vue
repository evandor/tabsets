<template>

  <!-- toolbar -->
  <q-toolbar class="text-primary lightgrey">
    <div class="row fit">
      <div class="col-xs-12 col-md-7">
        <q-toolbar-title>
          <div class="row justify-start items-baseline">
            <div class="col-12">
                <span class="text-primary">
                 ...
                </span>

            </div>
          </div>
        </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-5 text-right">
        <q-btn
          flat dense icon="o_open_in_new"
          color="green"
          label="Open in new tab"
          class="q-mr-md"

        >
          <q-tooltip>Open in new tab</q-tooltip>
        </q-btn>

      </div>
    </div>
  </q-toolbar>

  <q-page padding class="greyBorderTop">

    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded class="bg-grey-1 text-primary">todo.
      </q-banner>

      <q-table
        title="Meta data from the website source"
        :rows="logs"
        :columns="logsColumns"
        row-key="name"
        :pagination="metaInitialPagination"
        :filter="filter"
        dense>

        <template v-slot:top-right>
          <q-input borderless dense debounce="300" v-model="filter" placeholder="Search">
            <template v-slot:append>
              <q-icon name="search"/>
            </template>
          </q-input>
        </template>

      </q-table>

    </div>

  </q-page>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {useRoute} from "vue-router";
import {date} from "quasar"
import {read} from '@extractus/feed-extractor'
import NavigationService from "src/services/NavigationService";
import {formatDistance, parseISO} from "date-fns";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {useLoggingServicee} from "src/services/useLoggingService";
import {useQueryExecutor} from "src/services/QueryExecutor";
import {SearchIndexQuery} from "src/domain/queries/SearchIndexQuery";
import {LogsQuery} from "src/domain/queries/LogsQuery";

const route = useRoute()

const encodedUrl = ref()
const title = ref()
const logs = ref<any[]>([])

const metaInitialPagination = {
  sortBy: 'timestamp',
  descending: false,
  page: 1,
  rowsPerPage: 30
}

const logsColumns = ref([
  {name: 'timestamp', align: 'left', label: 'Timestamp', field: 'timestamp', sortable: true},
  {name: 'level', align: 'left', label: 'Level', field: 'level', sortable: true},
  {name: 'msg', align: 'left', label: 'Message', field: 'msg', sortable: true}
])


useQueryExecutor()
  .queryFromUi(new LogsQuery())
  .then(res => {logs.value = res.result})

// watchEffect(() => {
//   useLoggingServicee().getLogs()
//     .then((res) => logs.value = res)
//
// })


</script>

