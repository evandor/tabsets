<template>
  <q-page padding>
    <div class="row justify-center items-center" style="height: 500px">
      <div class="text-h5 content-center">Welcome to Tabsets</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import { useSelectedTabsetService } from 'src/tabsets/services/selectedTabsetService'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const router = useRouter()

let timer

$q.loading.show({
  message: 'Initializing tabsets. Please hang on...',
})
// eslint-disable-next-line @typescript-eslint/no-misused-promises
timer = setTimeout(async () => {
  if (useTabsetsStore().tabsets.size === 0) {
    router.push('/')
  } else {
    const selectedTS = await useSelectedTabsetService().getFromStorage()
    if (selectedTS) {
      console.log('setting selected tabset from storage', selectedTS)
      useTabsetsStore().selectCurrentTabset(selectedTS)
      router.push('/sidepanel/tabsets/' + selectedTS)
    } else {
      router.push('/sidepanel/tabsets')
    }
  }
  setTimeout(() => {
    $q.loading.hide()
  }, 500)
  timer = void 0
}, 2000)
</script>
