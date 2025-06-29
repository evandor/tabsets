<template>
  <div class="q-pa-md q-gutter-sm">
    <!--    <q-banner v-if="!useAuthStore().userMayAccess(AccessItem.FEATURE_TOGGLES)" rounded style="border:1px solid orange">-->
    <!--      To use feature toggles, you need to have a (free) account.-->
    <!--    </q-banner>-->
    <!--    <template v-else>-->
    <q-banner rounded style="border: 1px solid orange"
      >Switch on experimental features (or off). These feature toggles are meant for developers only as they might break
      functionality and/or destroy data. Once they are considered 'safe enough', they will be available at the
      "experimental features" view on the left.
    </q-banner>

    <div class="row q-pa-md">
      <div class="col-3"><b>Developer Mode</b></div>
      <div class="col-6">
        activates a couple of additional experimental features. You should only use them if you can live with loosing
        data.
      </div>
      <div class="col-1"></div>
      <div class="col-2">
        <q-toggle v-model="devEnabled" @click="updateSettings2('DEV_MODE', devEnabled)" />
      </div>
    </div>
    <div class="row q-pa-md">
      <div class="col-3"><b>Debug Mode</b></div>
      <div class="col-6">activates a couple of additional debug insights for development.</div>
      <div class="col-1"></div>
      <div class="col-2">
        <q-toggle v-model="debugEnabled" @click="updateSettings2('DEBUG_MODE', debugEnabled)" />
      </div>
    </div>

    <div class="row q-pa-md" v-if="useSettingsStore().has('DEV_MODE')">
      <div class="col-3"><b>Trigger CommandExecution Error Handler</b></div>
      <div class="col-6">
        this should initiate a sentry error message like the ones happening when running into a problem executing a
        command.
      </div>
      <div class="col-1"></div>
      <div class="col-2">
        <q-btn label="Trigger Error" no-caps @click="triggerErrorHandler()" />
      </div>
    </div>
    <div class="row q-pa-md" v-if="useSettingsStore().has('DEV_MODE')">
      <div class="col-3"><b>Trigger Catch-All Error Handler</b></div>
      <div class="col-6">this should initiate a sentry error message from the vue error interceptor.</div>
      <div class="col-1"></div>
      <div class="col-2">
        <q-btn label="Trigger Error" no-caps @click="triggerCatchAll()" />
      </div>
    </div>
    <div class="row q-pa-md" v-if="useSettingsStore().has('DEV_MODE')">
      <div class="col-3"><b>Collect User Feedback</b></div>
      <div class="col-6"></div>
      <div class="col-1"></div>
      <div class="col-2">
        <q-btn label="User Feedback" no-caps @click="collectUserFeedback()" />
      </div>
    </div>
    <div class="row q-pa-md" v-if="useSettingsStore().has('DEV_MODE')">
      <div class="col-3"><b>Create a (dummy) suggestion</b></div>
      <div class="col-6">Suggestions are shown to the user to let her decide if they are applicable</div>
      <div class="col-1"></div>
      <div class="col-2">
        <!--        <q-btn label="Tabset Shared" no-caps @click="createSuggestion('TABSET_SHARED')" />-->
        <!--        <q-btn label="Use Extension" no-caps @click="createSuggestion('USE_EXTENSION')" v-if="!inBexMode()" />-->
        <!--        <q-btn label="Spaces Feature" no-caps @click="createSuggestion('FEATURE')" />-->
        <!--        <q-btn label="Clear all" no-caps @click="clearSuggestions()" />-->
      </div>
    </div>
    <div class="row q-pa-md" v-if="useSettingsStore().has('DEV_MODE')">
      <div class="col-3"><b>Create a zero-shot-classification message</b></div>
      <div class="col-6">...</div>
      <div class="col-1"></div>
      <div class="col-2">
        <q-btn label="Create" no-caps @click="createMessage()" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { captureFeedback, captureMessage } from '@sentry/browser'
import { doc, setDoc } from 'firebase/firestore'
import { uid } from 'quasar'
import { SettingIdent } from 'src/app/models/SettingIdent'
import { useNotificationHandler } from 'src/core/services/ErrorHandler'
import { useUtils } from 'src/core/services/Utils'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import FirebaseServices from 'src/services/firebase/FirebaseServices'
import { Suggestion, SuggestionType } from 'src/suggestions/domain/models/Suggestion'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import { Message } from 'src/tabsets/models/Message'
import { useAuthStore } from 'stores/authStore'
import { ref, watchEffect } from 'vue'

const { inBexMode } = useUtils()
const settingsStore = useSettingsStore()
const { handleError } = useNotificationHandler()
const { sendMsg } = useUtils()

const devEnabled = ref<boolean>(useSettingsStore().has('DEV_MODE') || false)
const debugEnabled = ref<boolean>(useSettingsStore().has('DEBUG_MODE') || false)

watchEffect(() => {
  devEnabled.value = useSettingsStore().has('DEV_MODE')
})

const updateSettings2 = (ident: SettingIdent, active: boolean) => {
  console.log('settings2 updated to', ident, active)
  settingsStore.setToggle(ident, active)
  if (active) {
    sendMsg('setting-activated', { setting: ident })
  } else {
    sendMsg('setting-deactivated', { setting: ident })
  }
  // TODO deprecated
  //settingsStore.setFeatureToggle(ident, val)
}

const triggerMessage = (msg: string) => {
  const message = new Message(uid(), new Date().getTime(), 0, 'new', msg)
  setDoc(
    doc(FirebaseServices.getFirestore(), `users/${useAuthStore().user.uid}/messages/${message.id}`),
    JSON.parse(JSON.stringify(message)),
  )
}

const triggerErrorHandler = () => handleError('an user-initiated error message from tabsets at ' + new Date().getTime())

const triggerCatchAll = () => {
  throw new Error('user triggered catch-all-Error at' + new Date().getTime())
}

const clearSuggestions = () => {
  useSuggestionsStore().clearAll()
}

const createSuggestion = async (type: SuggestionType) => {
  switch (type) {
    case 'TABSET_SHARED':
      const s = new Suggestion(
        uid(),
        'New Shared Tabset',
        'Carsten wants to share a new tabset with you',
        uid(),
        'TABSET_SHARED',
      )
      s.setImage('o_tabs')
      s.applyLabel = 'accept'
      await useSuggestionsStore().addSuggestion(s)
      break
    // case 'USE_EXTENSION':
    //   await useSuggestionsStore().addSuggestion(Suggestion.getStaticSuggestion('USE_EXTENSION_SUGGESTION'))
    //   break
    case 'FEATURE':
      await useSuggestionsStore().addSuggestion(Suggestion.getStaticSuggestion('TRY_SPACES_FEATURE'))
      break
    default:
      console.warn(`unknown type ${type}`)
  }
}

const collectUserFeedback = async () => {
  const eventId = captureMessage('User Feedback')
  // OR: const eventId = Sentry.lastEventId();

  const userFeedback = {
    name: 'John Doe',
    email: 'john@doe.com',
    message: 'I really like your App, thanks!',
    associatedEventId: eventId,
  }
  captureFeedback(userFeedback)
}

const createMessage = () => {
  const data = {
    text: 'some text',
    candidates: ['some'],
  }
  console.log('about to apply KI logic on meta description...', data)

  chrome.runtime.sendMessage(
    {
      name: 'zero-shot-classification',
      data: data,
    },
    (callback: any) => {
      console.log('got callback!', callback)
      alert(JSON.stringify(callback))
      if (chrome.runtime.lastError) {
        /* ignore */
      }
    },
  )
}
</script>
