<template>

  <div class="cursor-pointer">
    <q-select dense options-dense
              hide-bottom-space borderless
              @update:modelValue="val => switchSpace(val)"
              v-model="spaces" :options="spacesOptions" label="Select Space"/>
  </div>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import NewSpaceDialog from "src/spaces/dialogues/NewSpaceDialog.vue"
import {useQuasar} from "quasar";
import _ from "lodash";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

const spacesStore = useSpacesStore()
const $q = useQuasar()

const spaces = ref<object>(null as unknown as object)
const spacesOptions = ref<object[]>([])

watchEffect(() => {
  if (useTabsetsStore().tabsets) {
    spacesOptions.value = _.map([...spacesStore.spaces.keys()], (key: string) => {
      const label = spacesStore.spaces.get(key)?.label || 'undef'
      return {id: key, label: label}
    })
    // if (spacesOptions.value.length > 0) {
       spaces.value = spacesStore.space //spacesOptions.value[0]
    // }
    spacesOptions.value = spacesOptions.value.concat({id: "unassigned-tabsets", label: "Show Unassigned tabsets"})
    spacesOptions.value = spacesOptions.value.concat({id: "add-space", label: "Add new Space"})

  }
})

watchEffect(() => {
  spacesOptions.value = _.map([...spacesStore.spaces.keys()], key => {
    const label = spacesStore.spaces.get(key)?.label || 'undef'
    return {id: key, label: label}
  })
})

// const spacesLabel = () => {
//   return spacesStore.space?.label || 'no space selected'
// }
//
// const openNewSpaceDialog = () => {
//   $q.dialog({
//     component: NewSpaceDialog,
//     componentProps: {
//       tabsetId: tabsStore.currentTabsetId
//     }
//   })
// }

const switchSpace = (s: any) => {
  console.log("settings space to ", s)
  if (s.id === 'add-space') {
    $q.dialog({
      component: NewSpaceDialog,
      componentProps: {
        tabsetId: useTabsetsStore().currentTabsetId,
        fromPanel: true
      }
    })
  } else {
    spacesStore.space = s
  }

}



</script>
