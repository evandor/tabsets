<template>
  <div class="q-ma-sm q-mt-xl">
    <q-card class="docubox">
      <q-card-section class="q-pb-none">
        <div class="q-row">
          <slot name="header"></slot>
        </div>
        <div class="q-row q-my-md q-ml-sm">
          <slot name="message"></slot>
        </div>
        <div class="q-row">
          <div class="q-col text-body1 text-center q-my-lg">
            <DialogButton
              label="got it"
              color="primary"
              data-testid="welcome-got-it"
              @was-clicked="emits('hideDocumentation')" />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script lang="ts" setup>
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'

const emits = defineEmits(['hideDocumentation'])
</script>
