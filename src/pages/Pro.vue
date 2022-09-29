<template>
  <q-page padding>

    <div class="text-h5 q-ma-md">
      Tabsets vs Tabsets Pro
    </div>

    <div class="text-body1 q-ma-md">
      <span class="text-body1 text-dark">Tabsets</span> is a browser extension which helps you organize your tabs.<br><br>
      Your data is stored locally in the browser you are using and you cannot access it
      from anywhere else.
    </div>
    <div class="text-body1 q-ma-md">
      <span class="text-body1 text-dark">Tabsets Pro</span> offers the same features as <span class="text-body1 text-dark">Tabsets</span>, and adds:
      <ul>
        <li>cloud storage</li>
      </ul>
    </div>

    <div class="text-h5 q-ma-md">
      <ul>
        <li>Cloud Storage</li>
        <li>Tabsets Sharing (Planned)</li>
        <li>Bookmarks Integration (Planned)</li>
        <li>Advanced Search (Planned)</li>
      </ul>
    </div>

    <div class="text-body1 q-ma-md">
      Your data - that is your tabsets - is stored in the cloud. So it is possible, once you login, to access your
      information from any chrome browser from anywhere.
    </div>

    <div>

      <div class="text-h5 q-ma-md">
        Get started with <span class="text-dark">Tabsets Pro</span>
      </div>

      <div class="text-body1 q-ma-md">
        Click <span class="cursor-pointer text-blue" @click="router.push('/login')"><u>here</u></span> to create a new account.
        You can test it for 14 days and then decide if you want to keep it or get back to <span class="text-body1 text-dark">Tabsets Free</span>.
      </div>
    </div>

    <fab></fab>
  </q-page>

</template>

<script setup lang="ts">
import {useTabsStore} from "src/stores/tabsStore"
import Fab from "src/components/Fab.vue"
import {useRouter} from "vue-router";

const tabsStore = useTabsStore()
const router = useRouter()
</script>
