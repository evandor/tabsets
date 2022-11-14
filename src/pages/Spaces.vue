<template>
  <q-page padding>

    <div class="text-h5 q-ma-md">
      Spaces Settings
    </div>

    <div class="row">
      <div class="col-1"></div>
      <div class="col">
        <b>Spaces</b>
      </div>
    </div>
    <div class="row">
      <div class="col"><b>Tabset</b></div>
      <div class="col" v-for="space in spacesStore.spaces.values()">
        {{ space.label }}
      </div>
    </div>
    <div class="row" v-for="(ts,tsIndex) in tabsStore.tabsets.values()">
      <div class="col">{{ ts.name }}</div>
      <div class="col" v-for="(space, spaceIndex) in spacesStore.spaces.values()">
        <q-checkbox v-model="checked[spaceIndex][tsIndex]"/>
      </div>
    </div>
    <div class="row">
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

import {useTabsStore} from "stores/tabsStore";
import {useSpacesStore} from "stores/spacesStore";
import {ref, watchEffect} from "vue"
import _ from "lodash"
import {Space} from "src/models/Space"
import {Tabset} from "src/models/Tabset";
import TabsetService from "src/services/TabsetService";
import {useRouter} from "vue-router";

const spacesStore = useSpacesStore()
const tabsStore = useTabsStore()
const checked = ref<boolean[][]>([[]])
const router = useRouter()

watchEffect(() => {
  const spaceArray: boolean[][] = []
  _.forEach([...spacesStore.spaces.values()], (space: Space) => {
    const tsArray: Array<boolean> = []
    _.forEach([...tabsStore.tabsets.values()], (ts: Tabset) => {
      console.log("checking", space.id, ts.id)
      tsArray.push(ts.spaces.indexOf(space.id) >= 0)
    })
    spaceArray.push(tsArray)
  })
  console.log("spaceArray", spaceArray)

  checked.value = spaceArray
})

const updateSpaces = () => {
  console.log("updated", checked.value)

  _.forEach([...tabsStore.tabsets.values()], (ts: Tabset, tabsetIndex: number) => {
    const spaces: Array<string> = []
    _.forEach([...spacesStore.spaces.values()], (space: Space, spaceIndex: number) => {
      console.log("checking", space.id, ts.id)
      //tsArray.push(false)
      if (checked.value[spaceIndex][tabsetIndex]) {
        spaces.push(space.id)
      }
    })
    console.log("result", ts.id, spaces)
    ts.spaces = spaces
    TabsetService.saveTabset(ts)
    router.push("/tabset")
  })


}


</script>
