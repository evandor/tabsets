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
import {useTabsStore} from "stores/tabsStore";
import {useRouter} from "vue-router";
import {ref} from "vue";


const $q = useQuasar()

$q.loading.show({
  message: 'Initializing tabsets. Please hang on...'
})

const router = useRouter()

let timer

timer = setTimeout(() => {
  const tabsStore = useTabsStore()
  console.log("size", tabsStore.tabsets.size)
  if (tabsStore.tabsets.size === 0) {
    router.push("/about")
  } else {
    router.push("/tabset")
  }

  setTimeout(() => {$q.loading.hide()}, 500)
  timer = void 0
}, 2000)

</script>
