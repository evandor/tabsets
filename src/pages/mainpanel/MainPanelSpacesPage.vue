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
              <q-checkbox v-model="checked[props.col.spaceIndex][props.rowIndex]" @click="updateSpaces()"/>
            </template>
          </q-td>
        </template>
      </q-table>
    </div>

<!--    <div class="row q-px-md">-->
<!--      <div class="col-2" style="border-right: 1px solid grey">Delete Space<br>(will not delete the tabsets)</div>-->
<!--      <div class="col q-ml-lg" v-for="(space, spaceIndex) in sortedSpaces()">-->
<!--        <q-checkbox color="negative" v-model="deleteSpace[spaceIndex]"/>-->
<!--      </div>-->
<!--    </div>-->
    <div class="row q-pa-md q-my-lg" >
      <div class="col-12 q-mb-lg greyBorderTop" >
       &nbsp;
      </div>

      <div class="col-3">
        <q-select
          label="Space"
          v-model="selectedSpace"
          :options="spaceOptions"
          dense
          emit-value
          map-options
          options-dense
        />
      </div>
      <div class="col-2">
        <q-btn class="q-ml-md" label="Delete Space" @click="deleteSpace()" :disable="selectedSpace === ''"/>
      </div>
      <div class="col text-right">
        <q-btn
          label="Close Window"
          color="primary"
          @click="closeWindow()"/>
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
const spaces = ref<object[]>([])
const sortedSpaces = ref<Space[]>([])
const sortedTabsets = ref<Tabset[]>([])
const rows = ref<object[]>([])
const selectedSpace = ref<string>('')
const spaceOptions = ref<object[]>([])

const {sendMsg} = useUtils()


onMounted(() => {
  Analytics.firePageViewEvent('MainPanelSpacesPage', document.location.href);
})

watchEffect(() => {
  sortedSpaces.value = _.sortBy([...spacesStore.spaces.values()] as Space[], [ts => ts.label.toLowerCase()])
})

watchEffect(() => {
  sortedTabsets.value = _.sortBy([...tabsStore.tabsets.values()] as Tabset[], [ts => ts.name.toLowerCase()])
})

watchEffect(() => {
  spaceOptions.value = [{value:'',label:''}].concat(_.map(sortedSpaces.value, (s:Space) => { return {value: s.id, label: s.label}}))
  console.log("spaceOptions", spaceOptions.value)
})

watchEffect(() => {
  console.log("watching effect")
  const spaceArray: boolean[][] = []
  rows.value = []
  spaces.value = [{name: 'tabset', align: 'left', label: 'Tabset', field: 'tabset', sortable: false}]

  _.forEach(sortedTabsets.value as Tabset[], (ts: Tabset) => {
    rows.value.push({
      tabset: ts.name,
    })
  })

  _.forEach(sortedSpaces.value, (space: Space, i: number) => {

    spaces.value.push({
      name: space.label,
      align: 'center',
      label: space.label,
      field: 'calories',
      sortable: true,
      spaceIndex: i
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

const updateSpaces = () => {
  console.log("updated", checked.value)

  _.forEach(sortedTabsets.value as Tabset[], (ts: Tabset, tabsetIndex: number) => {
    const spaces: Array<string> = []
    _.forEach(sortedSpaces.value, (space: Space, spaceIndex: number) => {
      if (checked.value[spaceIndex][tabsetIndex]) {
        spaces.push(space.id)
      }
    })
    ts.spaces = spaces
    useTabsetService().saveTabset(ts)

    sendMsg('reload-spaces', {changedTabsetId: ts.id})
  })

}

const deleteSpace = () => {
  useSpacesStore().deleteById(selectedSpace.value)
}

const closeWindow = () => {
  chrome.tabs.getCurrent().then(current => {
    if (current && current.id) {
      chrome.tabs.remove(current.id)
    }
  })
}


</script>
