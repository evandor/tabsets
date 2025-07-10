<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">{{ suggestion.title }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body">{{ suggestion.msg }}</div>
      </q-card-section>

      <q-card-actions align="right">
        <DialogButton label="Later" v-if="props.suggestion.type !== 'SWITCH_TABSET'" @was-clicked="delayDecision()">
          <!--          <q-tooltip class="tooltip-small" :delay="500">Click here to decide later</q-tooltip>-->
        </DialogButton>
        <!--        <q-btn-->
        <!--          label="Later"-->
        <!--          v-if="props.suggestion.type !== 'SWITCH_TABSET'"-->
        <!--          size="sm"-->
        <!--          v-close-popup-->
        <!--          @click="delayDecision()">-->
        <!--          <q-tooltip class="tooltip-small" :delay="500">Click here to decide later</q-tooltip>-->
        <!--        </q-btn>-->
        <DialogButton label="Ignore" color="negative" @was-clicked="ignoreSuggestion()" />
        <!--        <q-btn label="Ignore" size="sm" color="negative" v-close-popup @click="ignoreSuggestion()">-->
        <!--          <q-tooltip class="tooltip-small" :delay="500">This suggestion will not show up again</q-tooltip>-->
        <!--        </q-btn>-->
        <DialogButton :label="suggestion.applyLabel" color="warning" @was-clicked="applySuggestion()" default-action />
        <!--        <q-btn :label="suggestion.applyLabel" size="sm" color="warning" v-close-popup @click="applySuggestion()">-->
        <!--          <q-tooltip class="tooltip-small" :delay="500"-->
        <!--            >Get Details about this suggestion and decide what to do-->
        <!--          </q-tooltip>-->
        <!--        </q-btn>-->
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { doc, setDoc } from 'firebase/firestore'
import { useDialogPluginComponent } from 'quasar'
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUtils } from 'src/core/services/Utils'
import FirebaseServices from 'src/services/firebase/FirebaseServices'
import NavigationService from 'src/services/NavigationService'
import { Suggestion } from 'src/suggestions/domain/models/Suggestion'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import { SelectTabsetCommand } from 'src/tabsets/commands/SelectTabsetCommand'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useAuthStore } from 'stores/authStore'
import { PropType } from 'vue'
import { useRouter } from 'vue-router'
import { useFirebaseServices } from 'src/services/firebase/useFirebaseServices'

defineEmits([...useDialogPluginComponent.emits])

const props = defineProps({
  suggestion: { type: Object as PropType<Suggestion>, required: true },
})

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const router = useRouter()

const { inBexMode } = useUtils()

const delayDecision = () => useSuggestionsStore().updateSuggestionState(props.suggestion.id, 'DECISION_DELAYED')
const ignoreSuggestion = () => useSuggestionsStore().updateSuggestionState(props.suggestion.id, 'IGNORED')

const applySuggestion = async () => {
  const res = props.suggestion
  console.log('res', res)
  //if (props.fromPanel) {
  switch (res.type) {
    case 'FEATURE':
      console.log('hier1')
      await useSuggestionsStore().updateSuggestionState(res.id, 'CHECKED')
      if (inBexMode()) {
        NavigationService.openOrCreateTab(
          [chrome.runtime.getURL('/www/index.html#' + props.suggestion.url)],
          undefined,
          [],
          true,
        )
      } else {
        router.push('' + props.suggestion.url)
      }
      break
    case 'URL':
      console.log('hier2')
      if (props.suggestion.url) {
        await useSuggestionsStore().updateSuggestionState(res.id, 'CHECKED')
        NavigationService.openOrCreateTab([props.suggestion?.url], undefined, [], true)
        // useSuggestionsStore().removeSuggestion(res.id)
      }
      break
    case 'TABSET_SHARED':
      if (res.url.startsWith('invitations://')) {
        await useSuggestionsStore().updateSuggestionState(res.id, 'CHECKED')
        const invitationId = res.url.split('invitations://')[1]
        await setDoc(
          doc(useFirebaseServices().firebaseServices.getFirestore(), `users/${useAuthStore().user.uid}/invitations/${invitationId}`),
          { state: 'accepted' },
          { merge: true },
        )
      }
      break
    case 'SWITCH_TABSET':
      if (res.url.startsWith('tabset://')) {
        const urlSplit = res.url.split('tabset://')[1]!.split('/')
        console.log('urlSplit', urlSplit)
        const tabset = useTabsetsStore().getTabset(urlSplit[0]!)
        if (tabset) {
          await useCommandExecutor().executeFromUi(
            new SelectTabsetCommand(tabset.id, urlSplit[1] !== 'undefined' ? urlSplit[1] : undefined),
          )
        }
      }
      await useSuggestionsStore().removeSuggestion(props.suggestion.id)
      break
    default:
      console.log('hier3')
      if (inBexMode()) {
        NavigationService.openOrCreateTab(
          [chrome.runtime.getURL('/www/index.html#/mainpanel/suggestions/' + props.suggestion.id)],
          undefined,
          [],
          true,
        )
      } else {
        console.log('hier4')
        router.push('mainpanel/suggestions/' + props.suggestion.id)
      }
  }
  // } else {
  //   if (res.url.startsWith('/')) {
  //     router.push(res.url)
  //   } else {
  //     openURL(res.url)
  //   }
  // }
}

const restart = () => {
  useSuggestionsStore().removeSuggestion(props.suggestion.id)
  //AppService.restart("restarted=true")
}
</script>
