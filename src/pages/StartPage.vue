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
import {useTabsStore} from "src/stores/tabsStore";
import {useRouter} from "vue-router";

const $q = useQuasar()
const router = useRouter()

let timer
const tabsStore = useTabsStore()


$q.loading.show({
  message: 'Initializing tabsets. Please hang on...'
})
timer = setTimeout(() => {
  if (tabsStore.tabsets.size === 0) {
    router.push("/")
  } else {
    const selectedTS = localStorage.getItem("selectedTabset")
    if (selectedTS) {
      console.log("setting selected tabset from storage", selectedTS)
      useTabsStore().selectCurrentTabset(selectedTS)
      router.push("/tabsets/" + selectedTS)
    } else {
      router.push("/tabsets")
    }
  }
  setTimeout(() => {
    $q.loading.hide()
  }, 500)
  timer = void 0
}, 2000)


</script>
