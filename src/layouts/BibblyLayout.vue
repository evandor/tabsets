<template>
  <q-layout view="hHh lpR fFf">
    <!-- Variante 1: Header für Welcome Seiten ohne Anmeldung -->
    <q-header v-if="isSimpleHeader" class="bg-transparent-header">
      <q-toolbar class="q-py-md q-px-lg items-center justify-between">
        <!-- Logo links -->
        <div class="row items-center cursor-pointer q-gutter-sm" @click="goToWelcome">
          <img src="../assets/images/logo.png" alt="Bibbly Logo" class="logo-image" />
          <q-toolbar-title class="app-logo-text q-ml-sm"> bibbly. </q-toolbar-title>
        </div>

        <!-- Zentrale Navigation -->
        <div class="row q-gutter-md justify-center items-center q-mx-auto" v-if="$q.screen.gt.sm">
          <q-btn flat class="text-grey text-capitalize" @click="() => scrollToSection('collections')">
            <span style="font-size: 1rem">Collections</span>
          </q-btn>
          <q-btn flat class="text-grey text-capitalize" @click="() => scrollToSection('product')">
            <span style="font-size: 1rem">Product</span>
          </q-btn>
          <q-btn flat class="text-grey text-capitalize" @click="() => scrollToSection('about')">
            <span style="font-size: 1rem">About</span>
          </q-btn>
          <q-btn outline rounded color="warning" class="text-capitalize" @click="() => scrollToSection('extension')">
            <span style="font-size: 1rem">{{ extensionLabel }}</span>
          </q-btn>
        </div>

        <!-- Rechte Seite: Auth oder Menü-Icon -->
        <div class="row items-center q-gutter-sm">
          <!-- Desktop -->
          <div class="row q-gutter-sm items-center" v-if="$q.screen.gt.sm">
            <template v-if="!currentUser?.isAnonymous">
              <q-btn flat class="text-capitalize" style="color: #191919" @click="logout()">
                <span style="font-size: 1rem">Logout</span>
              </q-btn>
            </template>
            <template v-else>
            <q-btn flat class="text-capitalize" style="color: #191919" @click="goToLogin">
              <span style="font-size: 1rem">Login</span>
            </q-btn>
            <q-btn color="secondary" class="text-capitalize" @click="goToRegister">
              <span style="font-size: 1rem">Sign Up</span>
              <q-icon name="arrow_forward" size="16px" class="q-ml-sm" />
            </q-btn>
            </template>
          </div>

          <!-- Mobile -->
          <q-btn dense round flat icon="menu" color="secondary" v-else>
            <q-menu>
              <q-list style="min-width: 120px">
                <q-item clickable v-close-popup @click="() => scrollToSection('collections')">
                  <q-item-section>Collections</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="() => scrollToSection('product')">
                  <q-item-section>Product</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="() => scrollToSection('about')">
                  <q-item-section>About</q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-close-popup
                  @click="() => scrollToSection('extension')"
                  class="text-warning text-italic">
                  <q-item-section>{{ extensionLabel }}</q-item-section>
                </q-item>
                <q-separator spaced />
                <q-item clickable v-close-popup @click="goToLogin">
                  <q-item-section>Login</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="goToRegister">
                  <q-item-section>Sign Up</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <!-- Variante 2: Voller Header mit Menü-Button -->
    <q-header v-else elevated style="background-color: #087f8c; color: white">
      <q-toolbar class="q-gutter-sm justify-between">
        <div class="row items-center">
          <q-btn
            v-if="showBackButton"
            flat
            dense
            icon="arrow_back"
            @click="goBack"
            :label="$q.screen.gt.sm ? 'Zurück' : undefined"
            :round="$q.screen.lt.sm" />
        </div>

        <q-toolbar-title class="text-center app-title"> bibbly <span class="subtitle">recipes</span> </q-toolbar-title>

        <q-btn flat round dense icon="menu" @click="rightDrawerOpen = !rightDrawerOpen" />
      </q-toolbar>
    </q-header>

    <!-- Right Drawer -->
    <q-drawer v-if="!isSimpleHeader" side="right" v-model="rightDrawerOpen" overlay bordered behavior="mobile">
      <q-list>
        <q-item clickable v-ripple @click="onImport">
          <q-item-section avatar>
            <q-icon name="file_upload" />
          </q-item-section>
          <q-item-section>Import</q-item-section>
        </q-item>

        <q-item clickable v-ripple @click="onShare">
          <q-item-section avatar>
            <q-icon name="share" />
          </q-item-section>
          <q-item-section>Share</q-item-section>
        </q-item>

        <q-item clickable v-ripple :to="{ path: '/privacy' }">
          <q-item-section avatar>
            <q-icon name="gavel" />
          </q-item-section>
          <q-item-section>Terms</q-item-section>
        </q-item>

        <q-item clickable v-ripple :to="{ path: '/p/legal-notice' }">
          <q-item-section avatar>
            <q-icon name="info" />
          </q-item-section>
          <q-item-section>Legal Notice</q-item-section>
        </q-item>

        <q-separator spaced />

        <q-item clickable v-ripple @click="onLogout">
          <q-item-section avatar>
            <q-icon name="logout" />
          </q-item-section>
          <q-item-section>Logout</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- Seiteninhalt -->
    <q-page-container>
      <router-view />
    </q-page-container>
    <footer class="q-pa-sm q-px-lg q-mt-lg bg-grey-1 text-grey-9">
      <!-- Desktop (ab sm > 1024px) -->
      <div v-if="$q.screen.gt.sm" class="column items-center q-mb-md q-mt-md">
        <div class="row q-gutter-md justify-center">
          <q-btn flat dense label="Legal Notice" class="text-caption text-capitalize" :to="{ path: '/p/legal-notice' }" />
          <q-btn flat dense label="Privacy" class="text-caption text-capitalize" :to="{ path: '/p/privacy' }" />
          <q-btn flat dense label="Disclaimer" class="text-caption text-capitalize" :to="{ path: '/p/disclaimer' }" />
          <q-btn flat dense label="Contact" class="text-caption text-capitalize" @click="contactDialog = true" />
        </div>

        <div class="row items-start q-px-sm q-mt-xl full-width">
          <div class="col text-caption text-grey-5">
            Images designed by
            <a href="https://www.freepik.com" target="_blank" class="text-secondary">Freepik</a>
          </div>
          <div class="col-auto">
            <q-btn
              flat
              dense
              class="text-capitalize text-caption"
              @click="scrollToTop"
              label="Back to Top"
              icon-right="arrow_upward"
              size="sm"
              color="grey" />
          </div>
          <div class="col text-caption text-grey-5 text-right">
            © 2025
            <a href="https://www.skysail.io" target="_blank" class="text-secondary">Skysail Consulting GmbH</a>. All
            rights reserved.
          </div>
        </div>
      </div>

      <!-- Mobile & Tablet (≤ sm) -->
      <div v-else class="column items-center q-mb-md q-mt-md q-px-md text-center">
        <!-- Tablet-Ansicht (horizontal) -->
        <div v-if="$q.screen.gt.xs" class="row q-gutter-md justify-center items-center q-mb-sm">
          <q-btn flat dense label="Legal Notice" class="text-caption text-capitalize" :to="{ path: '/legal-notice' }" />
          <q-btn flat dense label="Privacy" class="text-caption text-capitalize" :to="{ path: '/privacy' }" />
          <q-btn flat dense label="Disclaimer" class="text-caption text-capitalize" :to="{ path: '/disclaimer' }" />
          <q-btn flat dense label="Contact" class="text-caption text-capitalize" @click="contactDialog = true" />
        </div>

        <!-- Mobile-Ansicht (vertikal) -->
        <div v-else class="column items-center q-gutter-xs q-mb-sm">
          <q-btn flat dense label="Legal Notice" class="text-caption text-capitalize" :to="{ path: '/legal-notice' }" />
          <q-btn flat dense label="Privacy" class="text-caption text-capitalize" :to="{ path: '/privacy' }" />
          <q-btn flat dense label="Disclaimer" class="text-caption text-capitalize" :to="{ path: '/disclaimer' }" />
          <q-btn flat dense label="Contact" class="text-caption text-capitalize" @click="contactDialog = true" />
        </div>

        <!-- Attribution & Copyright -->
        <div v-if="$q.screen.gt.xs" class="row justify-between items-start q-mt-sm full-width">
          <div class="text-caption text-grey-5">
            Images designed by <a href="https://www.freepik.com" target="_blank" class="text-secondary">Freepik</a>
          </div>
          <div class="text-caption text-grey-5 text-right">
            © 2025 <a href="https://www.skysail.io" target="_blank" class="text-secondary">Skysail Consulting GmbH</a>.
            All rights reserved.
          </div>
        </div>

        <!-- Vertikal auf kleinen Screens -->
        <div v-else class="column items-center q-gutter-xs q-mt-sm full-width text-caption text-grey-5">
          <div>
            Images designed by <a href="https://www.freepik.com" target="_blank" class="text-secondary">Freepik</a>
          </div>
          <div>
            © 2025 <a href="https://www.skysail.io" target="_blank" class="text-secondary">Skysail Consulting GmbH</a>.
            All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  </q-layout>

  <!-- Kontakt Dialog -->
  <q-dialog v-model="contactDialog" persistent>
    <q-card style="min-width: 300px; max-width: 600px; width: 90vw">
      <q-card-section class="text-h6"> Get in Touch </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="submitContactForm">
          <div class="q-mx-auto column q-gutter-md" style="max-width: 500px">
            <q-input v-model="name" label="Name" filled required />
            <q-input v-model="email" label="Email" filled type="email" :rules="[validateEmail]" required />
            <q-input
              v-model="message"
              label="Message"
              filled
              type="textarea"
              autogrow
              :rules="[validateMessage]"
              required
              bottom-slots>
              <template #hint> Hint: Please enter between 80 - 300 characters. </template>
            </q-input>

            <q-input
              v-model="captchaAnswer"
              :label="captchaQuestion"
              filled
              type="number"
              :rules="[validateCaptcha]"
              required
              class="q-mt-md" />

            <div class="q-mt-md row justify-end q-gutter-sm">
              <q-btn flat label="Cancel" @click="contactDialog = false" />
              <q-btn label="Send" type="submit" color="primary" />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
  <cookie-consent />
