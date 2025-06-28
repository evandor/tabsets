<template>
  <q-card-section class="q-pb-none">
    <div class="q-row">
      <div class="q-col text-h6"><em>Open Tabs</em> View explained...</div>
    </div>
    <div class="q-row q-my-md q-ml-sm">
      <div class="q-col text-body1">
        <div class="row">
          <div class="col-1">
            <q-icon name="o_tab" color="primary" class="q-mb-xs" size="xs" />
          </div>
          <div class="col q-ml-sm">
            You will see a list of the <em>Tabs</em> currently opened in your browser's window
          </div>
        </div>
      </div>
    </div>
    <div class="q-row q-my-md q-ml-sm">
      <div class="q-col text-body1">
        <div class="row">
          <div class="col-1">
            <q-icon name="o_featured_play_list" color="primary" class="q-mr-sm q-mb-xs" size="xs" />
          </div>
          <div class="col q-ml-sm">Select one or more tabs and assign them to a <em>Tabset</em> if you wish.</div>
        </div>
      </div>
    </div>

    <div class="q-row q-mt-md q-ml-sm">
      <div class="q-col text-body1">
        <div class="row">
          <div class="col-1">
            <q-icon name="o_settings" color="primary" class="q-mr-sm q-mb-xs" size="xs" />
          </div>
          <div class="col q-ml-sm">What else can I do?</div>
        </div>
      </div>
    </div>
    <div class="q-row q-mb-md q-ml-sm">
      <div class="q-col text-body1">
        <div class="row">
          <div class="col-1"></div>
          <div class="col q-ml-md text-body2 text-grey">
            Filter by name<br />
            Open single tabs<br />
            Rearrange tabs<br />
            ...<br />
          </div>
        </div>
      </div>
    </div>
    <div class="q-row">
      <div class="q-col text-body1 text-center q-mt-sm">
        <DialogButton label="got it..." @was-clicked="emits('close')" />
      </div>
    </div>
  </q-card-section>
</template>
<script setup lang="ts">
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'

const emits = defineEmits(['close'])
</script>
