<template>
  <div class="q-pa-md q-gutter-sm">
    <div class="row items-baseline">Keys will be stored in your local storage. Saved on blur.</div>
    <div class="row items-baseline">
      <InfoLine label="OpenAI Key">
        <q-input type="password" v-model="openAiKey" dense />
      </InfoLine>
    </div>
    <div class="row items-baseline">
      <div>and / or</div>
    </div>
    <div class="row items-baseline">
      <InfoLine label="Anthropic Key">
        <q-input type="password" v-model="anthropicAiKey" dense />
      </InfoLine>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStorage } from '@vueuse/core'
import InfoLine from 'src/core/pages/helper/InfoLine.vue'

const openAiKey = useStorage('ai.openAiKey', undefined, localStorage)
const anthropicAiKey = useStorage('ai.anthropicKey', undefined, localStorage)
</script>
