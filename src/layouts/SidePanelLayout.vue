<template>
  <q-layout view="hHh lpR fFf">

<!--    <q-drawer show-if-above side="right" :model-value="drawerIsOpen" @update:model-value="drawerToggled">-->
<!--      Some Content-->
<!--      **    <q-btn label="toggle" @click="drawerToggled()" />-->
<!--    </q-drawer>-->


    <q-page-container>
      <router-view/>
      *    <q-btn label="toggle" @click="drawerToggled()" />
    </q-page-container>


    <q-footer elevated  v-if="tabsStore.tabsets?.size > 0">
      <SidePanelFooter />
    </q-footer>

  </q-layout>

</template>

<script setup lang="ts">

import {ref, watchEffect} from "vue";
import SidePanelFooter from "components/SidePanelFooter.vue";
import {useTabsStore} from "src/stores/tabsStore";
import {useMeta, useQuasar} from "quasar";

const tabsStore = useTabsStore()

const location = ref('')


useMeta(() => {
  console.debug("using meta...")
  return {
    // @ts-ignore
    title: 'Tabsets Extension...' //+ appVersion
  }
})


watchEffect(() => location.value = window.location.href.split('/www/')[1] || window.location.href)

const $q = useQuasar()
const drawerIsOpen = ref(true)

 function drawerToggled () {
  console.log("sending event...", drawerIsOpen.value)
   $q.bex.send('wb.drawer.toggle', {
    open: drawerIsOpen.value // So it knows to make it bigger / smaller
  })

  // Only set this once the promise has resolved so we can see the entire slide animation.
  drawerIsOpen.value = !drawerIsOpen.value
}


</script>
