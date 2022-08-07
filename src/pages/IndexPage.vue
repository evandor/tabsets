<template>
  <q-page class="row items-center justify-evenly">
    <example-component
      title="Example component"
      active
      :todos="todos"
      :meta="meta"
    ></example-component>
    {{authStore.getUsername}}***
  </q-page>
</template>

<script setup lang="ts">
import { Todo, Meta } from 'components/models';
import ExampleComponent from 'components/ExampleComponent.vue';
import { ref } from 'vue';
import {useAuthStore} from "stores/auth";

const todos = ref<Todo[]>([
  {
    id: 1,
    content: 'ct1'
  }
]);
const meta = ref<Meta>({
  totalCount: 1200
});

const authStore = useAuthStore()
</script>
