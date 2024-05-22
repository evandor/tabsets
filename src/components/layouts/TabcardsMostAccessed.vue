<template>
  <div class="row items-start">
    <div
      class="col-xs-12 col-sm-4 col-md-3 col-lg-2 q-pa-xs"
      v-for="tab in props.tabs"
      :key="props.group + '_' + tab.id">

      <TabCardWidget :key="props.group + '__' + tab.id" :tab="tabAsTab(tab)" />

    </div>
  </div>

</template>

<script setup lang="ts">
import {Tab} from "src/tabsets/models/Tab";
import TabsetService from "src/tabsets/services/TabsetService";
import {PropType, ref} from "vue";
import {VueDraggableNext} from 'vue-draggable-next'
import TabCardWidget from "src/components/widgets/TabCardWidget.vue"
import {useQuasar} from "quasar";
import _ from "lodash"
import {useTabsetService} from "src/services/TabsetService2";

const props = defineProps({
  tabs: {
    type: Array as PropType<Array<Tab>>,
    required: true
  },
  group: {
    type: String,
    required: true
  }
})

const tabAsTab = (tab: Tab): Tab => tab as unknown as Tab

</script>

<style lang="sass" scoped>
.my-card
  width: 100%
</style>
