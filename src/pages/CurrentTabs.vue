<template>
  <q-page padding>

    <q-banner rounded class="bg-orange-1 text-blue">

      <div class="text-body1" v-if="!tabsStore.context && tabsStore.currentTabsetId==='current'">
        You can save your current tabs and give the new set a name. Or you can start a new tabset from scratch by closing all open tabs.
      </div>
      <div class="text-body1" v-else-if="!tabsStore.context && tabsStore.currentTabsetId!=='current'">
        You are watching a tabset different from your current tabs!<br>
        If you want, you can restore this tabset
      </div>
      <div class="text-body1" v-else-if="tabsStore.context && tabsStore.currentTabsetName===tabsStore.context">
        You are editing in your context
      </div>
      <div class="text-body1" v-else>
        Context is '{{ tabsStore.context }}', selected tabstore is '{{ tabsStore.currentTabsetId }} (={{tabsStore.currentTabsetName}})'
      </div>
      <template v-slot:action>
        <!--          <q-btn flat color="black" label="Continue as a Guest"/>-->
        <!--          <q-btn flat color="black" label="Sign in"/>-->
      </template>
    </q-banner>

    <q-toolbar class="text-primary">
      <q-btn flat round dense icon="tabs"/>

      <q-toolbar-title>
        <div class="row justify-start items-baseline">
          <div class="col-1" style="width:80px">Tabset</div>
          <div class="col" style="color:#000066">
            <q-select
              borderless
              bg-color="white"
              class="text-h6"
              style="width:200px;"
              :model-value="tabsStore.currentTabsetName"
              @update:model-value="val => update(val)"
              :options="tabsetOptions()">
            </q-select>
          </div>
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

      <!-- pending tabs -->
      <q-expansion-item
        v-if="tabsStore.pendingTabs.length > 0"
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
          <q-item-section>{{ formatLength(tabsStore.pendingTabs.length, 'tab', 'tabs') }}</q-item-section>
        </template>
        <!--        <q-card style="background: radial-gradient(circle, #35a2ff 0%, #014a88 100%)">-->
        <q-card>
          <q-card-section>
            <Tabcards :tabs="tabsStore.pendingTabs"/>
          </q-card-section>
        </q-card>
      </q-expansion-item>
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
            <Tabcards :tabs="tabsStore.pinnedTabs"/>
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
              <Tabcards :tabs="tabsForGroup( group.id)"/>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </div>

      <!-- rest: neither pinned, grouped, or pending -->
      <q-expansion-item
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
            <Tabcards :tabs="unpinnedNoGroup()"/>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </q-list>
  </q-page>

</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {useQuasar} from "quasar";
import Tabcards from "src/components/layouts/Tabcards.vue";
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

watchEffect(() => {
  console.log("context changed", tabsStore.context)
  console.log("tabset changed", tabsStore.context)
})

function unpinnedNoGroup() {
  return _.filter(
    _.map(tabsStore.getCurrentTabs, t => t),
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

const tabsetOptions = () => {
  return _.map([...tabsStore.tabsets.values()], ts => {
    return {
      label: ts.name,
      value: ts.id
    }
  })
}

const formatLength = (length: number, singular: string, plural: string) => {
  return length > 1 ? length + ' ' + plural : length + ' ' + singular
}

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
    TabsetService.saveOrReplace(name, tabsStore.tabs)

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
    router.push("/")
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
