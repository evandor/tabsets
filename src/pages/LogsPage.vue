<template>
  <q-page padding>

    <div class="text-h6">Logs</div>
    <div class="text-caption">now</div>

    <div class="row" v-for="l in logStore.logs">
      <div class="col">{{l.date}}</div>
      <div class="col">{{l.message}}</div>
      <div class="col">{{l.urls}}</div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import {defineComponent, onMounted, onUpdated, ref, watchEffect} from 'vue'
import {useRoute} from "vue-router";
import {TabsetApi} from "src/services/TabsetApi";
import {useQuasar} from "quasar";
import {Tabset} from "src/models/Tabset";
import Tabcards from "src/components/layouts/Tabcards.vue";
import _ from "lodash"
import {useTabsStore} from "stores/tabsStore";
import {useTabGroupsStore} from "stores/tabGroupsStore";
import {useLogStore} from "stores/logStore";


const logStore = useLogStore()



</script>
