<template>
  <div class="q-ma-none q-pa-md fullimageBackground">
    <div class="row">
      <div class="col-12 text-h6">
        Welcome to Tabsets Extension
      </div>
    </div>
    <div class="row q-mb-lg">
      <div class="col-12 text-subtitle1">
        <i>Bookmarks next generation</i>
      </div>
    </div>

    <div class="row items-center">
      <div class="col-12 text-subtitle2 q-mb-md">
        To get started:
      </div>
    </div>

    <q-btn class="text-primary"
           outline
           data-testid="createFirstTabsetBtn"
           @click="addFirstTabset"
           label="create your first tabset"></q-btn>

    <div class="row q-mt-lg">
      <div class="col-12 items-center q-mb-md">
        This will create a new tabset containing some pre-chosen tabs.
      </div>
    </div>

    <div class="row q-mt-lg" v-if="$q.screen.gt.sm">
      <div class="col-12 items-center q-ma-sm q-pa-lg bg-yellow-4"
           style="border:1px solid grey;border-radius: 3px;">
        If you are using a recent version of chrome and this opened in the main window (not in the
        sidepanel), please try opening it again.
      </div>
    </div>



  </div>
</template>

<script lang="ts" setup>

import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import {useUiStore} from "stores/uiStore";
import {useQuasar} from "quasar";

const $q = useQuasar()

const addFirstTabset = () => $q.dialog({
  component: NewTabsetDialog, componentProps: {
    setEmptyByDefault: useUiStore().newTabsetEmptyByDefault,
    firstTabset: true,
    fromPanel: true
  }
})

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
