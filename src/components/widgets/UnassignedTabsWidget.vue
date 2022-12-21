<template>
  {{ tabsStore.pendingTabset?.tabs.length }} new unassigned {{ tabsStore.pendingTabset?.tabs.length > 1 ? 'Tabs' : 'Tab'}}
  <q-menu :offset="[0, 15]">
    <q-list style="min-width: 200px">
      <q-item clickable v-close-popup @click="openUnassigendTabs()">
        <q-item-section>Show unassigned tabs</q-item-section>
      </q-item>
<!--      <q-separator/>
      <q-item disable>
        Close some tabs:
      </q-item>
      <q-item
        :disable="tabsStore.tabsets?.size === 0"
        clickable v-close-popup @click="TabsetService.closeTrackedTabs()">
        <q-item-section>&bull; Close all tracked tabs</q-item-section>
      </q-item>
      <q-separator/>
      <q-item clickable v-close-popup @click="router.push('/settings')">
        <q-item-section>Change Settings</q-item-section>
      </q-item>-->
    </q-list>
  </q-menu>
</template>

<script lang="ts" setup>
import {useTabsStore} from "stores/tabsStore";
import {useRouter} from "vue-router";
import TabsetService from "src/services/TabsetService"
import {useUiService} from "src/services/useUiService";
import {LeftDrawerTabs} from "stores/uiStore";

const tabsStore = useTabsStore()
const router = useRouter()

const openUnassigendTabs = () => {
  useUiService().leftDrawerSetActiveTab(LeftDrawerTabs.UNASSIGNED_TABS)
}
</script>
