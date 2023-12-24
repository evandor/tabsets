1<template>
  <div class="q-ma-none q-pa-md fullimageBackground" @click="selected()">
    <div class="row">
      <div class="row">
        <div class="col-12 text-caption">
          Next Generation Bookmarks Extension
        </div>
      </div>
      <div class="col-12 text-h6 q-mb-md">
        Welcome to Tabsets
      </div>
    </div>

    <div class="q-pa-sm row items-start q-gutter-md">
      <q-card class="my-card fit">
        <q-card-section>
          <span class="text-subtitle2">Create your first Tabset</span>
          <br>
          Provide a name and add tabs later
        </q-card-section>
        <!--        <q-card-section class="q-ma-none q-pa-none q-ml-md">-->
        <!--          <q-icon name="check" color="primary" class="q-mr-xs"/>-->
        <!--          Create your first tabset:-->
        <!--        </q-card-section>-->
        <!--        <q-card-section class="q-ma-none q-pa-none q-ml-md">-->
        <!--          <q-icon name="check" color="primary" class="q-mr-xs"/>-->
        <!--          Provide a name...-->
        <!--        </q-card-section>-->
        <!--        <q-card-section class="q-ma-none q-pa-none q-ml-md">-->
        <!--          <q-icon name="check" color="primary" class="q-mr-xs"/>-->
        <!--          ... and add tabs later-->
        <!--        </q-card-section>-->
        <q-card-section class="q-pb-none">
          <q-input v-model="tabsetName"
                   dense
                   autofocus
                   ref="tabsetNameRef"
                   error-message="Please do not use special Characters, maximum length is 32"
                   :error="!newTabsetNameIsValid()"
                   data-testid="newTabsetName"
                   @keydown.enter="addFirstTabset()"
                   label="Tabset name"/>
        </q-card-section>
        <q-card-actions align="right" class="q-pr-md q-pb-md q-ma-none">
          <DialogButton
              label="Add Tabset"
              @was-clicked="addFirstTabset"
              :disable="tabsetName.trim().length === 0 || !newTabsetNameIsValid()"/>
        </q-card-actions>
      </q-card>
    </div>
<!--    <div class="q-pa-sm row items-start q-gutter-md">-->
<!--      <q-btn label="import tabsets" @click="showImportDialog"></q-btn>-->
<!--    </div>-->
  </div>
</template>

<script lang="ts" setup>

import {SidePanelView, useUiStore} from "src/stores/uiStore";
import {useQuasar} from "quasar";
import {onMounted, ref, watchEffect} from "vue";
import {useTabsStore} from "stores/tabsStore";
import {useRouter} from "vue-router";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {CreateTabsetCommand} from "src/domain/tabsets/CreateTabset";
import NavigationService from "src/services/NavigationService";
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {useSpacesStore} from "stores/spacesStore";
import {TabsetStatus} from "src/models/Tabset";
import Analytics from "src/utils/google-analytics";
import {nextTick} from 'vue'
import DialogButton from "components/buttons/DialogButton.vue";
import ImportDialog from "components/dialogues/ImportDialog.vue";

const $q = useQuasar()
const router = useRouter()

const tabsetName = ref('')
const tabsetNameRef = ref<HTMLElement>(null as unknown as HTMLInputElement)

onMounted(() => {
  Analytics.firePageViewEvent('WelcomePage', document.location.href);
})

setTimeout(() => {
  console.log("focusing", tabsetNameRef.value)
  //document.getElementsByTagName("input")[0].focus()
  nextTick(() => {
    window.document.getElementsByTagName("input")[0].focus()
    tabsetNameRef.value.focus()
  });

}, 2000)

watchEffect(() => {
  // we might have been redirected here too early, redirecting
  // back as soon we know we actually do have some tabsets
  if (useTabsStore().tabsets.size > 0) {
    console.log("routing back! We have tabsets!")
    router.back()
  }
})

const addFirstTabset = () => {
  useCommandExecutor()
      .executeFromUi(new CreateTabsetCommand(tabsetName.value, []))
      .then((res) => {
        useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)
        router.push("/sidepanel?first=true")
      })
}

const newTabsetNameIsValid = () =>
    tabsetName.value.length <= 32 && !STRIP_CHARS_IN_USER_INPUT.test(tabsetName.value)

//https://groups.google.com/a/chromium.org/g/chromium-extensions/c/nb058-YrrWc
const selected = () => tabsetNameRef.value.focus()

const showImportDialog = () => $q.dialog({component: ImportDialog, componentProps: {inSidePanel: true}})

</script>

<style scoped>


.fullimageBackground {
  height: 100vh;
  width: 100%;
  align-items: center;
  justify-content: center;
}

.fullimageBackground::before {
  background-image: url('src/assets/bg.jpg');
  background-size: cover;
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  opacity: 0.3;
}

</style>
