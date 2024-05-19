<template>

  Counter from src/features: {{ useCounterStore2().count }}

  <q-btn label="dec counter 1" @click="useCounterStore2().increment()"/>


</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {useCounterStore2} from "src/features/stores/counterStore";

const count = ref(1)

// const counterStore = useCounterStore2()
//
// watchEffect(() => {
//   console.log("hier")
//   count.value = counterStore.count
// })


</script>
