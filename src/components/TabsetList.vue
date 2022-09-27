<template>


   <q-banner rounded class="bg-amber-1 text-black" v-if="tabsStore.active && tabsStore.getCurrentTabs.length === 0">
    <div class="text-body2">
      To start adding new tabs to this empty tabset, open new browser tabs and come back to this extension to
      associate them with a tabset.
    </div>
  </q-banner>

  <q-toolbar class="text-primary">
    <div class="row fit">
      <div class="col-xs-12 col-md-5">
        <q-toolbar-title>
          <div class="row justify-start items-baseline">
            <div class="col-1" style="width:80px"
                 v-text="'Tabset \'' + tabsStore.currentTabsetName +  '\''"></div>
          </div>
        </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-7 text-right">
        <!--        <q-btn flat dense icon="save_as" :label="$q.screen.gt.sm ? 'Save or Rename...' : ''"-->
        <!--               class="q-mr-md"-->
        <!--               @click="saveDialog">-->
        <!--          <q-tooltip>Save tabset as...</q-tooltip>-->
        <!--        </q-btn>-->

        <q-btn v-if="tabsStore.getCurrentTabset?.tabs.length > 0"
               flat dense icon="restore_page"
               color="green" :label="$q.screen.gt.sm ? 'Open Tabset...' : ''"
               class="q-mr-md"
               @click="restoreDialog">
          <q-tooltip>Replace your current tabs with all the tabs from this tabset</q-tooltip>
        </q-btn>
        <q-btn flat dense icon="delete"
               color="red" :label="$q.screen.gt.sm ? 'Delete Tabset...' : ''"
               @click="deleteDialog">
          <q-tooltip>Delete this tabset</q-tooltip>
        </q-btn>
      </div>
    </div>
  </q-toolbar>

  <q-list class="rounded-borders">

    <!-- pending tabs -->
    <q-expansion-item
      v-if="tabsStore.pendingTabset?.tabs.length > 0"
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
            <span class="text-weight-bold">Pending Tabs</span>
            <div class="text-caption">These tabs have been used in the current context but have not been saved yet
            </div>
          </div>
        </q-item-section>
        <q-item-section>{{ formatLength(tabsStore.pendingTabset?.tabs.length, 'tab', 'tabs') }}</q-item-section>
      </template>
      <!--        <q-card style="background: radial-gradient(circle, #35a2ff 0%, #014a88 100%)">-->
      <div>
        <span class="cursor-pointer" @click="removeClosedTabs()"
              v-if="_.filter(tabsStore.pendingTabs, t => t.status === TabStatus.DELETED).length > 1">[remove all closed tabs]</span>
        <span class="cursor-pointer" @click="saveAllPendingTabs()"
              v-if="tabsStore.pendingTabs.length > 1 ">[save all]</span>
      </div>
      <q-card>
        <q-card-section>
          <Tabcards :tabs="tabsStore.pendingTabset?.tabs" show-actions/>
        </q-card-section>
      </q-card>
    </q-expansion-item>
    <q-expansion-item
      v-if="tabsStore.pinnedTabs.length > 0"
      header-class="text-black"
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

      <Tablist :tabs="tabsStore.pinnedTabs"/>


    </q-expansion-item>

    <!-- chrome groups -->
    <div v-for="group in tabGroupsStore.tabGroups" class="q-pb-lg">
      <q-expansion-item
        v-if="tabsForGroup(group.id).length > 0"
        header-class="text-black"
        expand-icon-class="text-black"
        expand-separator
        default-opened>
        <template v-slot:header="{ expanded }">
          <q-item-section avatar>
            <q-icon :color="group.color" name="tab"/>
          </q-item-section>

          <q-item-section>
            <div>
              <span class="text-weight-bold">Group {{ group.title }}</span>
              <div class="text-caption">chrome browser's group of tabs</div>
              <!--                <q-btn label="create new tabset" v-if="expanded" @click="newTabsetFrom(group.title, group.id)"/>-->

            </div>
          </q-item-section>
          <q-item-section>{{ formatLength(tabsForGroup(group.id).length, 'tab', 'tabs') }}</q-item-section>
        </template>

        <Tablist :tabs="tabsForGroup( group.id)" v-on:sendCaption="setGroupedTabsCaption"/>

      </q-expansion-item>
    </div>

    <!-- rest: neither pinned, grouped, or pending -->
    <q-expansion-item
      v-if="unpinnedNoGroup().length > 0"
      icon="tabs"
      default-opened
      header-class="text-black"
      expand-icon-class="text-black">
      <template v-slot:header="{ expanded }">
        <q-item-section avatar>
          <q-icon name="tab"/>
        </q-item-section>

        <q-item-section>
          <div>
            <span class="text-weight-bold">Other Tabs ({{
                formatLength(unpinnedNoGroup().length, 'tab', 'tabs')
              }})</span>
            <div class="text-caption ellipsis" v-text="otherTabsCaption"></div>
          </div>
        </q-item-section>
        <q-item-section></q-item-section>
      </template>


            <Tablist :tabs="unpinnedNoGroup()"/>
    </q-expansion-item>
    <div v-else>
      <Tablist :tabs="unpinnedNoGroup()"/>
    </div>
  </q-list>

