<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <q-btn icon="close" flat round dense @click="cancelSuggestion" v-close-popup />
      </q-card-section>
      <q-card-section>
        <div class="text-h6">{{ suggestion.title }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body">{{ suggestion.msg }}</div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <!--<q-btn flat label="Cancel" v-close-popup @click="cancelSuggestion"/>-->
        <q-btn flat label="Ignore" v-close-popup @click="ignoreSuggestion"/>
        <q-btn flat label="Check Suggestion" v-close-popup @click="addSuggestion"/>
      </q-card-actions>


    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {computed, ref, watchEffect} from "vue";
import {openURL, useDialogPluginComponent, useQuasar} from "quasar";
import {useRouter} from "vue-router";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {useSuggestionsStore} from "src/stores/suggestionsStore";
import {Suggestion} from "src/models/Suggestion";
import NavigationService from "src/services/NavigationService";

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  suggestion: {type: Object, required: true},
  fromPanel: {type: Boolean, default: false}
})

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const notificationsStore = useNotificationsStore()
const router = useRouter()
const $q = useQuasar()

const newTabsetNameExists = ref(false)

const cancelSuggestion = () => useSuggestionsStore().cancelSuggestion(props.suggestion.id)
const ignoreSuggestion = () => useSuggestionsStore().ignoreSuggestion(props.suggestion.id)

const addSuggestion = () => useSuggestionsStore()
    .applySuggestion(props.suggestion.id)
    .then((res: Suggestion) => {
      if (props.fromPanel) {
        console.log("xxx", res, chrome.runtime.getURL(res.url))
        //router.push(chrome.runtime.getURL(res.url))
        NavigationService.openOrCreateTab(chrome.runtime.getURL("/www/index.html#/mainpanel" + res.url))
      } else {
        if (res.url.startsWith("/")) {
          router.push(res.url)
        } else {
          openURL((res.url))
        }
      }
    })


</script>
