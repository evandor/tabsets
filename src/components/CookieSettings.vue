<template>
  <q-dialog v-model="show" transition-show="fade" transition-hide="fade" transition-duration="500" persistent>
    <q-card style="max-width: 500px; width: 100%; max-height: 90vh;" class="scroll relative-position">
      <!-- Close Button -->
      <q-btn icon="close" flat round dense class="absolute-top-right q-ma-sm z-top" @click="backToConsent" />

      <q-card-section class="text-h6 text-center">
        Cookie Settings
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-md">

        <!-- Card 1 -->
        <q-card flat bordered class="q-pa-md">
          <div class="row items-center justify-between">
            <div>
              <div class="text-subtitle1">Necessary Cookies</div>
              <div class="text-caption text-grey">
                Required for the website to function properly. Cannot be disabled.
              </div>
            </div>
            <q-toggle v-model="consent.necessary" disable />
          </div>
        </q-card>

        <!-- Card 2 -->
        <q-card flat bordered class="q-pa-md">
          <div class="row items-center justify-between">
            <div>
              <div class="text-subtitle1">Analytics Cookies</div>
              <div class="text-caption text-grey">
                Help us understand how visitors interact with the website.
              </div>
            </div>
            <q-toggle v-model="consent.analytics" />
          </div>
        </q-card>

        <!-- Card 3 -->
        <q-card flat bordered class="q-pa-md">
          <div class="row items-center justify-between">
            <div>
              <div class="text-subtitle1">Marketing Cookies</div>
              <div class="text-caption text-grey">
                Used to show relevant ads and track user preferences.
              </div>
            </div>
            <q-toggle v-model="consent.marketing" />
          </div>
        </q-card>

      </q-card-section>

      <q-separator />

      <q-card-actions class="q-pa-md column q-gutter-sm">
        <q-btn label="Accept all" color="primary" unelevated no-caps class="full-width" @click="acceptAll" />
        <q-btn label="Confirm my selection" color="primary" unelevated no-caps class="full-width" flat
          @click="savePreferences" />

      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { LocalStorage, Notify } from 'quasar'

const show = ref(false)
const emit = defineEmits(['closeConsent', 'backToConsent'])

const consent = ref({
  necessary: true,
  analytics: false,
  marketing: false
})

function savePreferences() {
  LocalStorage.set('cookieConsent', consent.value)
  show.value = false
  emit('closeConsent')
  Notify.create({ message: 'Preferences saved', color: 'tertiary' })
}

function acceptAll() {
  consent.value.analytics = true
  consent.value.marketing = true
  savePreferences()
}

function backToConsent() {
  show.value = false
  emit('backToConsent')  // informiert CookieConsent.vue
}

defineExpose({ show })
</script>
