<template>

  <span class="cursor-pointer">
    <q-badge
      class="q-mr-md q-mt-none q-pt-sm q-pb-sm q-px-sm"

      color="white" text-color="primary" :label="tabsetLabel()">
    </q-badge>

    <q-menu :offset="[0,10]">
      <q-list dense>
        <q-item disable v-if="tabsetsOptions.length > 1 && usePermissionsStore().hasFeature(FeatureIdent.SPACES)">
          {{ useSpacesStore().space?.label ? 'Tabsets of ' + useSpacesStore().space.label : 'Tabsets w/o Space' }}
        </q-item>
        <q-item disable v-if="tabsetsOptions.length > 1 && !usePermissionsStore().hasFeature(FeatureIdent.SPACES)">
          Switch to Tabset:
        </q-item>
        <q-separator v-if="tabsetsOptions.length > 1"/>
        <q-item v-for="ts in tabsetsOptions"
                :disable="ts.id === tabsStore.currentTabsetId"
                clickable v-close-popup @click="switchTabset(ts)">
          <q-item-section class="q-ml-sm">{{ ts.label }}</q-item-section>
        </q-item>
        <q-separator/>
        <q-item clickable v-close-popup @click="openNewTabsetDialog()">
          <q-item-section>Add Tabset</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </span>

</template>

<script lang="ts" setup>

import {useTabsStore} from "src/stores/tabsStore";
import {ref, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {useQuasar} from "quasar";
import _ from "lodash";
import {SelectTabsetCommand} from "src/domain/tabsets/SelectTabset";
import {useCommandExecutor} from "src/services/CommandExecutor";
import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {useSpacesStore} from "../../stores/spacesStore";
import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";

const tabsStore = useTabsStore()
const spacesStore = useSpacesStore()
const router = useRouter()
const $q = useQuasar()

const tabsetsOptions = ref<object[]>([])

const props = defineProps({
  fromPanel: {type: Boolean, default: false}
})

watchEffect(() => {
  // tabsetsOptions.value = _.map([...tabsStore.tabsets.values()], key => {
  //   return {id: key.id, label: key.name}
  // })

  // const tabsets = (): Tabset[] => {
  let tabsets = [...tabsStore.tabsets.values()]
  console.log("choosing from1", tabsets)
  if (usePermissionsStore().hasFeature(FeatureIdent.SPACES) && spacesStore.spaces && spacesStore.spaces.size > 0) {
    if (spacesStore.space && spacesStore.space.id && spacesStore.space.id.length > 0) {
      tabsets = _.filter(tabsets, ts => ts.status !== TabsetStatus.ARCHIVED && ts.spaces && ts.spaces.indexOf(spacesStore.space.id) >= 0)
      console.log("choosing from2a", spacesStore.space)
    } else {
      tabsets = _.filter(tabsets, ts => ts.status !== TabsetStatus.ARCHIVED && ts.spaces && ts.spaces.length === 0)
      console.log("choosing from2b", spacesStore.space)
    }
  }
  console.log("choosing from3", tabsets)
  tabsetsOptions.value = _.map(_.sortBy(_.filter(tabsets, (ts: Tabset) =>
      ts.type !== TabsetType.SPECIAL &&
      ts.status !== TabsetStatus.ARCHIVED &&
      ts.status !== TabsetStatus.DELETED),
    [
      function (o) {
        return o.status === TabsetStatus.FAVORITE ? 0 : 1
      },
      function (o) {
        return o.name.toLowerCase()
      }
    ]), (key) => {
    return {id: key.id, label: key.name}
  })
  console.log("choosing from4", tabsetsOptions.value)
  // }

})

const tabsetLabel = () => !tabsStore.currentTabsetName  ? 'no tabset selected' : tabsStore.currentTabsetName

const openNewTabsetDialog = () => {
  $q.dialog({
    component: NewTabsetDialog,
    componentProps: {
      tabsetId: tabsStore.currentTabsetId,
      fromPanel: props.fromPanel
    }
  })
}

const switchTabset = (ts: any) => {
  console.log("settings tabset to ", ts)
  useCommandExecutor()
    .execute(new SelectTabsetCommand(ts.id))
    .then(() => {
      if (!props.fromPanel) {
        router.push("/tabsets/" + ts.id)
      }
    })
}

</script>
