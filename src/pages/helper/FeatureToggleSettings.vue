<template>
  <div class="q-pa-md q-gutter-sm">


    <!--    <q-banner v-if="!useAuthStore().userMayAccess(AccessItem.FEATURE_TOGGLES)" rounded style="border:1px solid orange">-->
    <!--      To use feature toggles, you need to have a (free) account.-->
    <!--    </q-banner>-->
    <!--    <template v-else>-->
    <q-banner rounded style="border:1px solid orange">Switch on experimental features (or off). These feature toggles
      are meant for developers
      only as they might break functionality and/or destroy data. Once they are considered 'safe enough', they will
      be
      available at the
      "experimental features" view on the left.
    </q-banner>

    <div class="row q-pa-md">
      <div class="col-3"><b>Developer Mode</b></div>
      <div class="col-3">activates a couple of experimental features and debug insights. You should only use this
        if you can live with loosing data.
      </div>
      <div class="col-1"></div>
      <div class="col-5">
        <q-toggle v-model="devEnabled" @click="updateSettings(FeatureIdent.DEV_MODE.toString(), devEnabled)"/>
      </div>
    </div>

    <div class="row q-pa-md" v-if="useFeaturesStore().hasFeature(FeatureIdent.DEV_MODE)">
      <div class="col-3"><b>Trigger Error Handler</b></div>
      <div class="col-3">this should initiate a rollbar error message.
      </div>
      <div class="col-1"></div>
      <div class="col-5">
        <q-btn label="Trigger Error" no-caps @click="triggerErrorHandler()"/>
      </div>
    </div>
    <!--    </template>-->
  </div>
</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {useSettingsStore} from "stores/settingsStore";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {ActivateFeatureCommand} from "src/features/commands/ActivateFeature";
import {FeatureIdent} from "src/app/models/FeatureIdent";
import {DeactivateFeatureCommand} from "src/features/commands/DeactivateFeature";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import {useNotificationHandler} from "src/core/services/ErrorHandler";

const settingsStore = useSettingsStore()
const {handleError} = useNotificationHandler()

const devEnabled = ref<boolean>(settingsStore.isEnabled('dev'))

watchEffect(() => {
  devEnabled.value = settingsStore.isEnabled('dev')
})

const updateSettings = (ident: string, val: boolean) => {
  console.log("settings updated to", ident, val)
  if (val) {
    useCommandExecutor().execute(new ActivateFeatureCommand(ident))
  } else {
    useCommandExecutor().execute(new DeactivateFeatureCommand(ident))
  }
  // TODO deprecated
  settingsStore.setFeatureToggle(ident, val)
}

const triggerErrorHandler = () =>
  handleError("an user-initated error message from tabsets")


</script>
