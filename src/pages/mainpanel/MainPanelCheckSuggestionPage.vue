<template>

  <!-- toolbar -->
  <q-toolbar class="text-primary">

    <q-toolbar-title>
      Suggestion
    </q-toolbar-title>

  </q-toolbar>


  <div class="q-pa-md q-gutter-sm">
    <q-banner rounded class="bg-grey-1 text-primary">
      Suggestions Info text: TODO
    </q-banner>

    <div class="row items-baseline q-ma-md">
      <div class="col-3 text-bold">
        Title
      </div>
      <div class="col-9">
        {{ suggestion?.title }}
      </div>
    </div>

    <div class="row items-baseline q-ma-md">
      <div class="col-3 text-bold">
        Messsage
      </div>
      <div class="col-9">
        {{ suggestion?.msg }}
      </div>
    </div>

    <template v-if="suggestion?.type?.toUpperCase() === 'REDIRECT_HAPPENED_FOR_BOOKMARK'">

      <div class="row items-baseline q-ma-md">
        <div class="col-3 text-bold">
          Got Response Code
        </div>
        <div class="col-9">
          {{ suggestion?.data.status }}
        </div>
        <div class="col-3 text-bold">
          Suggestinng: Replace
        </div>
        <div class="col-9">
          {{ suggestion?.data.url }}
        </div>
        <div class="col-3 text-bold">
          with
        </div>
        <div class="col-9">
          {{ suggestion?.data.location }}
        </div>
      </div>
    </template>

    <div class="row items-baseline q-ma-md">
      <div class="col-3 text-bold">

      </div>
      <div class="col-9">

        <template v-if="!decided">
          <q-btn label="Ignore" class="q-mr-md" size="sm" @click="ignoreSuggestion()">
            <q-tooltip class="tooltip-small" :delay="500">Ignore this suggestion</q-tooltip>
          </q-btn>
          <q-btn label="Apply Suggestion"
                 size="sm" color="warning" @click="applySuggestion"></q-btn>
        </template>
        <template v-else>
          <q-btn label="Close Window" class="q-mr-md" size="sm" @click="closeWindow()"/>
        </template>
      </div>
    </div>

    <template v-if="useSettingsStore().isEnabled('dev')">
      <div class="row" v-for="s in useSuggestionsStore().getSuggestions()">
        <pre>{{ s }}</pre>
      </div>
    </template>


  </div>

</template>

<script lang="ts" setup>

import {onMounted, ref, watchEffect} from "vue";
import Analytics from "src/utils/google-analytics";
import {useRoute} from "vue-router";
import {useTabsStore} from "stores/tabsStore";
import {Tab} from "src/models/Tab";
import {Notify, QForm} from "quasar";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {TabAssignmentCommand} from "src/domain/tabs/TabAssignmentCommand";
import JsUtils from "src/utils/JsUtils";
import {Suggestion} from "src/models/Suggestion";
import {useSuggestionsStore} from "stores/suggestionsStore";
import {useBookmarksStore} from "stores/bookmarksStore";
import {ApplySuggestionCommand} from "src/domain/suggestions/ApplySuggestionCommand";
import {IgnoreSuggestionCommand} from "src/domain/suggestions/IgnoreSuggestionCommand";
import {useSettingsStore} from "stores/settingsStore";
import {useWindowsStore} from "stores/windowsStore";

const route = useRoute()

const suggestionId = ref<string | undefined>(undefined)
const suggestion = ref<Suggestion | undefined>(undefined)

const decided = ref(false)

onMounted(() => {
  Analytics.firePageViewEvent('MainPanelTabAssignmentPage', document.location.href);
})

watchEffect(() => {
  suggestionId.value = route.params.suggestionId as string
  if (suggestionId.value) {
    suggestion.value = useSuggestionsStore().getSuggestion(suggestionId.value)
  }
})

const closeWindow = () => window.close()

const applySuggestion = () => {
  if (suggestion.value) {
    useCommandExecutor().executeFromUi(new ApplySuggestionCommand(suggestion.value))
        .then(() => decided.value = true)
  }
}

const ignoreSuggestion = () => {
  if (suggestion.value) {
    useCommandExecutor().executeFromUi(new IgnoreSuggestionCommand(suggestion.value))
        .then(() => decided.value = true)
  }
}

</script>
