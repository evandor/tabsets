<template>
  <q-page padding>

    <div class="row justify-center items-center" style="height:500px">
      <div class="text-h5 content-center">
        Welcome to Tabsets
      </div>
    </div>


  </q-page>

</template>

<script setup lang="ts">
import {useQuasar} from "quasar";
import {useRouter} from "vue-router";
import {useAuth0, User} from "@auth0/auth0-vue";
import {onMounted, ref, watchEffect} from "vue";
import {useAuthStore} from "stores/auth";
import {useTabsStore} from "stores/tabsStore";
import PouchDbPersistenceService from "src/services/PouchDbPersistenceService";

const $q = useQuasar()
const router = useRouter()
const auth0 = useAuth0()
const authStore = useAuthStore()

let timer
const tabsStore = useTabsStore()

const isAuthenticated = ref(auth0.isAuthenticated)
const isLoading = ref(auth0.isLoading)
const user = ref<undefined | User>(auth0.user)

onMounted(() => {
  console.log("AboutProPage.vue mounted")
})

watchEffect(() => {
  console.log("watchging", auth0.user.value)
  console.log("watchging2", user.value)
  if (isAuthenticated.value && auth0.user.value) {
    console.log("setting user", auth0.user.value)
    authStore.setUser(auth0.user.value)
    authStore.setAuth0(auth0)
    PouchDbPersistenceService.initRemoteDb()
  }
})

$q.loading.show({
  message: 'Initializing tabsets. Please hang on...'
})
timer = setTimeout(() => {
  if (tabsStore.tabsets.size === 0) {
    router.push("/about")
  } else {
    router.push("/tabset")
  }
  setTimeout(() => {
    $q.loading.hide()
  }, 500)
  timer = void 0
}, 2000)


</script>
