<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Suggestion</div>
      </q-card-section>
      <!--      <q-card-section>-->
      <!--        <div class="text-body">Please provide a name</div>-->
      <!--      </q-card-section>-->

      <q-card-section class="q-pt-none">
        <div class="text-body">{{ suggestion }}</div>


      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel"/>
        <q-btn flat label="Ignore" v-close-popup @click="ignoreSuggestion"/>
        <q-btn flat label="Use Suggestion" v-close-popup @click="addSuggestion"/>
      </q-card-actions>


    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {computed, ref, watchEffect} from "vue";
import {useDialogPluginComponent, useQuasar} from "quasar";
import {useRouter} from "vue-router";
import {useNotificationsStore} from "stores/notificationsStore";
import {useSuggestionsStore} from "stores/suggestionsStore";

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  suggestion: {
    type: Object,
    required: true
  }
})

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const notificationsStore = useNotificationsStore()
const router = useRouter()
const $q = useQuasar()

const newTabsetNameExists = ref(false)

const ignoreSuggestion = () => useSuggestionsStore().ignoreSuggestion(props.suggestion.id)

const addSuggestion = () => useSuggestionsStore().applySuggestion(props.suggestion.id)





</script>
