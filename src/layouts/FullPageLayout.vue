<template>
  <q-layout view="hHh LpR lFr">
    <q-header elevated :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-1 text-primary'">
      <q-toolbar class="text-primary">
        <template v-if="leftDrawerOpen">
          <!--          <q-img-->
          <!--            class="q-ml-xs q-mr-none cursor-pointer"-->
          <!--            @click="toggleLeftDrawer"-->
          <!--            src="/public/favicon.ico"-->
          <!--            height="32px"-->
          <!--            width="32px">-->
          <!--            <q-tooltip class="tooltip">Toggle the tabset list view by clicking here</q-tooltip>-->
          <!--          </q-img>-->
          <q-icon name="menu" @click="toggleLeftDrawer"></q-icon>
          <q-toolbar-title
            v-if="!useFeaturesStore().hasFeature(FeatureIdent.SPACES)"
            @click.stop="goHome()"
            class="cursor-pointer"
            style="min-width: 200px"
            shrink>
            {{ title() }}
            <q-tooltip class="tooltip">Reload Tabsets Extension</q-tooltip>
          </q-toolbar-title>
          <q-toolbar-title v-else>
            <span class="capitalize">{{ title() }}</span>
          </q-toolbar-title>
        </template>
        <!-- left drawer closed -->
        <template v-else>
          <q-icon class="q-ml-xs q-mr-none cursor-pointer" name="menu" size="18px" @click="toggleLeftDrawer">
            <q-tooltip class="tooltip">Toggle the tabset list view by clicking here</q-tooltip>
          </q-icon>
          <template v-if="useFeaturesStore().hasFeature(FeatureIdent.SPACES)">
            <SpacesSelectorWidget class="q-mx-md" />
          </template>
        </template>

        <q-space />

        <SearchWidget
          style="position: absolute; left: 300px; top: 5px; max-width: 500px"
          v-if="useTabsetsStore().tabsets.size > 1 || useSettingsStore().has('DEV_MODE')" />

        <Transition name="colorized-appear">
          <div
            v-if="
              inBexMode() &&
              useFeaturesStore().hasFeature(FeatureIdent.OPENTABS_THRESHOLD) &&
              useTabsetsStore().tabsets.size > 0
            ">
            <OpenTabsThresholdWidget />
          </div>
        </Transition>

        <!--        <div v-if="unreadNotifications().length > 0">-->
        <!--          <q-btn flat icon="o_notifications" class="q-mr-md cursor-pointer">-->
        <!--            <q-badge floating color="red" rounded/>-->
        <!--          </q-btn>-->
        <!--          <q-menu :offset="[0, 7]">-->
        <!--            <q-list style="min-width: 200px">-->
        <!--              <q-item>New Notifications:</q-item>-->
        <!--              <q-item v-for="n in unreadNotifications()"-->
        <!--                      clickable v-close-popup @click="showNotificationDialog(n.id)">-->
        <!--                <q-item-section>{{ n.title }}</q-item-section>-->
        <!--              </q-item>-->
        <!--            </q-list>-->
        <!--          </q-menu>-->
        <!--        </div>-->

        <span v-if="useSuggestionsStore().getSuggestions(['NEW', 'DECISION_DELAYED']).length > 0">
          <q-btn flat :color="dependingOnStates()" name="rss" icon="o_assistant">
            <q-tooltip class="tooltip" anchor="center right" self="center left" :delay="200"
              >You have suggestions
            </q-tooltip>
            <q-badge :label="useSuggestionsStore().getSuggestions(['NEW', 'DECISION_DELAYED']).length" />
          </q-btn>
          <q-menu :offset="[0, 7]">
            <q-list style="min-width: 200px">
              <q-item
                clickable
                v-close-popup
                v-ripple
                @click="suggestionDialog(s)"
                v-for="s in useSuggestionsStore().getSuggestions(['NEW', 'DECISION_DELAYED'])">
                <q-item-section avatar>
                  <q-icon color="primary" :name="s.img ? s.img : 'rss_feed'" />
                </q-item-section>
                <q-item-section>
                  <div>{{ s.title }}</div>
                  <div class="text-caption">{{ s.msg }}</div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </span>

        <ToolbarButton
          :feature="FeatureIdent.GROUP_BY_DOMAIN"
          :drawer="DrawerTabs.GROUP_BY_HOST_TABS"
          icon="o_dns"
          tooltip="Your tabs grouped by domain" />

        <!--        <ToolbarButton-->
        <!--          :feature="FeatureIdent.RSS"-->
        <!--          :drawer="DrawerTabs.RSS"-->
        <!--          icon="o_rss_feed"-->
        <!--          tooltip="Access to your rss feed" />-->

        <ToolbarButton
          v-if="useFeaturesStore().hasFeature(FeatureIdent.BOOKMARKS)"
          :drawer="DrawerTabs.BOOKMARKS"
          color="warning"
          icon="o_bookmark"
          tooltip="Access to your bookmarks" />

        <!--        <ToolbarButton-->
        <!--          :drawer="DrawerTabs.OPEN_TABS"-->
        <!--          icon="o_playlist_add"-->
        <!--          tooltip="Show Open Tabs View"-->
        <!--          :restricted="$q.platform.is.chrome" />-->

        <!--        <ToolbarButton-->
        <!--          v-if="useFeaturesStore().hasFeature(FeatureIdent.TAGS)"-->
        <!--          :drawer="DrawerTabs.TAGS_VIEWER"-->
        <!--          icon="o_label"-->
        <!--          tooltip="Show tags viewer"-->
        <!--          :restricted="$q.platform.is.chrome" />-->

        <div>
          <q-btn @click="toggleSettings" flat size="12px" class="q-mr-md" icon="o_settings"> </q-btn>
          <q-menu :offset="[0, 7]">
            <q-list style="min-width: 200px">
              <q-item clickable @click="router.push('/mainpanel/settings')">Settings</q-item>
              <!--              <q-item clickable @click="tabsClicked(DrawerTabs.FEATURES)" v-close-popup>-->
              <!--                Activate more Features-->
              <!--              </q-item>-->
              <q-item clickable @click="showImportDialog" v-close-popup> Import Tabsets </q-item>
              <q-item clickable @click="showExportDialog" v-close-popup> Export Tabsets </q-item>
            </q-list>
          </q-menu>
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
      <FullpageNavigation></FullpageNavigation>
    </q-drawer>

    <q-drawer
      v-model="useUiStore().rightDrawerOpen"
      side="right"
      bordered
      content-class="column justify-between no-wrap bg-grey-1">
      <DrawerRight />
    </q-drawer>

    <q-page-container>
      <router-view />
      <!--      <div id="fixed-footer" class="q-pl-md q-pa-xs">{{ useUiStore().footerInfo }}</div>-->
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { useMeta, useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { EXTENSION_NAME } from 'src/boot/constants'
import DrawerRight from 'src/core/components/DrawerRight.vue'
import FullpageNavigation from 'src/core/components/FullpageNavigation.vue'
import ToolbarButton from 'src/core/components/widgets/ToolbarButton.vue'
import { useUtils } from 'src/core/services/Utils'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import OpenTabsThresholdWidget from 'src/opentabs/widgets/OpenTabsThresholdWidget.vue'
import SearchWidget from 'src/search/widgets/SearchWidget.vue'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import SpacesSelectorWidget from 'src/spaces/widgets/SpacesSelectorWidget.vue'
import SuggestionDialog from 'src/suggestions/dialogues/SuggestionDialog.vue'
import { Suggestion } from 'src/suggestions/domain/models/Suggestion'
import { useSuggestionsService } from 'src/suggestions/domain/SuggestionsServices'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import ExportDialog from 'src/tabsets/dialogues/ExportDialog.vue'
import ImportDialog from 'src/tabsets/dialogues/ImportDialog.vue'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { DrawerTabs, useUiStore } from 'src/ui/stores/uiStore'
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const router = useRouter()

const leftDrawerOpen = ref($q.screen.gt.sm)

const spacesStore = useSpacesStore()

const spacesOptions = ref<object[]>([])
const relevantSuggestions = ref<Suggestion[]>([])

const { inBexMode } = useUtils()

$q.loadingBar.setDefaults({
  color: 'positive',
  size: '10px',
  position: 'top',
})

const settingsClicked = ref(false)

watchEffect(() => {
  relevantSuggestions.value = useSuggestionsStore().getSuggestions(['NEW', 'DECISION_DELAYED'])
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
  const extensionName = EXTENSION_NAME
  return inBexMode() ? extensionName : process.env.MODE === 'spa' ? extensionName + ' Web' : extensionName + ' Pro'
}

const goHome = () => router.push('/')

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
  useUiStore().toggleLeftDrawer()
}

const tabsClicked = (tab: DrawerTabs, data: object = {}) => useUiStore().rightDrawerSetActiveTab(tab)

const showExportDialog = () => $q.dialog({ component: ExportDialog })
const showImportDialog = () => $q.dialog({ component: ImportDialog })

const suggestionDialog = (s: Suggestion) =>
  $q.dialog({
    component: SuggestionDialog,
    componentProps: {
      suggestion: s,
    },
  })

const dependingOnStates = () =>
  useSuggestionsService().hasSuggestionsInState(relevantSuggestions.value, ['NEW']) ? 'warning' : 'white'

const suggestionsLabel = () => {
  return useSuggestionsService().suggestionsInsState(relevantSuggestions.value, ['NEW']).length > 0
    ? 'New Suggestions'
    : ''
}

const toggleSettings = () => (settingsClicked.value = !settingsClicked.value)
</script>
