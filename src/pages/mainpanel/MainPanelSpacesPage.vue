<template>
  <q-page padding>

    <div class="text-h5 q-ma-md">
      Spaces Settings
    </div>

    <div class="q-pa-md">
      <q-table
        title="Tabsets to Spaces Assignment"
        :rows="rows"
        :columns="spaces"
        row-key="name">
        <template v-slot:body-cell="props">
          <q-td :props="props">
            <template v-if="props.col.name === 'tabset'">
              <q-badge color="blue" :label="props.value"/>
            </template>
            <template v-else>
              <q-checkbox v-model="checked[props.col.spaceIndex][props.rowIndex]"/>
              {{ props.col.spaceIndex }}/{{ props.rowIndex }}
            </template>
          </q-td>
        </template>
      </q-table>
    </div>

    <div class="row q-px-md">
      <div class="col-2" style="border-right: 1px solid grey">Delete Space<br>(will not delete the tabsets)</div>
      <div class="col q-ml-lg" v-for="(space, spaceIndex) in [...spacesStore.spaces.values()]">
        <q-checkbox color="negative" v-model="deleteSpace[spaceIndex]"/>
      </div>
    </div>
    <div class="row q-pa-none" style="border-bottom: 1px solid grey">
      <div class="col-12"></div>
    </div>
    <div class="row q-pa-md">
      <div class="col">
        <q-btn flat
               class="bg-positive"
               data-testid="spaceEditedSubmit"
               label="Update Spaces"
               @click="updateSpaces()"/>
      </div>
    </div>

  </q-page>

</template>

<script lang="ts" setup>

import {useTabsStore} from "src/stores/tabsStore";
import {useSpacesStore} from "src/stores/spacesStore";
import {onMounted, ref, watchEffect} from "vue"
import _ from "lodash"
import {Space} from "src/models/Space"
import {Tabset} from "src/models/Tabset";
import {useRouter} from "vue-router";
import {useTabsetService} from "src/services/TabsetService2";
import Analytics from "src/utils/google-analytics";
import {useUtils} from "src/services/Utils";

const spacesStore = useSpacesStore()
const tabsStore = useTabsStore()
const checked = ref<boolean[][]>([[]])
const deleteSpace = ref<boolean[]>([])
const router = useRouter()
const spaces = ref<object[]>([])
const rows = ref<object[]>([])

const {sendMsg} = useUtils()

onMounted(() => {
  Analytics.firePageViewEvent('MainPanelSpacesPage', document.location.href);
})

const sortedTabsets = () => _.sortBy([...tabsStore.tabsets.values()] as Tabset[], [ts => ts.name.toLowerCase()])

watchEffect(() => {
  const spaceArray: boolean[][] = []
  deleteSpace.value = []
  rows.value = []
  spaces.value = [{name: 'tabset', align: 'left', label: 'Tabset', field: 'tabset', sortable: false}]

  _.forEach(sortedTabsets(), (ts: Tabset) => {
    rows.value.push({
      tabset: ts.name,
      calories: 159,
      fat: 6.0,
      carbs: 24,
      protein: 4.0,
      sodium: 87,
      calcium: '14%',
      iron: '1%'
    },)
  })

  _.forEach(_.sortBy([...spacesStore.spaces.values()], [space => space.label.toLowerCase()]), (space: Space, i: number) => {

    spaces.value.push({
      name: space.label,
      align: 'center',
      label: space.label,
      field: 'calories',
      sortable: true,
      spaceIndex: i
    })

    deleteSpace.value.push(false)
    const tsArray: Array<boolean> = []
    _.forEach(sortedTabsets(), (ts: Tabset) => {
      //console.log("checking", space.id, ts.id)
      tsArray.push(ts.spaces.indexOf(space.id) >= 0)
    })
    spaceArray.push(tsArray)
  })
  console.log("spaceArray", spaceArray)
  console.log("deleteSpace", deleteSpace.value)

  checked.value = spaceArray
})

const updateSpaces = () => {
  console.log("updated", checked.value)

  _.forEach(sortedTabsets(), (ts: Tabset, tabsetIndex: number) => {
    const spaces: Array<string> = []
    _.forEach([...spacesStore.spaces.values()], (space: Space, spaceIndex: number) => {
      if (checked.value[spaceIndex][tabsetIndex]) {
        spaces.push(space.id)
      }
    })
    ts.spaces = spaces
    useTabsetService().saveTabset(ts)

    sendMsg('reload-spaces', {changedTabsetId: ts.id})
  })

  _.forEach([...spacesStore.spaces.values()], (space: Space, spaceIndex: number) => {
    if (deleteSpace.value[spaceIndex]) {
      console.log("deleting space", space)
      useSpacesStore().deleteById(space.id)
    }
  })


  chrome.tabs.getCurrent().then(current => {
    if (current && current.id) {
      // chrome.tabs.remove(current.id)
    }
  })

  //router.push("/tabsets/" + tabsStore.currentTabsetId)
}


</script>
