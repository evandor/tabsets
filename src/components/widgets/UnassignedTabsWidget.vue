<template>
  <div class="no-wrap">
    {{ tabsStore.pendingTabset?.tabs.length }} new unassigned
    {{ tabsStore.pendingTabset?.tabs.length > 1 ? 'Tabs' : 'Tab' }}
  </div>
  <q-menu :offset="[0, 15]">
    <q-list style="min-width: 200px">
      <q-item clickable v-close-popup @click="openUnassigendTabs()">
        <q-item-section>Show unassigned tabs</q-item-section>
      </q-item>
      <q-item clickable v-close-popup @click="newTabsetFromUnassigndTabs">
        <q-item-section>Create new tabset from those tabs</q-item-section>
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
import {useTabsStore} from "src/stores/tabsStore";
import {useRouter} from "vue-router";
import NewTabsetDialog from "src/components/dialogues/NewTabsetDialog.vue"
import {DrawerTabs} from "src/stores/uiStore";
import {useQuasar} from "quasar";

const tabsStore = useTabsStore()
const router = useRouter()
const $q = useQuasar()

//const openUnassigendTabs = () =>
//  useUiService().leftDrawerSetActiveTab(DrawerTabs.UNASSIGNED_TABS)

const newTabsetFromUnassigndTabs = () => $q.dialog(
  {
    component: NewTabsetDialog,
    componentProps: {
      setEmptyByDefault: false,
    }
  })
</script>
