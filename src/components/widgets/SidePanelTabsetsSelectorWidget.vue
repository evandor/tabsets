<template>
  <div class="cursor-pointer">
    <div class="q-ma-none q-pa-none text-subtitle q-pl-sm cursor-pointer ellipsis">
      {{ tabsetLabel() }}
      <q-tooltip class="tooltip-small" :delay="1000" anchor="center right" self="bottom start"
        >The currenly selected tabset</q-tooltip
      >
      <q-icon name="arrow_drop_down" class="q-mr-xs" size="xs" />
    </div>

    <q-menu :offset="[0, 0]">
      <q-list dense>
        <q-item disable dense v-if="tabsetsOptions.length > 0 && useFeaturesStore().hasFeature(FeatureIdent.SPACES)">
          {{ useSpacesStore().space?.label ? 'Tabsets of ' + useSpacesStore().space.label : 'Tabsets w/o Space' }}
        </q-item>
        <q-item
          disable
          dense
          v-else-if="!useFeaturesStore().hasFeature(FeatureIdent.SPACES) && useTabsetsStore().tabsets.size > 1">
          Switch to other Tabset:
        </q-item>
        <q-item v-if="allTabsetsButCurrent.length > 10">
          <q-select
            filled
            :model-value="switchTabsetModel"
            use-input
            hide-selected
            fill-input
            input-debounce="0"
            :options="switchTabsetOptions"
            @filter="filterFn"
            @input-value="setModel"
            hint="Text autocomplete"
            style="width: 250px; padding-bottom: 32px">
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> No results </q-item-section>
              </q-item>
            </template>
          </q-select>
        </q-item>
        <q-item v-else clickable v-for="ts in allTabsetsButCurrent" @click="switchToTabset(ts as Tabset)" v-close-popup>
          {{ ts.name }}
        </q-item>

        <template v-if="useFeaturesStore().hasFeature(FeatureIdent.SPACES) && !useAsTabsetsSwitcher">
          <q-separator />
          <q-item clickable @click.stop="router.push('/sidepanel/spaces')"> Switch Space... </q-item>
        </template>

        <template v-if="!useAsTabsetsSwitcher">
          <q-separator />
          <q-item clickable @click.stop="router.push('/sidepanel')"> Show all Tabsets </q-item>
        </template>

        <!--        <template-->
        <!--          v-if="useFeaturesStore().hasFeature(FeatureIdent.BACKUP) || useFeaturesStore().hasFeature(FeatureIdent.IGNORE)">-->
        <!--          <q-separator/>-->
        <!--          <q-item disable>-->
        <!--            Special Tabsets-->
        <!--          </q-item>-->
        <!--          <q-item v-for="ts in tabsetsWithTypes([TabsetType.SPECIAL])" clickable v-close-popup-->
        <!--                  @click="switchTabset(ts)">-->
        <!--            <q-item-section class="q-ml-sm">{{ ts.name }}</q-item-section>-->
        <!--          </q-item>-->
        <!--        </template>-->

        <template v-if="!useAsTabsetsSwitcher">
          <q-separator />
          <q-item clickable v-close-popup @click="openNewTabsetDialog()">
            <q-item-section>Add new Tabset</q-item-section>
          </q-item>
        </template>

        <q-separator />
        <q-item v-if="useTabsetsStore().currentTabsetName" clickable v-close-popup @click="openEditTabsetDialog()">
          <q-item-section>Edit Tabset Name</q-item-section>
        </q-item>

        <template v-if="!useAsTabsetsSwitcher">
          <q-separator />
          <q-item v-if="useTabsetsStore().currentTabsetName" clickable v-close-popup @click="deleteTabsetDialog()">
            <q-item-section>Delete this Tabset...</q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-menu>
  </div>
</template>

<script lang="ts" setup>
import _ from 'lodash'
import { useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { SelectTabsetCommand } from 'src/tabsets/commands/SelectTabsetCommand'
import DeleteTabsetDialog from 'src/tabsets/dialogues/DeleteTabsetDialog.vue'
import EditTabsetDialog from 'src/tabsets/dialogues/EditTabsetDialog.vue'
import NewTabsetDialog from 'src/tabsets/dialogues/NewTabsetDialog.vue'
import { Tabset, TabsetStatus, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  fromPanel: { type: Boolean, default: true },
  useAsTabsetsSwitcher: { type: Boolean, default: false },
})

