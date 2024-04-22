<template>

  <div class="cursor-pointer">
    <q-badge outline
      class="q-mr-md q-mt-none q-mb-sm q-pt-sm q-pb-sm q-px-sm"
      color="black" :label="spacesLabel()">
    </q-badge>

    <q-menu :offset="[0,10]">
      <q-list>
        <q-item disable v-if="spacesOptions.length > 1">
          Switch to space:
        </q-item>

        <q-separator v-if="spacesOptions.length > 1"/>

        <q-item v-for="space in spacesStore.spaces.values()"
                :disable="space.id === spacesStore.space?.id"
                clickable v-close-popup @click="switchSpace(space)">
          <q-item-section>{{ space.label }}</q-item-section>
        </q-item>

        <q-separator/>

        <q-item clickable v-close-popup @click="switchSpace(null as unknown as Space)">
          <q-item-section>Show unassigned tabs</q-item-section>
        </q-item>

        <q-separator/>

        <q-item clickable v-close-popup @click="openNewSpaceDialog()">
          <q-item-section>Add Space</q-item-section>
        </q-item>

        <q-separator v-if="spacesOptions.length > 0 && !props.fromPanel"/>

        <q-item v-if="spacesOptions.length > 0 && !props.fromPanel"
                clickable v-close-popup @click="router.push('/spaces')">
          <q-item-section>Manage Spaces</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </div>

</template>

<script lang="ts" setup>

import {useTabsStore} from "stores/tabsStore";
import {ref, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import NewSpaceDialog from "src/spaces/dialogues/NewSpaceDialog.vue"
import {useQuasar} from "quasar";
import _ from "lodash";
import {Space} from "src/spaces/models/Space";

const tabsStore = useTabsStore()
const spacesStore = useSpacesStore()
const router = useRouter()
const $q = useQuasar()

const props = defineProps({
  fromPanel: {type: Boolean, default: false}
})

const spacesOptions = ref<object[]>([])

watchEffect(() => {
  spacesOptions.value = _.map([...spacesStore.spaces.keys()], key => {
    const label = spacesStore.spaces.get(key)?.label || 'undef'
    return {id: key, label: label}
  })
})

const spacesLabel = () => {
  return spacesStore.space?.label ?
      'Space: ' + spacesStore.space.label :
      'no space selected'
}

const openNewSpaceDialog = () => {
  $q.dialog({
    component: NewSpaceDialog,
    componentProps: {
      tabsetId: tabsStore.currentTabsetId,
      fromPanel: props.fromPanel
    }
  })
}

const switchSpace = (s: Space) => {
  console.log("setting space to ", s)
  spacesStore.space = s
}

</script>
