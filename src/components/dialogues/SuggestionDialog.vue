<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">{{ suggestion.title }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body">{{ suggestion.msg }}</div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn label="Later" size="sm" v-close-popup @click="delayDecision">
          <q-tooltip class="tooltip-small" :delay="500">Click here to decide later</q-tooltip>
        </q-btn>
        <q-btn label="Ignore" size="sm" color="negative" v-close-popup @click="ignoreSuggestion">
          <q-tooltip class="tooltip-small" :delay="500">This suggestion will not show up again</q-tooltip>
        </q-btn>
        <q-btn label="Check" size="sm" color="warning" v-close-popup @click="addSuggestion">
          <q-tooltip class="tooltip-small" :delay="500">Get Details about this suggestion and decide what to do
          </q-tooltip>
        </q-btn>
      </q-card-actions>


    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {PropType} from "vue";
import {openURL, useDialogPluginComponent} from "quasar";
import {useRouter} from "vue-router";
import {useSuggestionsStore} from "src/stores/suggestionsStore";
import {Suggestion, SuggestionState} from "src/models/Suggestion";
import NavigationService from "src/services/NavigationService";

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  suggestion: {type: Object as PropType<Suggestion>, required: true},
  fromPanel: {type: Boolean, default: false}
})

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const router = useRouter()

const delayDecision = () => useSuggestionsStore().updateSuggestionState(props.suggestion.id, SuggestionState.DECISION_DELAYED)
const ignoreSuggestion = () => useSuggestionsStore().updateSuggestionState(props.suggestion.id, SuggestionState.IGNORED)

const addSuggestion = () => {
//useSuggestionsStore()
// .applySuggestion(props.suggestion.id)
// .then((res: Suggestion) => {
  const res = props.suggestion
  if (props.fromPanel) {
    //console.log("xxx", res, chrome.runtime.getURL(res.url))
    //router.push(chrome.runtime.getURL(res.url))
    NavigationService.openOrCreateTab(
        [chrome.runtime.getURL("/www/index.html#/mainpanel/suggestions/" + props.suggestion.id)],
        undefined,
        [],
        true)
  } else {
    if (res.url.startsWith("/")) {
      router.push(res.url)
    } else {
      openURL((res.url))
    }
  }
}

</script>
