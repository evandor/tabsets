<template>
  <q-page padding class="q-mx-auto" style="max-width: 720px">
    <div class="coll-title q-mb-md">Create new collection</div>

    <q-form @submit.prevent="submit">
      <q-input v-model="title" label="Collection title" outlined dense :rules="[val => !!val || 'Please enter a title']"
        class="q-mb-md" autofocus />

      <!-- Buttons nebeneinander, rechts ausgerichtet -->
      <div class="row q-gutter-sm justify-start q-mt-sm">
        <q-btn no-caps label="Create" color="primary" unelevated type="submit" :disable="!title" />
        <q-btn flat no-caps color="grey-8" label="Cancel" @click="onCancel" />

      </div>
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const title = ref('');

async function submit() {
  // TODO: call your API to create the collection
  // await api.collections.create({ title: title.value })

  // simple feedback + redirect (adjust as you like)
  // this.$q.notify({ type: 'positive', message: 'Collection created' })
  await router.push('/dashboard');
}



function onCancel() {
  // Zurück oder zu einer bestimmten Seite
  router.back()
  // oder: router.push('/dashboard')
}
</script>
<style lang="sass" scoped>

.coll-title
  font-size: 1.5rem;
  font-weight: 800
  letter-spacing: .2px
  color: #191919

</style>
