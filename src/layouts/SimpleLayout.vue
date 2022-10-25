<template>
  <q-layout view="hHh lpR fFf">

    <q-header elevated>
      <q-toolbar>

        <q-toolbar-title @click="goHome()" class="cursor-pointer">
          {{ title() }}
        </q-toolbar-title>



        <q-space/>


        <q-space/>


        <span class="q-pr-lg" style="cursor: pointer" v-if="featuresStore.firebaseEnabled && auth.user">
          <q-icon name="person" class="q-mr-md" size="28px"></q-icon>
          <span>{{ auth.user?.email }}</span>
          <q-menu
            touch-position
          >
            <q-list dense style="min-width: 100px">
              <q-item clickable v-close-popup>
                <q-item-section @click="logout()">Logout</q-item-section>
              </q-item>
            </q-list>

          </q-menu>
        </span>


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
    .catch(error => {
      //this.handleError(error)
    })
}

</script>
