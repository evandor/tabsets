<template>
  <q-layout view="hHh LpR lFr">
    <q-header elevated>
      <q-toolbar>

        <q-img
          class="q-ml-xs q-mr-none cursor-pointer" style="margin-top:-7px"
          src="favicon.ico" height="32px" width="32px"/>
        <q-toolbar-title>
          Tabsets
        </q-toolbar-title>


        <q-space/>


        <div>
<!--          <q-icon v-if="!useUiStore().networkOnline || useUiStore().mqttOffline" name="cloud_off">-->
<!--            <q-tooltip class="tooltip-small">{{useUiStore().sharingMqttUrl}}: {{ useUiStore().mqttOffline }}</q-tooltip>-->
<!--          </q-icon>-->

        </div>

<!--        <div class="cursor-pointer" @click="router.push('/')" v-if="notificationsStore.updateToVersion !== ''">-->
<!--          <q-btn-->
<!--            class="text-primary bg-warning"-->
<!--            @click="installNewVersion(notificationsStore.updateToVersion)"-->
<!--            :label="'New Version ' + notificationsStore.updateToVersion + ' available. Click here to update'"/>-->
<!--        </div>-->
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" side="left" behavior="desktop" bordered>
      <Navigation></Navigation>
    </q-drawer>

<!--    <q-drawer v-model="useUiStore().rightDrawerOpen" side="right" bordered-->
<!--              content-class="column justify-between no-wrap bg-grey-1">-->
<!--      <DrawerRight/>-->

<!--    </q-drawer>-->

    <q-page-container>
      <router-view/>
      <!--      <div id="fixed-footer" class="q-pl-md q-pa-xs">{{ useUiStore().footerInfo }}</div>-->
    </q-page-container>

  </q-layout>

</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue';
import {useMeta, useQuasar} from "quasar";
import {useRouter} from "vue-router";
import Navigation from "src/components/Navigation.vue"
import _ from "lodash";
import {useSpacesStore} from "src/spaces/stores/spacesStore"
import {DrawerTabs, UserLevel, useUiStore} from "src/ui/stores/uiStore";
import {useUtils} from "src/core/services/Utils";
import {Suggestion, SuggestionState} from "src/suggestions/models/Suggestion";
import {useSuggestionsStore} from "src/suggestions/stores/suggestionsStore";

const $q = useQuasar()
const router = useRouter()

const leftDrawerOpen = ref($q.screen.gt.lg)

// const notificationsStore = useNotificationsStore()
const spacesStore = useSpacesStore()

const spacesOptions = ref<object[]>([])
const suggestions = ref<Suggestion[]>(useSuggestionsStore().getSuggestions([SuggestionState.NEW, SuggestionState.DECISION_DELAYED]))
const search = ref('')

const {inBexMode} = useUtils()

$q.loadingBar.setDefaults({
  color: 'positive',
  size: '10px',
  position: 'top'
})

watchEffect(() => {
  suggestions.value = useSuggestionsStore().getSuggestions([SuggestionState.NEW, SuggestionState.DECISION_DELAYED])
})

watchEffect(() => {
  spacesOptions.value = _.map([...spacesStore.spaces.keys()], key => {
    const label = spacesStore.spaces.get(key)?.label || 'undef'
    return {id: key, label: label}
  })
    .concat({id: '', label: '(unassigned)'})
    .concat({id: '', label: 'create new space'})
})

useMeta(() => {
  return {
    // @ts-ignore
    title: 'Tabsets Extension' //+ appVersion
  }
})

const installNewVersion = (version: string) => {
  // notificationsStore.updateAvailable(false)
  chrome.tabs.create({
    active: true,
    url: "https://tabsets.web.app/#/updatedTo/" + version
  })
  chrome.runtime.reload()
}


</script>
