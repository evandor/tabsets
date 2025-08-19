<template>
  <q-page class="flex flex-center bg-grey-1">
    <q-card class="q-pa-lg shadow-2" style="width: 400px; max-width: 90vw">
      <q-card-section class="text-center">
        <div class="text-h6 text-primary">Sign up</div>
        <div class="text-subtitle2 text-grey-7">Create a new account</div>
      </q-card-section>

      <q-form @submit="onRegister" class="q-gutter-md q-mt-md">
        <q-input v-model="name" label="Name" outlined dense :rules="[(val) => !!val || 'Name is mandatory']" />
        <q-input
          v-model="email"
          label="Email"
          type="email"
          outlined
          dense
          :rules="[(val) => !!val || 'Email is mandatory']" />
        <q-input
          v-model="password"
          label="Password"
          type="password"
          outlined
          dense
          :rules="[(val) => val.length >= 4 || 'At least 4 characters']" />
        <q-input
          v-model="confirmPassword"
          label="Confirm password"
          type="password"
          outlined
          dense
          :rules="[(val) => val === password || 'Passwords do not match']" />

        <q-btn no-caps label="Sign Up" type="submit" color="primary" class="full-width" icon="person_add" />
      </q-form>

      <q-card-actions align="center" class="q-mt-md">
        <div class="text-grey-7">Already have an account?</div>
        <q-btn flat no-caps label="Login" to="/login" color="secondary" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { CURRENT_USER_EMAIL } from 'boot/constants'
import { createUserWithEmailAndPassword, getAuth, UserCredential } from 'firebase/auth/web-extension'
import { LocalStorage, useQuasar } from 'quasar'
import { NotificationType, useNotificationHandler } from 'src/core/services/ErrorHandler'
import { useAuthStore } from 'stores/authStore'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUtils } from 'src/core/services/Utils'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { CreateTabsetCommand } from 'src/tabsets/commands/CreateTabsetCommand'

const {inBexMode} = useUtils()
const {handleError} = useNotificationHandler()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const $q = useQuasar()
const router = useRouter()

async function onRegister() {
  if (!name.value || !email.value || !password.value || password.value !== confirmPassword.value) {
    $q.notify({ type: 'negative', message: 'Please check your input.' })
    return
  }

  const auth = getAuth()
  try {
    let userCredential: UserCredential = null as unknown as UserCredential
    console.log(`signing with ${email.value} and password length ${password.value.length}`)
    userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
    const user = userCredential.user
    // if (rememberMe.value) {
    //   LocalStorage.set(CURRENT_USER_EMAIL, email.value)
    // } else {
    //   LocalStorage.remove(CURRENT_USER_EMAIL)
    // }
    await useAuthStore().setUser(user)
    // createGettingStartedTabset()

    await useCommandExecutor().execute(new CreateTabsetCommand('Links', []))

    if (inBexMode()) {
      await router.push('/popup')
    } else {
      await router.push('/dashboard')
    }
    // emits('hideLogin')
  } catch (error: any) {
    const errorCode = error.code
    const errorMessage = error.message
    //showResetPassword.value = true
    switch (errorCode) {
      case 'auth/invalid-credential':
        handleError('Invalid Credentials or No Account', NotificationType.NOTIFY)
        break
      default:
        console.error('error', error, typeof error, errorCode, errorMessage)
        handleError(error, NotificationType.NOTIFY)
    }
    //loading.value = false
  }
}
</script>
