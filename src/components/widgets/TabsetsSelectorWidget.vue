<template>

  <div class="cursor-pointer">
    <div
      class="q-ma-none q-pa-none text-subtitle2 q-pl-sm cursor-pointer ellipsis"
      :class="useUiStore().sidePanelActiveViewIs(SidePanelView.MAIN) ? '' : 'text-grey-5'">
      {{ tabsetLabel() }}
      <q-icon name="arrow_drop_down" class="q-mr-xs " size="xs" color="primary"/>
    </div>

    <q-menu :offset="[0,0]">
      <q-list dense>
        <q-item disable v-if="tabsetsOptions.length > 0 && useFeaturesStore().hasFeature(FeatureIdent.SPACES)">
          {{ useSpacesStore().space?.label ? 'Tabsets of ' + useSpacesStore().space.label : 'Tabsets w/o Space' }}
        </q-item>

        <template
          v-if="useFeaturesStore().hasFeature(FeatureIdent.BACKUP) || useFeaturesStore().hasFeature(FeatureIdent.IGNORE)">
          <q-separator/>
          <q-item disable>
            Special Tabsets
          </q-item>
          <q-item v-for="ts in tabsetsWithTypes([TabsetType.SPECIAL])" clickable v-close-popup
                  @click="switchTabset(ts)">
            <q-item-section class="q-ml-sm">{{ ts.name }}</q-item-section>
          </q-item>
        </template>

        <q-separator/>
        <q-item clickable v-close-popup @click="openNewTabsetDialog()">
          <q-item-section>Add new Tabset</q-item-section>
        </q-item>
        <q-separator/>
        <q-item v-if="tabsStore.currentTabsetName" clickable v-close-popup @click="openEditTabsetDialog()">
          <q-item-section>Edit Tabset Name</q-item-section>
        </q-item>
        <q-separator/>
        <q-item v-if="tabsStore.currentTabsetName" clickable v-close-popup @click="deleteTabsetDialog()">
          <q-item-section>Delete this Tabset...</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </div>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {useQuasar} from "quasar";
import _ from "lodash";
import {SelectTabsetCommand} from "src/tabsets/commands/SelectTabset";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import NewTabsetDialog from "src/tabsets/dialogues/NewTabsetDialog.vue";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/FeatureIdent";
import {Tabset, TabsetStatus, TabsetType} from "src/tabsets/models/Tabset";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import EditTabsetDialog from "src/tabsets/dialogues/EditTabsetDialog.vue";
import DeleteTabsetDialog from "src/tabsets/dialogues/DeleteTabsetDialog.vue";
import {SidePanelView, useUiStore} from "src/ui/stores/uiStore";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useFeaturesStore} from "src/features/stores/featuresStore";

const spacesStore = useSpacesStore()
const router = useRouter()
const $q = useQuasar()

const tabsetsOptions = ref<object[]>([])

const props = defineProps({
  fromPanel: {type: Boolean, default: false}
})

watchEffect(() => {
  let tabsets = [...useTabsetsStore().tabsets.values()]
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES) && spacesStore.spaces && spacesStore.spaces.size > 0) {
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
    return {id: key.id, label: key.name, type: key.type, count: key.tabs.length}
  })
})

const tabsetLabel = () => !useTabsetsStore().currentTabsetName ? 'no tabset selected' : useTabsetsStore().currentTabsetName

const openNewTabsetDialog = () => {
  $q.dialog({
    component: NewTabsetDialog,
    componentProps: {
      tabsetId: useTabsetsStore().currentTabsetId,
      fromPanel: props.fromPanel
    }
  })
}

const deleteTabsetDialog = () => {
  $q.dialog({
    component: DeleteTabsetDialog,
    componentProps: {
      tabsetId: useTabsetsStore().currentTabsetId,
      tabsetName: useTabsetsStore().currentTabsetName
    }
  })
}

const openEditTabsetDialog = () => {
  $q.dialog({
    component: EditTabsetDialog,
    componentProps: {
      tabsetId: useTabsetsStore().currentTabsetId,
      tabsetName: useTabsetsStore().currentTabsetName,
      fromPanel: props.fromPanel
    }
  })
}

const switchTabset = (ts: any) => {
  console.log("settings tabset to ", ts)
  useCommandExecutor()
    .execute(new SelectTabsetCommand(ts.id, useSpacesStore().space?.id))
    .then((res: ExecutionResult<Tabset | undefined>) => {
      useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)
      if (!props.fromPanel) {
        router.push("/tabsets/" + ts.id)
      }
    })
}

const tabsetsWithTypes = (types: TabsetType[]) => {
  let tabsets = [...useTabsetsStore().tabsets.values()]
  return _.sortBy(
    _.filter(tabsets, (ts: Tabset) =>
      types.findIndex(t => ts.type === t && TabsetStatus.DELETED !== ts.status) >= 0),
    ['name'])
}

</script>
