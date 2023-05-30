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
        <!--        <q-separator v-if="tabsetsOptions.length > 1"/>-->
        <q-item v-for="ts in tabsetsOptions"
                :disable="ts.id === tabsStore.currentTabsetId"
                clickable v-close-popup @click="switchTabset(ts)">
          <q-item-section v-if="ts.type === TabsetType.SESSION"
                          class="q-ml-sm" style="max-width:20px">
            <q-icon name="o_stop_circle" color="red"/>
          </q-item-section>
          <q-item-section class="q-ml-sm">{{ ts.label }}</q-item-section>
        </q-item>
        <q-separator/>
        <q-item v-if="tabsStore.currentTabsetName" clickable v-close-popup @click="openEditTabsetDialog()">
          <q-item-section>Edit Tabset Name</q-item-section>
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
import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import {useSpacesStore} from "src/stores/spacesStore";
import {ExecutionResult} from "src/domain/ExecutionResult";
import EditTabsetDialog from "components/dialogues/EditTabsetDialog.vue";

const tabsStore = useTabsStore()
const spacesStore = useSpacesStore()
const router = useRouter()
const $q = useQuasar()

const tabsetsOptions = ref<object[]>([])
const dragTarget = ref('')

const props = defineProps({
  fromPanel: {type: Boolean, default: false}
})

watchEffect(() => {
  let tabsets = [...tabsStore.tabsets.values()]
  if (usePermissionsStore().hasFeature(FeatureIdent.SPACES) && spacesStore.spaces && spacesStore.spaces.size > 0) {
    if (spacesStore.space && spacesStore.space.id && spacesStore.space.id.length > 0) {
      tabsets = _.filter(tabsets, ts => ts.status !== TabsetStatus.ARCHIVED && ts.spaces && ts.spaces.indexOf(spacesStore.space.id) >= 0)
    } else {
      tabsets = _.filter(tabsets, ts => ts.status !== TabsetStatus.ARCHIVED && ts.spaces && ts.spaces.length === 0)
    }
  }
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
    return {id: key.id, label: key.name, type: key.type}
  })
})

const tabsetLabel = () => !tabsStore.currentTabsetName ? 'no tabset selected' : tabsStore.currentTabsetName

const openNewTabsetDialog = () => {
  $q.dialog({
    component: NewTabsetDialog,
    componentProps: {
      tabsetId: tabsStore.currentTabsetId,
      fromPanel: props.fromPanel
    }
  })
}

const openEditTabsetDialog = () => {
  $q.dialog({
    component: EditTabsetDialog,
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
    .then((res: ExecutionResult<Tabset | undefined>) => {
      if (!props.fromPanel) {
        router.push("/tabsets/" + ts.id)
      }
    })
}

</script>
