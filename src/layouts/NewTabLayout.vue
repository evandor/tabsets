<template>
  <q-layout view="hHh lpR lFr">
    <q-header elevated>
      <q-toolbar>

        <q-toolbar-title @click.stop="goHome()" class="cursor-pointer"
                         :style="featuresStore.isEnabled('spaces') ? 'min-width:150px' : 'min-width:350px'" shrink>
          Tabsets
          <span class="text-caption"
                v-show="!featuresStore.isEnabled('spaces')">Handle more links, with less tabs open</span>
        </q-toolbar-title>

        <q-space/>

        <q-btn class="q-mr-md" icon="o_help" size="12px" style="width:24px" flat @click="router.push('/about')">
          <q-tooltip>About tabsets browser extension v{{ appVersion }}</q-tooltip>
        </q-btn>

        <div class="cursor-pointer" @click="router.push('/about')" v-if="notificationsStore.updateToVersion !== ''">
          <q-btn
            class="text-primary bg-warning"
            @click="installNewVersion"
            :label="'New Version ' + notificationsStore.updateToVersion + ' available. Click here to update'"/>
        </div>
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
import {useSpacesStore} from "stores/spacesStore"
import {useUiStore} from "stores/uiStore";

const router = useRouter()
const tabsStore = useTabsStore()
const searchStore = useSearchStore()
const uiStore = useUiStore()

const localStorage = useQuasar().localStorage

const model = ref(85)

const notificationsStore = useNotificationsStore()
const featuresStore = useFeatureTogglesStore()
const spacesStore = useSpacesStore()
const route = useRoute()

const spacesOptions = ref<object[]>([])
const search = ref('')
const $q = useQuasar()

//@ts-ignore
const appVersion = import.meta.env.PACKAGE_VERSION

const title = () => {
  return spacesStore.spaces.size === 0 ? 'Tabsets' : 'Tabsets - Space: '
}

const goHome = () => router.push("/")

const installNewVersion = () => {
  notificationsStore.updateAvailable(false)
  chrome.runtime.reload()
}


</script>
