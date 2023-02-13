<template>
  <q-layout view="hHh lpR lFr" class="constrained-width q-ma-lg">
    <q-header elevated>
      <q-toolbar>

        <q-img class="q-ml-xs q-mr-none cursor-pointer" style="margin-top:-7px"
               src="favicon.ico" height="32px" width="32px">
          <q-tooltip class="tooltip">Toggle the tabset list view by clicking here</q-tooltip>
        </q-img>

        <q-toolbar-title
          class="cursor-pointer"
          style="min-width:200px" shrink>
          Tabsets Extension
          <q-tooltip class="tooltip">Open Tabsets Extension</q-tooltip>
        </q-toolbar-title>

      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view/>
    </q-page-container>

  </q-layout>

</template>

<script setup lang="ts">
import {ref} from 'vue';
import {useQuasar} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {useRoute, useRouter} from "vue-router";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {useSearchStore} from "src/stores/searchStore";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {useSpacesStore} from "src/stores/spacesStore"
import {useUiStore} from "src/stores/uiStore";

// const router = useRouter()
// const tabsStore = useTabsStore()
// const searchStore = useSearchStore()
// const uiStore = useUiStore()
//
// const localStorage = useQuasar().localStorage
//
// const model = ref(85)
//
// const notificationsStore = useNotificationsStore()
// const featuresStore = useFeatureTogglesStore()
// const spacesStore = useSpacesStore()
// const route = useRoute()
//
// const spacesOptions = ref<object[]>([])
// const search = ref('')
// const $q = useQuasar()

// const title = () => {
//   return spacesStore.spaces.size === 0 ? 'Tabsets' : 'Tabsets - Space: '
// }
//
// const goHome = () => router.push("/")


</script>
