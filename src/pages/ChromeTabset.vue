<template>
  <q-page padding>

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
        v-if="pinnedTabs().length > 0"
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
          <q-item-section>{{ formatLength(pinnedTabs().length, 'tab', 'tabs') }}</q-item-section>
        </template>
        <q-card>
          <q-card-section style="background-color:#efefef">
            <TabcardsSmall :tabs="pinnedTabs()"/>
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
        v-if="tabsStore.browserTabset?.tabs.length > 0 || tabGroupsStore.tabGroups.length > 0"
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
          <q-radio v-model="merge" val="true" label="Merge" v-if="tabNameExists()"></q-radio>
          <q-radio v-model="merge" val="false" label="Overwrite" v-if="tabNameExists()"></q-radio>
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancel" v-close-popup/>
          <q-btn flat label="Create new Tabset"
                 :disable="newTabsetName.trim().length === 0 || newTabsetName.trim() === 'current'" v-close-popup
                 @click="saveTabset()"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
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
const merge = ref("false")

const $q = useQuasar()

// --- new tabset dialog
const showNewTabsetDialog = ref(false)
const newTabsetName = ref('')

// const clearTabs = ref(false)

function unpinnedNoGroup(): Tab[] {
  return _.filter(
    tabsStore.browserTabset?.tabs,
    //@ts-ignore
    (t: Tab) => !t.chromeTab.pinned && t.chromeTab.groupId === -1)
}

function tabsForGroup(groupId: number): Tab[] {
  //console.log("tabsforGroup", groupId)
  return _.filter(tabsStore.browserTabset?.tabs,
    //_.map(tabsStore.getCurrentTabs, t => t.chromeTab),
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

const newTabsetDialogWarning = () => {
  if (newTabsetName.value.trim() === 'current') {
    return "Please use a different name, 'current' is reserved"
  }
  if (tabsStore.nameExistsInContextTabset(newTabsetName.value)) {
    return "Tabset " + newTabsetName.value + " already exists. Please choose:"
  }
  return ""
}

const saveTabset = () => {
  const tsName = newTabsetName.value
  TabsetService.saveOrReplace(tsName, tabsStore.tabs, merge.value == 'true')
    .then(result => {
      //@ts-ignore
      const replaced = result.replaced
      //@ts-ignore
      const merged = result.merged
      let message = 'Tabset ' + tsName + ' created successfully'
      if (replaced && merged) {
        message = 'Tabset ' + tsName + ' was updated'
      } else if (replaced) {
        message = 'Tabset ' + tsName + ' was overwritten'
      }
      router.push("/tabset")
      $q.notify({
        message: message,
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

const tabNameExists = () => tabsStore.nameExistsInContextTabset(newTabsetName.value)

const pinnedTabs = (): Tab[] => {
  return _.filter(tabsStore.browserTabset?.tabs, (t: Tab) => t.chromeTab.pinned)
}

</script>
