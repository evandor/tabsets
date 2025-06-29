<template>
  <q-layout view="hHh LpR lFr">
    <q-header elevated>
      <q-toolbar>
        <q-img
          @click="toggleLeftDrawer"
          class="q-ml-xs q-mr-none cursor-pointer"
          style="margin-top: -7px"
          src="favicon.ico"
          height="32px"
          width="32px" />
        <q-toolbar-title> Tabsets</q-toolbar-title>

        <q-space />

        <div>
          <!--          <q-btn-->
          <!--            @click="toggleSettings"-->
          <!--            flat-->
          <!--            size="12px"-->
          <!--            class="q-mr-md" icon="o_settings">-->
          <!--          </q-btn>-->
          <!--          <q-menu :offset="[0, 7]">-->
          <!--            <q-list style="min-width: 200px">-->
          <!--              <q-item clickable @click="router.push('/settings')">Settings</q-item>-->
          <!--              <q-item clickable @click="router.push('/about')" v-close-popup>-->
          <!--                About Tabsets-->
          <!--              </q-item>-->
          <!--            </q-list>-->
          <!--          </q-menu>-->
        </div>

        <div class="cursor-pointer" @click="router.push('/about')" v-if="notificationsStore.updateToVersion !== ''">
          <q-btn
            class="text-primary bg-warning"
            @click="installNewVersion(notificationsStore.updateToVersion)"
            :label="'New Version ' + notificationsStore.updateToVersion + ' available. Click here to update'" />
        </div>
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
      <router-view />
      <!--      <div id="fixed-footer" class="q-pl-md q-pa-xs">{{ useUiStore().footerInfo }}</div>-->
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { useMeta, useQuasar } from 'quasar'
import Navigation from 'src/core/components/Navigation.vue'
import { useUtils } from 'src/core/services/Utils'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { Suggestion } from 'src/suggestions/domain/models/Suggestion'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useNotificationsStore } from 'stores/notificationsStore'
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const router = useRouter()

const leftDrawerOpen = ref($q.screen.gt.lg)

const notificationsStore = useNotificationsStore()
const spacesStore = useSpacesStore()

const spacesOptions = ref<object[]>([])
const suggestions = ref<Suggestion[]>(useSuggestionsStore().getSuggestions(['NEW', 'DECISION_DELAYED']))
const search = ref('')

const { inBexMode } = useUtils()

$q.loadingBar.setDefaults({
  color: 'positive',
  size: '10px',
  position: 'top',
})

const settingsClicked = ref(false)

watchEffect(() => {
  suggestions.value = useSuggestionsStore().getSuggestions(['NEW', 'DECISION_DELAYED'])
})

watchEffect(() => {
  spacesOptions.value = _.map([...spacesStore.spaces.keys()], (key: any) => {
    const label = spacesStore.spaces.get(key)?.label || 'undef'
    return { id: key, label: label }
  })
    .concat({ id: '', label: '(unassigned)' })
    .concat({ id: '', label: 'create new space' })
})

useMeta(() => {
  return {
    title: 'Tabsets Extension', //+ appVersion
  }
})

const title = () => {
  return inBexMode() ? 'Tabsets' : process.env.MODE === 'spa' ? 'Tabsets Web' : 'Tabsets'
}

const goHome = () => router.push('/')

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
  useUiStore().toggleLeftDrawer()
}

const installNewVersion = (version: string) => {
  notificationsStore.updateAvailable(false)
  chrome.tabs.create({
    active: true,
    url: 'https://tabsets.web.app/#/updatedTo/' + version,
  })
  chrome.runtime.reload()
}
</script>
