<template>
  <q-page class="darkInDarkMode brightInBrightMode" style="padding-top: 25px">
    <div class="row q-ma-sm cursor-pointer text-grey-8">
      <DebugInfo :in-popup="true" />
    </div>

    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode q-ma-none q-ml-md">
      <PopupToolbar title="Debug">
        <template v-slot:left>
          <q-icon name="o_keyboard_return" class="cursor-pointer" @click="router.push('/popup')" />
        </template>
      </PopupToolbar>
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import PopupToolbar from 'src/core/pages/popup/PopupToolbar.vue'
import DebugInfo from 'src/core/pages/widgets/DebugInfo.vue'
import Analytics from 'src/core/utils/google-analytics'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  Analytics.firePageViewEvent('PopupDebugPage', document.location.href)
})
</script>
