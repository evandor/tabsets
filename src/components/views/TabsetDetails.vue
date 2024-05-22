<template>

  <div class="q-pa-md">
    <q-list dense>

      <InfoItem title="ID" :value="tabsetId" />
      <InfoItem title="Name" :value="tabset?.name" />
      <InfoItem title="# of tabs" :value="tabset?.tabs.length.toString()" />
      <InfoItem title="# of groups" :value="tabset?.groups.length.toString()" />
      <InfoItem title="# of spaces" :value="tabset?.spaces.length.toString()" />
      <InfoItem title="Created" :value="tabset?.created.toString()" />
      <InfoItem title="Updated" :value="tabset?.updated.toString()" />
      <InfoItem title="Status" :value="tabset?.status" />
      <InfoItem title="Type" :value="tabset?.type" />
      <InfoItem title="View" :value="tabset?.view" />
      <InfoItem title="Sorting" :value="tabset?.sorting" />
    </q-list>
  </div>


</template>

<script lang="ts" setup>

import {useUiStore} from "src/stores/uiStore";
import {ref, watchEffect} from "vue";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {Tabset} from "src/tabsets/models/Tabset";
import InfoItem from "components/views/helper/InfoItem.vue";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

const uiStore = useUiStore()

const tabsetId = ref(uiStore.selectedTabsetId)
const tabset = ref<Tabset | undefined>(undefined)

watchEffect(() => tabset.value = tabsetId.value ? useTabsetsStore().getTabset(tabsetId.value) : undefined)
</script>
