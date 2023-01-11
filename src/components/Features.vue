<template>

  <div class="q-ma-md">
    Optional Features
  </div>

  <q-card flat v-for="f in optionalFeatures">
    <q-card-section class="q-pt-xs cursor-pointer" style="width:100%;" @click="router.push(f.target)">
      <div class="row items-baseline">
        <div class="col-2">
          <q-icon :name="f.icon" size="1em"/>
        </div>
        <div class="col-9 text-body2">
          {{ f.name }}
        </div>
        <div class="col-1"></div>
      </div>
    </q-card-section>
  </q-card>

  <div class="q-ma-md">
    Experimental Features
  </div>

  <q-card flat v-for="f in experimantalFeatures">
    <q-card-section class="q-pt-xs cursor-pointer" style="width:100%;" @click="router.push(f.target)">
      <div class="row items-baseline">
        <div class="col-2">
          <q-icon :name="f.icon" size="1em"/>
        </div>
        <div class="col-9 text-body2">
          {{ f.name }}
        </div>
        <div class="col-1"></div>
      </div>
    </q-card-section>
  </q-card>

</template>

<script setup lang="ts">

import {useTabsStore} from "src/stores/tabsStore"
import {ref, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";

const tabsStore = useTabsStore()
const router = useRouter()

const optionalFeatures = [
  {name: 'Bookmarks', icon: 'o_bookmarks', target: '/features/bookmarks'},
  {name: 'Thumbnails', icon: 'o_bookmarks', target: '/features/thumbnails'},
  {name: 'Deep Search', icon: 'o_bookmarks', target: '/features/thumbnails'}
]

const experimantalFeatures = [
  {name: 'Saving Pages', icon: 'o_bookmarks', target: '/features/pageCapture'},
  {name: 'History', icon: 'o_history', target: '/features/history'}
]


const open = (ident: string) => {
  router.push("/help/" + ident)
}

//@ts-ignore
const appVersion = import.meta.env.PACKAGE_VERSION

</script>
