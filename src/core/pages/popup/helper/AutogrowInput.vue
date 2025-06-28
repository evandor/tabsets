<template>
  <q-input
    v-model="model"
    type="text"
    dense
    borderless
    :filled="props.filled"
    :class="props.class"
    :input-class="props.inputClass"
    :autogrow="active"
    @click="active = true"
    @blur="active = false" />
</template>
<script setup lang="ts">
import { ref } from 'vue'

const model = defineModel<string | undefined>()

const props = defineProps<{
  inputClass?: string | undefined
  class?: string | undefined
  filled: boolean
}>()

const active = ref(false)
</script>
