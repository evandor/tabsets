<template>
  <q-page padding>
    <div class="row justify-center items-center" style="height: 500px">
      <div class="text-h5 content-center">Tabsets Pro</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import Analytics from 'src/core/utils/google-analytics'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useAuthStore } from 'stores/authStore'
import { onMounted, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const router = useRouter()

onMounted(() => {
  Analytics.firePageViewEvent('SplashPage', document.location.href)
})

$q.loading.show({
  message: 'Initializing tabsets...',
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
watchEffect(async () => {
  const user = useAuthStore().user
  const tabsetsLoaded = useTabsetsStore().loaded
  // const tabsetsInitialized = useTabsetService().initialized
  if (user && tabsetsLoaded) {
    // console.log('user/loaded', user, tabsetsLoaded)
    const currentTabsetId = await useTabsetsStore().getCurrentTabsetId()
    $q.loading.hide()
    if (user.isAnonymous) {
      console.log('user anonymous', user.isAnonymous)
      // router.push('/p/tabsets')
      router.push('/p/home')
    } else {
      console.log('user authenticated, redirecting to', currentTabsetId)
      if (currentTabsetId) {
        router.push(`/tabsets/${currentTabsetId}`)
      } else {
        // router.push('/tabsets')
        router.push('/home')
      }
    }
  } else {
    $q.loading.hide()
    // router.push('/p/tabsets')
    router.push('/p/home')
  }
})
</script>
