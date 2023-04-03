<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar class="constrained-width">

        <q-toolbar-title @click.stop="goHome()" class="cursor-pointer"
                         style="min-width:130px" shrink>
        </q-toolbar-title>

        <q-space/>

        <a href="https://tabsets.web.app/#disclaimer" class="text-white q-mx-sm" style="text-decoration: none" target="tabsets">
          Disclaimer
        </a>
        |
        <a href="https://tabsets.web.app/#privacy" class="text-white q-mx-sm"  style="text-decoration: none" target="tabsets">
          Privacy
        </a>
        |
        <a href="https://tabsets.web.app/#tos" class="text-white q-mx-sm" style="text-decoration: none" target="tabsets">
          Terms of Services
        </a>

      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view/>
    </q-page-container>

  </q-layout>

</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue';
import {useQuasar} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {useRoute, useRouter} from "vue-router";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {useSearchStore} from "src/stores/searchStore";
import _ from "lodash";
import {useSpacesStore} from "src/stores/spacesStore"
import {useSettingsStore} from "src/stores/settingsStore"
import {useUiService} from "src/services/useUiService";
import {useUiStore} from "src/stores/uiStore";

const router = useRouter()
const tabsStore = useTabsStore()
const searchStore = useSearchStore()
const uiStore = useUiStore()

const localStorage = useQuasar().localStorage

const rightDrawerOpen = ref(true)
const leftDrawerOpen = ref(false)
const largeDrawer = ref(false)
const model = ref(85)

const notificationsStore = useNotificationsStore()
const featuresStore = useSettingsStore()
const settingsStore = useSettingsStore()
const spacesStore = useSpacesStore()
const uiService = useUiService()
const route = useRoute()

const spacesOptions = ref<object[]>([])
const search = ref('')
const $q = useQuasar()

$q.loadingBar.setDefaults({
  color: 'positive',
  size: '10px',
  position: 'top'
})

watchEffect(() => {
  spacesOptions.value = _.map([...spacesStore.spaces.keys()], key => {
    const label = spacesStore.spaces.get(key)?.label || 'undef'
    return {id: key, label: label}
  })
    .concat({id: '', label: '(unassigned)'})
    .concat({id: '', label: 'create new space'})
})


const title = () => {
  return spacesStore.spaces.size === 0 ? 'Tabsets' : 'Tabsets - Space: '
}

const goHome = () => router.push("/")

</script>
