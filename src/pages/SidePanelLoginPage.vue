<template>
  <q-page>
    <div v-if="showWatermark" id="watermark">{{ watermark }}</div>

    <div class="q-ma-none q-pa-md text-h4 q-ma-xl" style="max-width: 500px; margin: 100px auto 50px auto">
      {{ pageTitle }}
    </div>

    <div class="q-ma-sm q-pa-sm box">
      <q-tabs v-model="tab" dense>
        <q-tab name="login" label="Login" />
        <q-tab name="register" label="Create Account" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="login" class="q-ma-none q-pa-none">
          <form>
            <div class="col q-mt-lg">
              <div class="row">
                <div class="col-12">Your Email Address</div>
              </div>
            </div>
            <div class="col">
              <q-input
                id="username"
                autocomplete="username"
                square
                filled
                type="email"
                v-model="email"
                :rules="[(val) => !!val || 'Please provide a valid email address']"
                dense
                tabindex="1"
                autofocus />
            </div>

            <div class="col q-mt-sm">
              <div class="row">
                <div class="col-6">Your password</div>
                <div
                  class="col-6 text-right"
                  :class="email && email.indexOf('@') > 0 ? 'text-blue-8 cursor-pointer' : 'text-blue-3'"
                  @click="promptReset()">
                  Forgot?
                </div>
              </div>
            </div>
            <div class="col q-mt-sm">
              <q-input
                id="password"
                autocomplete="current-password"
                square
                filled
                :type="isPwd ? 'password' : 'text'"
                v-model="password"
                :rules="[(val) => !!val || 'the password must not be empty']"
                dense
                @keydown.enter.prevent="signin(false)"
                tabindex="2">
                <template v-slot:append>
                  <q-icon
                    v-if="password"
                    :name="isPwd ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="isPwd = !isPwd" />
                </template>
              </q-input>
            </div>

            <div class="col q-mt-md">
              <q-btn
                label="Log in"
                style="width: 100%"
                tabindex="3"
                color="primary"
                :loading="password.length === 0 && loading"
                :disable="!email || !password"
                @click="signin(false)" />
            </div>

            <div class="row">
              <div class="col-6 q-mt-sm">
                <q-btn
                  v-if="!inBexMode()"
                  class="cursor-pointer q-mt-sm"
                  outline
                  label="back home"
                  @click="router.push('/')"
                  size="sm" />
              </div>
              <div class="col q-mt-sm text-right">
                <q-checkbox label="Remember Me" v-model="rememberMe" />
              </div>
            </div>
          </form>
        </q-tab-panel>

        <q-tab-panel name="register" class="q-ma-none q-pa-none">
          <form>
            <div class="col q-mt-lg">
              <div class="row">
                <div class="col-12">Your Email Address</div>
              </div>
            </div>
            <div class="col">
              <q-input
                id="username"
                autocomplete="username"
                square
                filled
                type="email"
                v-model="email"
                :rules="[(val) => !!val || 'Please provide a valid email address']"
                dense
                tabindex="1"
                autofocus />
            </div>

            <div class="col q-mt-sm">
              <div class="row">
                <div class="col-12">Provide a password</div>
              </div>
            </div>
            <div class="col">
              <q-input
                id="password"
                autocomplete="new-password"
                square
                filled
                type="password"
                v-model="password"
                @keydown.enter.prevent="signin(true)"
                dense
                tabindex="2" />
            </div>

            <div class="col q-mt-xl">
              <q-btn
                label="Register"
                style="width: 100%"
                tabindex="3"
                color="primary"
                :loading="password.length === 0 && loading"
                :disable="!email || !password"
                @click="signin(true)" />
            </div>

            <div class="q-ma-sm text-body2">By clicking on <em>Register</em> you comply with the Terms of service.</div>
          </form>
        </q-tab-panel>
      </q-tab-panels>
    </div>
    <div class="row q-mr-md" style="max-width: 500px; margin: 10px auto">
      <div class="col-12 text-center">
        <span
          class="text-grey q-mx-none cursor-pointer"
          style="font-size: smaller"
          @click.stop="router.push('/sidepanel/welcome')"
          >About</span
        >
        <span class="q-ma-none q-pa-none q-mx-xs text-grey-5">|</span>
        <span
          class="text-grey q-mx-none cursor-pointer"
          style="font-size: smaller"
          @click.stop="clicked('https://tabsets.web.app/#/privacy')"
          >Privacy</span
        >
        <span class="q-ma-none q-pa-none q-mx-xs text-grey-5">|</span>
        <span
          class="text-grey q-mx-none cursor-pointer"
          style="font-size: smaller"
          @click.stop="clicked('https://tabsets.web.app/#/tos')"
          >Terms of Service</span
        >
        <span class="q-ma-none q-pa-none q-mx-xs text-grey-5">|</span>
        <span
          class="text-grey q-mx-none cursor-pointer"
          style="font-size: smaller"
          @click.stop="clicked('https://docs.tabsets.net')"
          >Documentation</span
        >
      </div>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import { CURRENT_USER_EMAIL } from 'boot/constants'
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth/web-extension'
import { LocalStorage, openURL, useQuasar } from 'quasar'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { NotificationType, useNotificationHandler } from 'src/core/services/ErrorHandler'
import { useUtils } from 'src/core/services/Utils'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useAuthStore } from 'stores/authStore'
import { ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const $q = useQuasar()

const { inBexMode } = useUtils()

const password = ref('')
const loading = ref<boolean>(false)
const isPwd = ref(true)
const showResetPassword = ref(false)
const rememberMe = ref(LocalStorage.getItem(CURRENT_USER_EMAIL) !== null)
const invited = ref<string | undefined>(useRoute().query.invited as string | undefined)
const email = ref<string>(invited.value ? invited.value : (LocalStorage.getItem(CURRENT_USER_EMAIL) as string))
const tab = ref(invited.value ? 'register' : 'login')
const pageTitle = ref('Tabsets Pro')
const showWatermark = ref(false)
const watermark = ref('')

const router = useRouter()
const route = useRoute()

const { handleError, handleSuccess } = useNotificationHandler()

console.log('route', route.query)
if (route.query['invited']) {
  pageTitle.value = 'Tabsets Pro Invitation'
}
if (route.query['mode'] === 'signup') {
  tab.value = 'register'
}

watchEffect(() => {
  if (email.value && email.value.length === 0) {
    LocalStorage.remove(CURRENT_USER_EMAIL)
    rememberMe.value = false
  }
})

watchEffect(() => {
  if (!rememberMe.value) {
    LocalStorage.remove(CURRENT_USER_EMAIL)
    rememberMe.value = false
  }
})

watchEffect(() => {
  showWatermark.value = useUiStore().getWatermark().length > 0
  watermark.value = useUiStore().getWatermark()
})

const signin = async (registerMode: boolean) => {
  loading.value = true
  const auth = getAuth()
  try {
    let userCredential: UserCredential = null as unknown as UserCredential
    console.log(`signing with ${email.value} and password length ${password.value.length}`)
    if (registerMode) {
      userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
    } else {
      userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
    }
    const user = userCredential.user
    if (rememberMe.value) {
      LocalStorage.set(CURRENT_USER_EMAIL, email.value)
    } else {
      LocalStorage.remove(CURRENT_USER_EMAIL)
    }
    await useAuthStore().setUser(user)
    loading.value = false
    if (inBexMode()) {
      await router.push('/sidepanel')
    } else {
      await router.push('/tabsets')
    }
    // emits('hideLogin')
  } catch (error: any) {
    const errorCode = error.code
    const errorMessage = error.message
    showResetPassword.value = true
    switch (errorCode) {
      case 'auth/invalid-credential':
        handleError('Invalid Credentials or No Account', NotificationType.NOTIFY)
        break
      default:
        console.error('error', error, typeof error, errorCode, errorMessage)
        handleError(error, NotificationType.NOTIFY)
    }
    loading.value = false
  }
}

const resetPassword = () => {
  sendPasswordResetEmail(getAuth(), email.value)
    // .then((link:any) => {
    //   return sendCustomPasswordResetEmail(email.value, email.value, link);
    // })
    .then(() => {
      const dummyresult = new ExecutionResult<any>('', 'Email was sent')
      handleSuccess(dummyresult, NotificationType.TOAST)
    })
    .catch((error) => {
      handleError(error, NotificationType.TOAST)
    })
}

const promptReset = () => {
  $q.dialog({
    title: 'Reset Password?',
    message: 'Your email',
    prompt: {
      model: email.value,
      type: 'text', // optional
    },
    cancel: true,
    persistent: true,
  }).onOk((data) => {
    resetPassword()
  })
}

const clicked = (url: string) => openURL(url)
</script>
