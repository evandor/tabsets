<template>
  <q-page class="flex flex-center bg-grey-1">
    <q-card class="q-pa-lg shadow-2" style="width: 400px; max-width: 90vw;">
      <q-card-section class="text-center">
        <div class="text-h6 text-primary">Registrieren</div>
        <div class="text-subtitle2 text-grey-7">Erstelle ein neues Konto</div>
      </q-card-section>

      <q-form @submit="onRegister" class="q-gutter-md q-mt-md">
        <q-input v-model="name" label="Name" outlined dense :rules="[val => !!val || 'Name ist erforderlich']" />
        <q-input v-model="email" label="E-Mail" type="email" outlined dense
          :rules="[val => !!val || 'E-Mail ist erforderlich']" />
        <q-input v-model="password" label="Passwort" type="password" outlined dense
          :rules="[val => val.length >= 4 || 'Mindestens 4 Zeichen']" />
        <q-input v-model="confirmPassword" label="Passwort bestätigen" type="password" outlined dense
          :rules="[val => val === password || 'Passwörter stimmen nicht überein']" />

        <q-btn label="Registrieren" type="submit" color="primary" class="full-width" icon="person_add" />
      </q-form>

      <q-card-actions align="center" class="q-mt-md">
        <q-btn flat label="Bereits ein Konto?" to="/p/login" color="secondary" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const $q = useQuasar();
const router = useRouter();

function onRegister() {
  if (!name.value || !email.value || !password.value || password.value !== confirmPassword.value) {
    $q.notify({ type: 'negative', message: 'Bitte überprüfe deine Eingaben' });
    return;
  }

  // Dummy-Registrierung – später durch Backend ersetzen
  $q.notify({ type: 'positive', message: 'Registrierung erfolgreich' });
  void router.push('/login');
}
</script>
