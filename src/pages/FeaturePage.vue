<template>
  hi2: {{count}}<br>
  hi2: {{counterStore.count}}<br>
  hi2: {{useCounterStore().count}}<br>

  <q-btn label="inc" @click="counterStore.increment()" />

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {useCounterStore} from "stores/linkedCounterStore";

const count = ref(1)

const counterStore = useCounterStore()

watchEffect(() => {
  console.log("hier")
  count.value = counterStore.count
})


</script>
