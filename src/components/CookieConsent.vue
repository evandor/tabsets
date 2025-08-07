<template>
  <q-dialog v-model="showConsent" transition-show="fade" transition-hide="fade" transition-duration="500" persistent>
    <q-card style="width: 100%; max-width: 600px; max-height: 90vh;" class="column justify-between">

      <!-- Scrollbarer Textbereich mit fester Höhe -->
      <q-card-section class="scroll" style="max-height: 50vh">
        <div class="text-h6">This website uses cookies</div><br>
        We use cookies and similar technologies (collectively referred to as “cookies”) to collect information from your
        device or store such information on your device or our servers. This enables core website functionality, social
        media interactions, personalized content, advertising, and analytics.<br><br>
        By clicking “Accept All Cookies”, you consent to this processing. In accordance with Art. 49 (1) (a) GDPR, you
        also consent to the processing of pseudonymized data by companies based in or operating from the USA. Please
        note that U.S. authorities may access your data under U.S. law, and you may not be able to rely on protection
        under EU laws.<br><br>
        For more information or to change your preferences, click “Open Cookie Settings” and see our
        <router-link to="/privacy" class="text-secondary">Privacy Policy</router-link>.
      </q-card-section>


      <q-card-actions vertical class="q-pa-md q-gutter-sm">
        <q-btn label="Accept all cookies" color="primary" unelevated no-caps class="full-width" @click="acceptAll" />
        <q-btn label="Only necessary cookies" outline color="primary" no-caps class="full-width"
          @click="acceptNecessary" />
        <q-btn label="Open cookie settings" flat color="secondary" no-caps class="full-width" @click="openSettings" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Cookie Settings Dialog -->
  <CookieSettings ref="cookieSettingsRef" @backToConsent="showConsent = true" @closeConsent="showConsent = false" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { LocalStorage } from 'quasar'
import CookieSettings from 'src/components/CookieSettings.vue'

const showConsent = ref(false)
const cookieSettingsRef = ref()  // Referenz für Dialog

onMounted(() => {
  const consent = LocalStorage.getItem('cookieConsent')
  if (!consent) showConsent.value = true
})

function acceptAll() {
  LocalStorage.set('cookieConsent', {
    necessary: true,
    analytics: true,
    marketing: true
  })
  showConsent.value = false
}

function acceptNecessary() {
  LocalStorage.set('cookieConsent', {
    necessary: true,
    analytics: false,
    marketing: false
  })
  showConsent.value = false
}

function openSettings() {
  showConsent.value = false
  if (cookieSettingsRef.value) {
    cookieSettingsRef.value.show = true
  }
}
</script>