</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {useQuasar} from "quasar";
import Tabcards from "src/components/layouts/Tabcards.vue";
import Tablist from "src/components/layouts/Tablist.vue";
import _ from "lodash"
import {useTabsStore} from "src/stores/tabsStore";
import {useTabGroupsStore} from "src/stores/tabGroupsStore";
import TabsetService from "src/services/TabsetService";
import {Tab, TabStatus} from "src/models/Tab";

const route = useRoute();
const router = useRouter();
const localStorage = useQuasar().localStorage
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const tabsetname = ref(tabsStore.currentTabsetName)

const otherTabsCaption = ref('current tabs, neither pinned nor grouped...')
const groupedTabsCaption = ref('current tabs, neither pinned nor grouped')

const $q = useQuasar()

function unpinnedNoGroup() {
  return _.filter(
    _.map(tabsStore.getCurrentTabs, t => t),
    (t: Tab) => !t.chromeTab.pinned && t.chromeTab.groupId === -1 && (t.status === TabStatus.DEFAULT || !t.status))
}

function tabsForGroup(groupId: number): Tab[] {
  return _.filter(tabsStore.getCurrentTabs,
    //@ts-ignore
    (t: Tab) => t.chromeTab.groupId === groupId)
}

const update = (tabsetIdent: object) => {
  console.log("selected tabset now: ", tabsetIdent)
  tabsetname.value = tabsetIdent['label' as keyof object]
  tabsStore.selectCurrentTabset(tabsetIdent['value' as keyof object])
}


const formatLength = (length: number, singular: string, plural: string) => {
  return length > 1 ? length + ' ' + plural : length + ' ' + singular
}

const removeClosedTabs = () => TabsetService.removeClosedTabs()
const saveAllPendingTabs = () => TabsetService.saveAllPendingTabs()
const removeAllPendingTabs = () => TabsetService.removeAllPendingTabs()

const setOtherTabsCaption = (msg: string) => otherTabsCaption.value = msg
const setGroupedTabsCaption = (msg: string) => groupedTabsCaption.value = msg

const saveDialog = () => {
  $q.dialog({
    title: 'Save current Tabset',
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
    TabsetService.saveOrReplaceFromChromeTabs(name, tabsStore.tabs)

  }).onCancel(() => {
    //console.log('>>>> Cancel')
  }).onDismiss(() => {
    //console.log('I am triggered on both OK and Cancel')
  })


}

const deleteDialog = () => {
  $q.dialog({
    title: 'Deleting Tabset',
    message: 'Would you like to delete this tabset?',
    cancel: true,
    persistent: true
  }).onOk((data: any) => {
    TabsetService.delete(tabsStore.currentTabsetId)
    //router.push("/browser")
  }).onCancel(() => {
  }).onDismiss(() => {
  })


}

const restoreDialog = () => {
  $q.dialog({
    title: 'Restore Tabset',
    message: 'Would you like to restore this tabset? All current tabs will be closed before.',
    cancel: true,
    persistent: true
  }).onOk((data: any) => {
    TabsetService.restore(tabsStore.currentTabsetId)
  }).onCancel(() => {
  }).onDismiss(() => {
  })


}

</script>
