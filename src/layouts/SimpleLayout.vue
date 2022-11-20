<template>
  <q-layout view="hHh lpR fFf">

    <q-header elevated>
      <q-toolbar>

        <q-toolbar-title @click="goHome()" class="cursor-pointer">
          {{ title() }}
        </q-toolbar-title>



        <q-space/>


        <q-space/>



        <div>
          v{{ appVersion }}
        </div>
      </q-toolbar>
    </q-header>

<!--    <q-drawer show-if-above v-model="rightDrawerOpen" side="right" bordered-->
<!--              content-class="column justify-between no-wrap bg-grey-1">-->
<!--      <Navigation></Navigation>-->

<!--    </q-drawer>-->

    <q-page-container>
      <router-view/>
    </q-page-container>



  </q-layout>
</template>

<script setup lang="ts">
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {useRouter} from "vue-router";

const featuresStore = useFeatureTogglesStore()
const auth = useAuthStore()
const router = useRouter()

//@ts-ignore
const appVersion = import.meta.env.PACKAGE_VERSION

const title = () => {
  return auth.isAuthenticated ? 'TabsetsPro' : 'Tabsets'
}
const goHome = () => router.push("/")


const logout = () => {
  console.log("logout!")

  auth.logout()
    .then(() => {
      router.push("/about")
    })
    .catch(() => {
      //this.handleError(error)
    })
}

</script>
