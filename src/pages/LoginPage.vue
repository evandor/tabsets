<template>
  <q-page class="flex flex-center bg-grey-1">
    <q-card class="q-pa-lg shadow-2" style="width: 360px; max-width: 90vw;">
      <q-card-section class="text-center">
        <div class="text-h6 text-primary">Login</div>
        <div class="text-subtitle2 text-grey-7">Melde dich an, um fortzufahren</div>
      </q-card-section>

      <q-form @submit.prevent="onSubmit" class="q-gutter-md q-mt-md">
        <q-input v-model="email" type="email" label="E-Mail" outlined dense
          :rules="[val => !!val || 'E-Mail ist erforderlich']" />
        <q-input v-model="password" type="password" label="Passwort" outlined dense
          :rules="[val => !!val || 'Passwort ist erforderlich']" />

        <div class="q-mt-sm">
          <q-btn label="Login" type="submit" color="primary" class="full-width" icon="login" />
        </div>
      </q-form>

      <q-card-actions align="center" class="q-mt-md">
        <q-btn flat label="Noch kein Konto?" to="/register" color="secondary" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { LocalStorage, useQuasar } from 'quasar'
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  UserCredential
} from 'firebase/auth/web-extension'
import { CURRENT_USER_EMAIL } from 'boot/constants'
import { useAuthStore } from 'stores/authStore'
import { NotificationType } from 'src/core/services/ErrorHandler'
import { useAuthService } from 'src/services/AuthService'

const email = ref('');
const password = ref('');
const $q = useQuasar();
const router = useRouter();

function onSubmit() {
  console.log('Login-Funktion wurde aufgerufen');

  if (!email.value || !password.value) return;

  useAuthService().signin(email.value, password.value, false, false)
    .then(() => {
      router.push('/p/tabsets')
    })
    .catch((err:any) => {
      console.log("error login in", err)
    })

  // // Dummy-Login: Du kannst hier später echte Authentifizierung einbauen
  // if (email.value === 'test@example.com' && password.value === '1234') {
  //   $q.notify({ type: 'positive', message: 'Login erfolgreich!', color: 'aspargus' });
  //   void router.push('/home');
  // } else {
  //   $q.notify({ type: 'negative', message: 'Ungültige Zugangsdaten', color: 'indian-red' });
  // }
}
</script>
