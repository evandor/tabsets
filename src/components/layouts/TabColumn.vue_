<template>

  <div class="column q-py-md q-ma-md" >
    <div class="c-bg-grey-1 q-pa-md q-mx-md rounded-borders text-blue-grey">
      <b>{{ props.label }}</b>
    </div>
    <TabCardWidget v-for="tab in props.tabs" style="max-width:200px" class="q-mb-sm"
                   :key="props.group + '__' + tab.id"
                   :tab="tabAsTab(tab)" />


  </div>

</template>

<script setup lang="ts">
import {Tab} from "src/models/Tab";
import {PropType, ref} from "vue";
import TabCardWidget from "src/components/widgets/TabCardWidget.vue"
import {useQuasar} from "quasar";
import _ from "lodash"
import {useTabsStore} from "src/stores/tabsStore";

const $q = useQuasar()
const tabsStore = useTabsStore()

const props = defineProps({
  tabs: {
    type: Array as PropType<Array<Tab>>,
    required: true
  },
  label: {
    type: String,
    default: "unknown"
  }
})

const thumbnails = ref<Map<string, string>>(new Map())
const tabAsTab = (tab: Tab): Tab => tab as unknown as Tab

</script>

<style lang="sass" scoped>
</style>
