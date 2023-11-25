<template>

  <!-- toolbar -->
  <q-toolbar class="text-primary">

    <q-toolbar-title>
      {{ suggestion?.state === SuggestionState.NOTIFICATION ? 'Notification' : 'Suggestion' }}
    </q-toolbar-title>

  </q-toolbar>


  <div class="q-pa-md q-gutter-sm">
    <!--    <q-banner rounded class="bg-grey-1 text-primary">-->
    <!--      Suggestions Info text: TODO-->
    <!--    </q-banner>-->

    <div class="row items-baseline q-ma-md">
      <div class="col-3 text-bold">
        Title
      </div>
      <div class="col-9">
        {{ suggestion?.title }}
      </div>
    </div>

    <div class="row q-mt-none q-pt-none q-ma-md">
      <div class="col-3 text-bold">
        &nbsp;
      </div>
      <div class="col-9 text-caption text-grey">
        {{ date.formatDate(suggestion?.created, 'DD.MM.YYYY HH:mm') }}
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
    <div class="row items-baseline q-ma-md" v-if="suggestion?.data['url' as keyof object]">
      <div class="col-3 text-bold">
        URL
      </div>
      <div class="col-9 text-blue cursor-pointer">
        <div @click="NavigationService.openOrCreateTab([suggestion?.data['url' as keyof object]])">
          {{ suggestion?.data['url' as keyof object] }}
        </div>
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

    <template v-if="suggestion?.type === SuggestionType.CONTENT_CHANGE">
      <div class="row">
        <div class="col-6">

          <q-scroll-area style="height: 630px; width:100%;">
            <div class="row no-wrap">
              <img id="monitoringStartImg">
            </div>
          </q-scroll-area>
        </div>
        <div class="col-6">
          <q-btn label="Click to compare with current website" @click="createImageToCompare()"/>
          <div class="text-caption q-mt-lg">
            This will open a new tab, load the current version of the monitored website and
            create an image which will be compared to the older snapshot.
          </div>
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
      <div class="row" v-for="s in useSuggestionsStore().getSuggestions([
          SuggestionState.NEW, SuggestionState.DECISION_DELAYED, SuggestionState.CHECKED, SuggestionState.IGNORED,
          SuggestionState.NOTIFICATION, SuggestionState.INACTIVE])">
        <pre>{{ s }}</pre>
      </div>
    </template>


  </div>

</template>

<script lang="ts" setup>

import {onMounted, ref, watchEffect} from "vue";
import Analytics from "src/utils/google-analytics";
import {useRoute} from "vue-router";
import {date} from "quasar";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {Suggestion, SuggestionState, SuggestionType} from "src/models/Suggestion";
import {useSuggestionsStore} from "stores/suggestionsStore";
import {ApplySuggestionCommand} from "src/domain/suggestions/ApplySuggestionCommand";
import {IgnoreSuggestionCommand} from "src/domain/suggestions/IgnoreSuggestionCommand";
import {useSettingsStore} from "stores/settingsStore";
import NavigationService from "src/services/NavigationService";
import PdfService from "src/services/PdfService";

const route = useRoute()

const suggestionId = ref<string | undefined>(undefined)
const suggestion = ref<Suggestion | undefined>(undefined)

const decided = ref(false)

onMounted(() => {
  Analytics.firePageViewEvent('MainPanelTabAssignmentPage', document.location.href);
})

watchEffect(async () => {
  suggestionId.value = route.params.suggestionId as string
  if (suggestionId.value) {
    suggestion.value = useSuggestionsStore().getSuggestion(suggestionId.value)
    console.log("got suggestion", suggestion.value)
    if (suggestion.value) {
      const tabId = suggestion.value['data' as keyof object]['tabId' as keyof object]
      console.log("got tabId", tabId)
      const pngs = await PdfService.getPngsForTab(tabId)
      console.log("pngs", pngs)

      var urlCreator = window.URL || window.webkitURL;
      var imageUrl = urlCreator.createObjectURL(pngs[0].content);
      console.log("imageUrl", imageUrl)
      const img1:HTMLImageElement | null = document.querySelector("#monitoringStartImg")
      if (img1) {
        img1.src = imageUrl;
      }

      return "chrome-extension://pndffocijjfpmphlhkoijmpfckjafdpl/www/index.html#/mainpanel/mhtml/7b961cb4-243f-430a-b28e-0e9421febdc2"
    }
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

const oldSnapshot = () => {
  return "chrome-extension://pndffocijjfpmphlhkoijmpfckjafdpl/www/index.html#/mainpanel/mhtml/7b961cb4-243f-430a-b28e-0e9421febdc2"
}

const oldPng = async () => {

}

const createImageToCompare = () => {
  if (suggestion.value?.url) {
    NavigationService.openOrCreateTab([suggestion.value?.url], undefined, undefined, true)
  }
}

</script>
