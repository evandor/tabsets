<template>

  <q-banner rounded class="bg-amber-1 text-black q-mb-lg" v-if="tabsStore.tabsets.size <= 1">
    <div class="text-body2" >
      Currently, your <b>browser tabs</b> are <b>not tracked</b> by this extension and you do not have any tabsets defined.<br>
      Below, you see <b>all your open tabs</b> in this browser's window right now. Open a new tab, and you will see the new tab
      appearing here as well.
      <br><br>
      <b>Click on</b> <q-icon color="primary" name="save" /> to <b>create your first tabset</b> and start tracking tab changes.
    </div>
  </q-banner>

  <q-toolbar class="text-primary">
    <q-btn flat round dense icon="tabs"/>

    <q-toolbar-title>
      <div class="row justify-start items-baseline">
        <div class="col-1 text-black">Current tabs of this browser's window</div>
      </div>
      <div class="row justify-start items-baseline">
        <div class="text-caption">You can save your current tabs and give the new set a name. Or you can start a new tabset from scratch by
          closing all open tabs</div>
      </div>
    </q-toolbar-title>
    <q-btn flat round dense icon="save" @click="saveDialog"/>
    <q-btn flat round dense icon="restore_page"
           color="green"
           @click="restoreDialog" v-if="tabsStore.currentTabsetId !== 'current'"/>
    <q-btn flat round dense icon="delete"
           color="red"
           @click="deleteDialog" v-if="tabsStore.currentTabsetId !== 'current'"/>
  </q-toolbar>

  <q-list class="rounded-borders">

    <q-expansion-item
      v-if="tabsStore.pinnedTabs.length > 0"
      header-class="bg-amber-2 text-black"
      expand-icon-class="text-black"
      expand-separator
      default-opened>
      <template v-slot:header="{ expanded }">
        <q-item-section avatar>
          <q-icon name="push_pin"/>
        </q-item-section>
        <q-item-section>
          <div>
            <span class="text-weight-bold">Pinned Tabs</span>
            <div class="text-caption">this browser's window's tabs which are pinned right now</div>
          </div>
        </q-item-section>
        <q-item-section>{{ formatLength(tabsStore.pinnedTabs.length, 'tab', 'tabs') }}</q-item-section>
      </template>
      <q-card>
        <q-card-section>
          <TabcardsSmall :tabs="tabsStore.pinnedTabs"/>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <!-- chrome groups -->
    <div v-for="group in tabGroupsStore.tabGroups">
      <q-expansion-item
        v-if="tabsForGroup(group.id).length > 0"
        header-class="bg-amber-2 text-black"
        expand-icon-class="text-black"
        expand-separator
        default-opened>
        <template v-slot:header="{ expanded }">
          <q-item-section avatar>
            <q-icon :color="group.color" name="tab"/>
          </q-item-section>

          <q-item-section>
            <div>
              <span class="text-weight-bold">{{ group.title }}</span>
              <div class="text-caption">chrome browser's group of tabs</div>
              <!--                <q-btn label="create new tabset" v-if="expanded" @click="newTabsetFrom(group.title, group.id)"/>-->

            </div>
          </q-item-section>
          <q-item-section>{{ formatLength(tabsForGroup(group.id).length, 'tab', 'tabs') }}</q-item-section>
        </template>
        <q-card>
          <q-card-section>
            <TabcardsSmall :tabs="tabsForGroup( group.id)"/>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </div>

    <!-- rest: neither pinned, grouped, or pending -->
    <q-expansion-item
      v-if="tabsStore.pinnedTabs.length > 0 || tabGroupsStore.tabGroups.length > 0"
      icon="tabs"
      default-opened
      header-class="bg-amber-2 text-black"
      expand-icon-class="text-black">
      <template v-slot:header="{ expanded }">
        <q-item-section avatar>
          <q-icon name="tab"/>
        </q-item-section>

        <q-item-section>
          <div>
            <span class="text-weight-bold">Other Tabs</span>
            <div class="text-caption">current tabs, neither pinned nor grouped</div>
            <!--                <q-btn label="create new tabset" v-if="expanded" @click="newTabsetFrom(group.title, group.id)"/>-->
          </div>
        </q-item-section>
        <q-item-section>{{ formatLength(unpinnedNoGroup().length, 'tab', 'tabs') }}</q-item-section>
      </template>
      <q-card>
        <q-card-section>
          <TabcardsSmall :tabs="unpinnedNoGroup()"/>
        </q-card-section>
      </q-card>
    </q-expansion-item>
    <div v-else>
      <q-card>
        <q-card-section>
          <TabcardsSmall :tabs="unpinnedNoGroup()"/>
        </q-card-section>
      </q-card>
    </div>
  </q-list>

</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {useQuasar} from "quasar";
import TabcardsSmall from "src/components/layouts/TabcardsSmall.vue";
import _ from "lodash"
import {useTabsStore} from "stores/tabsStore";
import {useTabGroupsStore} from "stores/tabGroupsStore";
import TabsetService from "src/services/TabsetService";
import {Tab, TabStatus} from "src/models/Tab";

const route = useRoute();
const router = useRouter();
const localStorage = useQuasar().localStorage
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const tabsetname = ref(tabsStore.currentTabsetName)
const $q = useQuasar()

function unpinnedNoGroup() {
  return _.filter(
    _.map(tabsStore.getCurrentTabs, t => {
      //console.log("t", t)
      return t
    }),
    (t: Tab) => !t.chromeTab.pinned && t.chromeTab.groupId === -1 && (t.status === TabStatus.DEFAULT || !t.status))
}

function tabsForGroup(groupId: number) {
  console.log("tabsforGroup", groupId)
  return _.filter(
    _.map(tabsStore.getCurrentTabs, t => t.chromeTab || t),
    (t: any) => t.groupId === groupId)
}

const update = (tabsetIdent: object) => {
  console.log("selected tabset now: ", tabsetIdent)
  tabsetname.value = tabsetIdent['label' as keyof object]
  tabsStore.selectCurrentTabset(tabsetIdent['value' as keyof object])
}

const formatLength = (length: number, singular: string, plural: string) => {
  return length > 1 ? length + ' ' + plural : length + ' ' + singular
}

const saveDialog = () => {
  $q.dialog({
    title: 'Save open Tabs as Tabset',
    message: 'Please provide a name for the new (or updated) tabset',
    prompt: {
      isValid: val => val != 'current',
      model: tabsetname.value === 'current' ? '' : tabsetname.value,
      type: 'text' // optional
    },
    cancel: true,
    persistent: true
  }).onOk((name: string) => {
    console.log('>>>> saving', name)
    TabsetService.saveOrReplace(name, tabsStore.tabs)
  }).onCancel(() => {
  }).onDismiss(() => {
  })


}


</script>
