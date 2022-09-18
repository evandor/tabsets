<template>
  <q-layout view="hHh lpR fFr">
    <q-header elevated>
      <q-toolbar>

        <q-toolbar-title @click="goHome()" class="cursor-pointer">
            Tabsets
        </q-toolbar-title>

        <q-input dark dense standout v-model="search"
                 ref="searchBox"
                 style="width:360px;"
                 v-if="tabsStore.tabsets.size > 0"
                 @keydown.enter.prevent="submitSearch()"
                 class="q-ml-md">
          <template v-slot:prepend>
            <q-icon v-if="search === ''" name="search"/>
            <q-icon v-else name="clear" class="cursor-pointer" @click="search = ''"/>
          </template>
        </q-input>

        <q-space/>

        <q-space/>

        <!--        <q-space/>-->
        <!--        <div v-if="tabsStore.active" class="q-mr-md">Layout</div>-->
        <!--        <q-icon name="grid_on" class="q-mr-md"></q-icon>&nbsp;-->
        <!--        <q-icon name="list"></q-icon>-->

        <q-space/>

        <div v-if="tabsStore.pendingTabset?.tabs.length > 0 && tabsStore.tabsets.size > 1" class="q-mr-lg">
          {{tabsStore.pendingTabset?.tabs.length}} unassigned tab(s)
        </div>

        <q-btn outline rounded color="secondary" label="new tabset" class="q-mr-lg">
          <q-popup-edit
            :model-value="newTabsetName"
            v-slot="scope"
            :validate="val => val.trim().length > 0"
            @update:model-value="val => createNewTabset( val)">
            <q-input
              v-model="scope.value"
              dense autofocus
              hint="new tabset's name"
              @keyup.enter="scope.set"
              :rules="[val => scope.validate(val) || 'More than 1 character required']">
              <template v-slot:after>
                <q-btn
                  flat dense color="negative" icon="cancel"
                  @click.stop.prevent="scope.cancel"
                />

                <q-btn
                  flat dense color="positive" icon="check_circle"
                  @click.stop.prevent="scope.set"
                  :disable="scope.validate(scope.value) === false || scope.initialValue === scope.value"
                />
              </template>
            </q-input>
          </q-popup-edit>
        </q-btn>

        <!--        <q-toggle-->
        <!--          left-label-->
        <!--          color="green"-->
        <!--          v-model="tabsStore.active"-->
        <!--          label=""-->
        <!--        />-->

        <!--        <div v-if="tabsStore.active" class="q-mr-lg">Tracking active&nbsp;-->
        <!--          <q-badge v-if="tabsStore.pendingTabset?.tabs.length > 0 && tabsStore.tabsets.size > 1"-->
        <!--                   align="top" color="red" class="q-mr-lg">{{ tabsStore.pendingTabset?.tabs.length }}-->
        <!--            <q-tooltip>There are pending tabs, which can be assigned to a tabset</q-tooltip>-->
        <!--          </q-badge>-->
        <!--        </div>-->
        <!--        <div v-if="!tabsStore.active" class="q-mr-lg">Tracking stopped-->
        <!--          <q-badge v-if="tabsStore.pendingTabset?.tabs.length > 0 && tabsStore.tabsets.size > 1"-->
        <!--                   align="top" color="grey" class="q-mr-lg">{{ tabsStore.pendingTabset?.tabs.length }}-->
        <!--            <q-tooltip>Tracking has stopped, but there are some pending tabs which can be assigned to a tabset-->
        <!--            </q-tooltip>-->
        <!--          </q-badge>-->
        <!--        </div>-->


        <div>
            v{{ appVersion }}
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above v-model="leftDrawerOpen" side="right" bordered>
      <Navigation></Navigation>

      <q-footer class="bg-white text-black">
        <div class="q-ma-sm">
          {{ notificationsStore.info }}
          <TabInfo></TabInfo>
        </div>
      </q-footer>


    </q-drawer>

    <q-page-container>
      <router-view/>
    </q-page-container>


  </q-layout>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref, watchEffect} from 'vue';
import {useQuasar} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {useTabGroupsStore} from "stores/tabGroupsStore";
import {useRouter} from "vue-router";
import {useMeta} from 'quasar'
import {useNotificationsStore} from "stores/notificationsStore";
import TabInfo from "src/components/layouts/TabInfo.vue"
import Navigation from "src/components/Navigation.vue"
import TabsetService from "src/services/TabsetService";
import {useSearchStore} from "stores/searchStore";

const router = useRouter()
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const searchStore = useSearchStore()

const notificationsStore = useNotificationsStore()

const $q = useQuasar()

const newTabsetName = ref('')
const caption = ref('yyy')
const search = ref('')

const localStorage = useQuasar().localStorage
//@ts-ignore
const appVersion = import.meta.env.PACKAGE_VERSION
const leftDrawerOpen = ref(true)
const searchBox = ref(null)

useMeta(() => {
  return {
    title: tabsStore.title
  }
})

watchEffect(() => {
  if (tabsStore.active !== null) {
    localStorage.set("active", tabsStore.active)
  }
})

function checkKeystroke(e:any ) {
  if (e.key === '/') {
    console.log("e", e, searchBox, search.value)
    // @ts-ignore
    searchBox.value.focus()
    search.value = ''
    console.log("e2", search.value)
  }
}

onMounted(() => {
  window.addEventListener('keypress', checkKeystroke);
})

onUnmounted(() => {
  window.removeEventListener('keypress', checkKeystroke);
})

function tabsForGroup(groupId: number): chrome.tabs.Tab[] {
  return tabsStore.tabsForGroup(groupId)
}

function submitSearch() {
  console.log("s", search.value)
  searchStore.term = search.value
  router.push("/search/" + search.value)
}

const goHome = () => router.push("/tabset")

const createNewTabset = (newName: string) => {
  TabsetService.saveOrReplace(newName, [], true)
    .then((result: object) => {
      // populate pending set
      TabsetService.createPendingFromBrowserTabs()


      //@ts-ignore
      const replaced = result.replaced
      //@ts-ignore
      const merged = result.merged
      let message = 'Tabset ' + newName + ' created successfully'
      if (replaced && merged) {
        message = 'Tabset ' + newName + ' was updated'
      } else if (replaced) {
        message = 'Tabset ' + newName + ' was overwritten'
      }
      router.push("/tabset")
      $q.notify({
        message: message,
        type: 'positive'
      })
    }).catch((ex: any) => {
    console.error("ex", ex)
    $q.notify({
      message: 'There was a problem creating the tabset ' + newName,
      type: 'warning',
    })

  })
}



</script>
