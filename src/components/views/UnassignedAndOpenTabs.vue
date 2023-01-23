<template>
  <q-toolbar class="text-primary lightgrey">
    <div class="row fit">
      <div class="col-xs-12 col-md-9">
        <q-toolbar-title>
          <div class="row justify-start items-baseline">
            <div class="col-1">
                  New Tabs in Browser
            </div>
          </div>
        </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-3 q-ma-none q-mt-sm text-right">

        <div class="row" >
          <div class="col">
<!--            <span class="text-caption ellipsis">{{ filter }}</span>-->
<!--            <q-btn-->
<!--              flat dense icon="o_filter_list"-->
<!--              :color="filter ? 'secondary' : 'primary'"-->
<!--              size="0.8em"-->
<!--              class="q-ml-md q-mr-none">-->
<!--              <q-tooltip v-if="filter">Apply Filter: '{{ filter }}'</q-tooltip>-->
<!--              <q-tooltip v-else>Apply Filter</q-tooltip>-->
<!--            </q-btn>-->
<!--            <q-popup-edit v-model="filter" v-slot="scope">-->
<!--              <q-input-->
<!--                autofocus-->
<!--                dense-->
<!--                maxlength="9"-->
<!--                v-model="scope.value"-->
<!--                :model-value="scope.value"-->
<!--                @update:model-value="val => setFilter2( val)"-->
<!--                hint="Filter open Tabs"-->
<!--                @keyup.enter="scope.set">-->
<!--                <template v-slot:after>-->
<!--                  <q-btn-->
<!--                    flat dense color="warning" icon="cancel" v-close-popup-->
<!--                    @click="cancelFilter()"-->
<!--                  />-->
<!--                </template>-->
<!--              </q-input>-->
<!--            </q-popup-edit>-->
          </div>
        </div>

      </div>
    </div>
  </q-toolbar>

  <vue-draggable-next
    :list="unassignedTabs()"
    :group="{ name: 'tabs', pull: 'clone', put: false }"
    :sort="true">

    <div
      class="col-12 q-pa-xs items-center justify-center" style="width:100%; max-width: 300px;cursor: move"
      v-for="tab in unassignedTabs()"
      :key="tab.id">

      <OpenTabCard :tab="tab" />

    </div>

  </vue-draggable-next>

</template>
<script setup lang="ts">
import {useTabsStore} from "stores/tabsStore";
import {Tab} from "src/models/Tab";
import _ from "lodash";
import OpenTabCard from "components/layouts/OpenTabCard.vue";
import {VueDraggableNext} from 'vue-draggable-next'

const tabsStore = useTabsStore()

function unassignedTabs(): Tab[] {
  return _.filter(
    tabsStore.pendingTabset?.tabs,
    //@ts-ignore
    (t: Tab) => {

      // if (props.filter && props.filter.trim().length > 0) {
      //   const f = props.filter.toLowerCase()
      //   const chromeTab = t.chromeTab
      //   if (chromeTab && chromeTab.title && chromeTab.title.toLowerCase().indexOf(f) >= 0) {
      //     return true
      //   }
      //   if (chromeTab && chromeTab.url && chromeTab.url.indexOf(f) >= 0) {
      //     return true
      //   }
      //   if (t.name && t.name.toLowerCase().indexOf(f) >= 0) {
      //     return true
      //   }
      //   return false
      // }
      return true
    })
}
</script>