const emits = defineEmits(['tabsetSwitched'])

const spacesStore = useSpacesStore()
const router = useRouter()
const $q = useQuasar()

const tabsetsOptions = ref<object[]>([])
const allTabsetsButCurrent = ref<Tabset[]>([])
const switchTabsetModel = ref(null)
const switchTabsetOptions = ref<string[]>([])
const currentTabsetId = ref<string | undefined>(undefined)

watchEffect(async () => {
  currentTabsetId.value = await useTabsetsStore().getCurrentTabsetId()
})

watchEffect(() => {
  allTabsetsButCurrent.value = _.sortBy(
    _.filter(
      [...useTabsetsStore().tabsets.values()] as Tabset[],
      (tabset: Tabset) => tabset.id !== currentTabsetId.value,
    ),
    'name',
  )
})

const filterFn = (val: any, update: any, abort: any) => {
  update(() => {
    const needle = val.toLocaleLowerCase()
    switchTabsetOptions.value = _.map(allTabsetsButCurrent.value as Tabset[], (ts: Tabset) => ts.name).filter(
      (v: any) => v.toLocaleLowerCase().indexOf(needle) > -1,
    )
  })
}

const setModel = (val: any) => {
  console.log('setting model', val)
  const found = _.filter(allTabsetsButCurrent.value as Tabset[], (ts: Tabset) => ts.name === val)
  if (found && found.length > 0) {
    console.log('setting model', found)
    switchTabsetModel.value = val
    switchToTabset(found[0] as Tabset)
  }
}

watchEffect(() => {
  let tabsets = [...useTabsetsStore().tabsets.values()]
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES) && spacesStore.spaces && spacesStore.spaces.size > 0) {
    if (spacesStore.space && spacesStore.space.id && spacesStore.space.id.length > 0) {
      tabsets = _.filter(
        tabsets,
        (ts: Tabset) =>
          ts.status !== TabsetStatus.ARCHIVED && ts.spaces && ts.spaces.indexOf(spacesStore.space.id) >= 0,
      )
    } else {
      tabsets = _.filter(
        tabsets,
        (ts: Tabset) => ts.status !== TabsetStatus.ARCHIVED && ts.spaces && ts.spaces.length === 0,
      )
    }
  }
  tabsetsOptions.value = _.map(
    _.sortBy(
      _.filter(
        tabsets,
        (ts: Tabset) =>
          ts.type !== TabsetType.SPECIAL && ts.status !== TabsetStatus.ARCHIVED && ts.status !== TabsetStatus.DELETED,
      ),
      [
        function (o: Tabset) {
          return o.status === TabsetStatus.FAVORITE ? 0 : 1
        },
        function (o: Tabset) {
          return o.name.toLowerCase()
        },
      ],
    ),
    (key: Tabset) => {
      return { id: key.id, label: key.name, type: key.type, count: key.tabs.length }
    },
  )
})

const tabsetLabel = () =>
  !useTabsetsStore().currentTabsetName ? 'no tabset selected' : useTabsetsStore().currentTabsetName

const openNewTabsetDialog = () => {
  $q.dialog({
    component: NewTabsetDialog,
    componentProps: {
      tabsetId: currentTabsetId.value,
      fromPanel: props.fromPanel,
    },
  })
}

const deleteTabsetDialog = () => {
  $q.dialog({
    component: DeleteTabsetDialog,
    componentProps: {
      tabsetId: currentTabsetId.value,
      tabsetName: useTabsetsStore().currentTabsetName,
    },
  })
}

const openEditTabsetDialog = () => {
  $q.dialog({
    component: EditTabsetDialog,
    componentProps: {
      tabsetId: currentTabsetId.value,
      tabsetName: useTabsetsStore().currentTabsetName,
      fromPanel: props.fromPanel,
    },
  })
}

const switchToTabset = (ts: Tabset) => {
  console.log('settings tabset to ', ts)
  useCommandExecutor()
    .execute(new SelectTabsetCommand(ts.id))
    .then((res: ExecutionResult<Tabset | undefined>) => {
      emits('tabsetSwitched')
      //useUiStore().sidePanelSetActiveView(SidePanelViews.MAIN)
      if (!props.useAsTabsetsSwitcher) {
        router.push('/sidepanel/tabsets/' + ts.id)
      }
    })
}
</script>
