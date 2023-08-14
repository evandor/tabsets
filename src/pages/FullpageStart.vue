<template>
  <q-page padding>

    <div class="row justify-center items-center" style="height:500px">
      <div class="text-h5 content-center">
        Tabsets Fullpage View
      </div>
    </div>


  </q-page>

</template>

<script setup lang="ts">
import {useQuasar} from "quasar";
import {useRouter} from "vue-router";
import {useTabsStore} from "src/stores/tabsStore";

const $q = useQuasar()
const router = useRouter()

let timer
const tabsStore = useTabsStore()


$q.loading.show({
  message: 'Initializing tabsets. The Fullpage View will deactivate the SidePanel for this tab. Please hang on...'
})
timer = setTimeout(() => {
  chrome.tabs.getCurrent((t?: chrome.tabs.Tab ) => {
    console.log("got tab", t)
    const options = {
      tabId: t.id,
      enabled: false
    }
    console.log("setting options", options)
    // @ts-ignore
    chrome.sidePanel.setOptions(options);
  })
  if (tabsStore.tabsets.size === 0) {
    router.push("/about")
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
