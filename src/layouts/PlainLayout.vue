<template>
  <q-layout view="hHh lpR fFf">


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
import {useFeatureTogglesStore} from "stores/featureTogglesStore";
import {useAuthStore} from "src/stores/auth"

const router = useRouter()
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const searchStore = useSearchStore()
const auth = useAuthStore()

const notificationsStore = useNotificationsStore()
const featuresStore = useFeatureTogglesStore()

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

const goHome = () => router.push("/about")
const openSettingsPage = () => router.push("/settings")

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

const  logout = () => {
  console.log("logout!")

  auth.logout()
    .then((res:any) => {
      //this.localStorage.remove("skysailcms.uid")
      //this.byeNotification()
      this.router.push("/about")
    })
    .catch(error => {
      //this.handleError(error)
    })
}

</script>
