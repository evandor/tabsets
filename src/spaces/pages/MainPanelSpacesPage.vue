<template>
  <q-page padding>
    <div class="text-h5 q-ma-md">Spaces Settings</div>

    <div class="q-pa-md">
      <q-table
        title="Tabsets to Spaces Assignment"
        no-data-label="loading..."
        no-results-label="no results (check your filter?)"
        :pagination="initialPagination"
        :rows="rows"
        :columns="spaces"
        row-key="name">
        <template v-slot:body-cell="props">
          <q-td :props="props">
            <template v-if="props.col.name === 'tabset'">
              <q-badge color="blue" :label="props.value" />
            </template>
            <template v-else>
              <q-checkbox
                v-model="checked[props.col.spaceIndex]![props.rowIndex]"
                @click="updateSpaces(props.col.spaceIndex, props.rowIndex)" />
            </template>
          </q-td>
        </template>
      </q-table>
    </div>

    <div class="row q-pa-md q-my-lg">
      <div class="col-12 q-mb-lg greyBorderTop">&nbsp;</div>

      <div class="col-3">
        <q-select
          label="Space"
          v-model="selectedSpace"
          :options="spaceOptions"
          dense
          emit-value
          map-options
          options-dense />
      </div>
      <div class="col-2">
        <q-btn class="q-ml-md" label="Delete Space" @click="deleteSpace()" :disable="selectedSpace === ''" />
      </div>
      <div class="col text-right">
        <q-btn v-if="!props.fullpage" label="Close Window" color="primary" @click="closeWindow()" />
      </div>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import _ from 'lodash'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUtils } from 'src/core/services/Utils'
import Analytics from 'src/core/utils/google-analytics'
import { DeleteSpaceCommand } from 'src/spaces/commands/DeleteSpaceCommand'
import { Space } from 'src/spaces/models/Space'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { Tabset, TabsetStatus } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsetsUiStore } from 'src/tabsets/stores/tabsetsUiStore'
import { onMounted, ref, watchEffect } from 'vue'

const spacesStore = useSpacesStore()
const checked = ref<boolean[][]>([[]])
const spaces = ref<any[]>([])
const sortedSpaces = ref<Space[]>([])
const sortedTabsets = ref<Tabset[]>([])
const rows = ref<object[]>([])
const selectedSpace = ref<string>('')
const spaceOptions = ref<object[]>([])

const { sendMsg, closeWindow } = useUtils()

const props = defineProps<{ fullpage: boolean }>()

onMounted(() => {
  Analytics.firePageViewEvent('MainPanelSpacesPage', document.location.href)
})

watchEffect(() => {
  sortedSpaces.value = _.sortBy([...spacesStore.spaces.values()] as Space[], [(ts: Space) => ts.label.toLowerCase()])
})

watchEffect(() => {
  sortedTabsets.value = _.sortBy([...useTabsetsStore().tabsets.values()] as Tabset[], [
    (ts: Tabset) => ts.name.toLowerCase(),
  ])
})

watchEffect(() => {
  spaceOptions.value = [{ value: '', label: '' }].concat(
    _.map(sortedSpaces.value, (s: Space) => {
      return { value: s.id, label: s.label }
    }),
  )
  console.log('spaceOptions', spaceOptions.value)
})

watchEffect(() => {
  console.log('watching effect spaces')
  const spaceArray: boolean[][] = []
  rows.value = []
  spaces.value = [{ name: 'tabset', align: 'left', label: 'Tabset', field: 'tabset', sortable: false }]

  _.forEach(sortedSpaces.value, (space: Space, i: number) => {
    spaces.value.push({
      name: space.label,
      align: 'center',
      label: space.label,
      field: 'calories',
      sortable: true,
      spaceIndex: i,
    })

    const tsArray: Array<boolean> = []
    _.forEach(sortedTabsets.value as Tabset[], (ts: Tabset) => {
      //console.log("checking", space.id, ts.id)
      tsArray.push(ts.spaces.indexOf(space.id) >= 0)
    })
    spaceArray.push(tsArray)
  })

  checked.value = spaceArray
})

watchEffect(() => {
  console.log('watching effect tabsets')
  rows.value = []
  _.forEach(sortedTabsets.value as Tabset[], (ts: Tabset) => {
    if (ts.status !== TabsetStatus.DELETED) {
      rows.value.push({
        tabset: ts.name,
      })
    }
  })
})

const initialPagination = {
  rowsPerPage: 10,
}

const updateSpaces = (spaceIndex: number, tabsetIndex: number) => {
  console.log('updated', checked.value[spaceIndex]![tabsetIndex], spaceIndex, tabsetIndex)

  const tabset: Tabset = sortedTabsets.value[tabsetIndex] as Tabset
  const space: Space = sortedSpaces.value[spaceIndex]!
  const set: boolean = checked.value[spaceIndex]![tabsetIndex]!

  console.log('set', set)
  console.log('tabset', tabset, tabset.spaces)
  console.log('space', space.id, space)
  if (set) {
    console.log('pushing', space.id)
    tabset.spaces.push(space.id)
  } else {
    const i = tabset.spaces.indexOf(space.id)
    console.log('found index', i)
    if (i >= 0) {
      useTabsetsUiStore().clearFromLastUsedTabsets(space.id, tabset.id)
      tabset.spaces.splice(i, 1)
    }
  }
  console.log('------')
  console.log('tabset spaces', tabset.spaces)

  useTabsetService().saveTabset(tabset)
  sendMsg('reload-spaces', { changedTabsetId: tabset.id })
}

const deleteSpace = () => {
  useCommandExecutor().executeFromUi(new DeleteSpaceCommand(selectedSpace.value))
  selectedSpace.value = ''
}
</script>
