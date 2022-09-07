<template>

  <!--  <q-banner rounded class="bg-amber-1 text-black q-mb-lg" v-if="tabsStore.tabsets.size <= 1">-->
  <!--    <div class="text-body2" >-->
  <!--      Currently, your <b>browser tabs</b> are <b>not tracked</b> by this extension and you do not have any tabsets defined.<br>-->
  <!--      Below, you see <b>all your open tabs</b> in this browser's window right now. Open a new tab, and you will see the new tab-->
  <!--      appearing here as well.-->
  <!--      <br><br>-->
  <!--      <b>Click on</b> <q-icon color="primary" name="save" /> to <b>create your first tabset</b> and start tracking tab changes.-->
  <!--    </div>-->
  <!--  </q-banner>-->

  <q-toolbar class="text-primary q-mb-lg">

    <q-toolbar-title>
      <div class="row justify-start items-baseline">
        <div class="col-1 text-black">Open tabs</div>
      </div>
      <!--      <div class="row justify-start items-baseline">-->
      <!--        <div class="text-caption">You can save your current tabs and give the new set a name</div>-->
      <!--      </div>-->
    </q-toolbar-title>
    <q-btn flat dense icon="save" label="Save as Tabset..." @click="showNewTabsetDialog = true"/>
  </q-toolbar>

  <q-list class="rounded-borders">

    <q-expansion-item
      v-if="tabsStore.pinnedTabs.length > 0"
      header-class="bg-amber-1 text-black"
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
        <q-card-section style="background-color:#efefef">
          <TabcardsSmall :tabs="tabsStore.pinnedTabs"/>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <!-- chrome groups -->
    <div v-for="group in tabGroupsStore.tabGroups">
      <q-expansion-item
        v-if="tabsForGroup(group.id).length > 0"
        header-class="bg-amber-1 text-black"
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
          <q-card-section style="background-color:#efefef">
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
      header-class="bg-amber-1 text-black"
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
        <q-card-section style="background-color:#efefef">
          <TabcardsSmall :tabs="unpinnedNoGroup()"/>
        </q-card-section>
      </q-card>
    </q-expansion-item>
    <div v-else>
      <q-card>
        <q-card-section style="background-color:#efefef">
          <TabcardsSmall :tabs="unpinnedNoGroup()"/>
        </q-card-section>
      </q-card>
    </div>
  </q-list>

  <q-dialog v-model="showNewTabsetDialog">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Save open Tabs as Tabset</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">Please provide a name for the new tabset</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body">New Tabset's name:</div>
        <q-input dense v-model="newTabsetName" autofocus @keyup.enter="prompt = false"/>
        <!--        <q-checkbox v-model="clearTabs" label="close current Tabs"/>-->
        <div class="text-body2 text-warning">{{ newTabsetDialogWarning() }}</div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" v-close-popup/>
        <q-btn flat label="Create new Tabset"
               :disable="newTabsetName.trim().length === 0 || newTabsetName.trim() === 'current'" v-close-popup
               @click="saveTabset()"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {useQuasar} from "quasar";
import TabcardsSmall from "src/components/layouts/TabcardsSmall.vue";
import _ from "lodash"
import {useTabsStore} from "src/stores/tabsStore";
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

// --- new tabset dialog
const showNewTabsetDialog = ref(false)
const newTabsetName = ref('')

// const clearTabs = ref(false)

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

const newTabsetDialogWarning = () => {
  if (newTabsetName.value.trim() === 'current') {
    return "Please use a different name, 'current' is reserved"
  }
  const existingNames = _.map([...tabsStore.tabsets.values()], ts => ts.name)
  if (_.find(existingNames, name => name === newTabsetName.value.trim())) {
    return "Tabset " + newTabsetName.value + " already exists and will be overwritten."
  }
  return ""
}

const saveTabset = () => {
  const tsName = newTabsetName.value
  TabsetService.saveOrReplace(tsName, tabsStore.tabs)
    .then(wasNew => {
      $q.notify({
        message: wasNew ? 'Tabset ' + tsName + ' created successfully' : 'Tabset ' + tsName + 'was overwritten',
        type: 'positive'
      })
    }).catch(ex => {
    console.error("ex", ex)
    $q.notify({
      message: 'There was a problem creating the tabset ' + tsName,
      type: 'warning',
    })
  })

}

</script>