</template>

<script setup lang="ts">
import CookieConsent from 'components/CookieConsent.vue'
import { useQuasar } from 'quasar'
import { computed, onMounted, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from 'stores/authStore'
import { User } from 'firebase/auth/web-extension'

const rightDrawerOpen = ref(false)
const route = useRoute()
const router = useRouter()

onMounted(() => {
  console.log("useAuthStore", useAuthStore().user)
})

// Hier gibst du die Routen-Namen an, bei denen der Zurück-Button angezeigt werden soll
const showBackButton = computed(() => ['recipe-detail'].includes(route.name as string))

const currentUser = ref<User | undefined>(undefined)
const browserName = ref('Browser')
const supportedBrowsers = ['Chrome', 'Firefox', 'Edge', 'Opera']

watchEffect(() => {
  currentUser.value = useAuthStore().user
  console.log("user set to", currentUser.value)
})

//Kontaktformular
const contactDialog = ref(false)
const name = ref('')
const email = ref('')
const message = ref('')
const $q = useQuasar()

//Captcha
const captchaAnswer = ref('')
const captchaQuestion = ref('')
const correctAnswer = ref(0)

const simpleHeaderRoutes = ['','welcome', 'login', 'register', 'preview', 'legal-notice', 'privacy', 'disclaimer']

const isSimpleHeader = computed(() => {
  console.log(simpleHeaderRoutes, route.name)
  return route.name === undefined || typeof route.name === 'string' && simpleHeaderRoutes.includes(route.name)
})

async function goToWelcome() {
  await router.push('/')
}

async function goBack() {
  await router.push('/home') // oder router.back()
}

async function goToLogin() {
  await router.push('/p/login')
}

async function goToRegister() {
  await router.push('/p/register')
}

// Beispielaktionen:
function onImport() {
  console.log('Importieren geklickt')
}

function onShare() {
  console.log('Teilen geklickt')
}

function submitContactForm() {
  // Hier könntest du eine API ansprechen

  console.log({ name: name.value, email: email.value, message: message.value })
  // Felder zurücksetzen
  name.value = ''
  email.value = ''
  message.value = ''
  captchaAnswer.value = ''
  generateCaptcha()

  // Dialog schließen

  contactDialog.value = false

  // Bestätigung anzeigen

  $q.notify({
    type: 'positive',
    message: 'Message sent! 🐦 Even the pigeons are impressed.',
    color: 'secondary',
    position: 'top',
    timeout: 4000,
  })
}

function validateEmail(val: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(val) || 'Bitte gültige E-Mail-Adresse eingeben'
}

function validateMessage(val: string) {
  if (!val) return 'Message is required'
  if (val.length < 80) return 'Message must be at least 80 characters'
  if (val.length > 300) return 'Message must not exceed 300 characters'

  const blacklist = ['select', 'insert', 'update', 'delete', 'drop', '--', ';', "' OR", '" OR', '1=1']
  const lowerVal = val.toLowerCase()

  if (blacklist.some((keyword) => lowerVal.includes(keyword))) {
    return 'Please rephrase your message.'
  }

  return true
}

onMounted(() => {
  generateCaptcha()
  browserName.value = detectBrowser()
})

function generateCaptcha() {
  const a = Math.floor(Math.random() * 10) + 1
  const b = Math.floor(Math.random() * 10) + 1
  captchaQuestion.value = `What is ${a} + ${b}?`
  correctAnswer.value = a + b
  captchaAnswer.value = ''
}

function validateCaptcha(val: string) {
  return parseInt(val) === correctAnswer.value || 'Incorrect captcha answer'
}

function onLogout() {
  console.log('Logout geklickt')
}

async function scrollToSection(sectionId: string) {
  if (route.name === 'welcome') {
    scrollToAnchor(sectionId)
  } else {
    await router.push({ name: 'welcome', hash: `#${sectionId}` })
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function scrollToAnchor(sectionId: string) {
  setTimeout(() => {
    const el = document.getElementById(sectionId)
    if (el) {
      const offset = 80 // Header-Höhe ggf. dynamisch machen
      const top = el.getBoundingClientRect().top + window.pageYOffset - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }, 100)
}

function detectBrowser(): string {
  const ua = navigator.userAgent

  if (/OPR\//.test(ua)) return 'Opera'
  if (/Edg\//.test(ua)) return 'Edge'
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua)) return 'Chrome'
  if (/Firefox\//.test(ua)) return 'Firefox'
  if (/Safari/.test(ua) && !/Chrome\//.test(ua)) return 'Safari'
  return 'Browser'
}

const isSupportedBrowser = computed(() => supportedBrowsers.includes(browserName.value))

const extensionLabel = computed(() => (isSupportedBrowser.value ? `Add to ${browserName.value}` : 'Get extension'))

const logout = () => {
  useAuthStore()
    .logout()
    .then(() => {
      router.push("/")
    })
    .catch((err: any) => {
      console.log('error logging out', err)
    })
}
</script>

<style scoped>
.bg-transparent-header {
  background-color: rgba(255, 255, 255, 0.8);
  /* Weiß mit 80% Deckkraft */
  backdrop-filter: blur(10px);
  /* optional für Glassmokeffekt */
}

.logo-image {
  height: 30px;
  object-fit: contain;
}

.q-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.q-page-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.q-page {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
