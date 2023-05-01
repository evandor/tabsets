<template>

  <span class="cursor-pointer">
    <q-badge outline
             class="q-mr-md q-mt-none q-pt-sm q-pb-sm q-px-sm"
             style="font-size:19px"
             color="primary" text-color="primary" :label="tabsetLabel()">
    </q-badge>

    <q-menu :offset="[0,10]">
      <q-list>
        <q-item disable v-if="tabsetsOptions.length > 1">
          Switch to Tabset:
        </q-item>
        <q-separator v-if="tabsetsOptions.length > 1"/>
        <q-item v-for="ts in tabsetsOptions"
                :disable="ts.id === tabsStore.currentTabsetId?.id"
                clickable v-close-popup @click="switchTabset(ts)">
          <q-item-section>{{ ts.label }}</q-item-section>
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

const tabsStore = useTabsStore()
const router = useRouter()
const $q = useQuasar()

const tabsetsOptions = ref<object[]>([])

watchEffect(() => {
  tabsetsOptions.value = _.map([...tabsStore.tabsets.values()], key => {
    return {id: key.id, label: key.name}
  })
})

const tabsetLabel = () => {
  console.log("current", tabsStore.currentTabsetName)
  return !tabsStore.currentTabsetName ? 'no tabset selected' : tabsStore.currentTabsetName
}


const openNewTabsetDialog = () => {
  $q.dialog({
    component: NewTabsetDialog,
    componentProps: {
      tabsetId: tabsStore.currentTabsetId,
    }
  })
}

const switchTabset = (ts: any) => {
  console.log("settings space to ", ts)
  useCommandExecutor()
    .execute(new SelectTabsetCommand(ts.id))
    .then(() => router.push("/tabsets/" + ts.id))
}

</script>
