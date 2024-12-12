<template>
  <router-view/>
</template>

<script setup lang="ts">

import {getCssVar, setCssVar, useQuasar} from "quasar";
import AppService from "src/app/AppService";
import {EventEmitter} from "events";
import {useRouter} from "vue-router";
import {useLogger} from "src/services/Logger";
import {useSettingsStore} from "stores/settingsStore";
import {useAppStore} from "stores/appStore";
import {usePermissionsStore} from "src/core/stores/usePermissionsStore";
import {FontSize, useUiStore} from "src/ui/stores/uiStore";

const $q = useQuasar()
const router = useRouter()

const settingsStore = useSettingsStore()
settingsStore.initialize($q.localStorage)
console.log("")

usePermissionsStore().initialize()
console.log("")

useAppStore().init()

const {info} = useLogger()

// https://stackoverflow.com/questions/9768444/possible-eventemitter-memory-leak-detected
const emitter = new EventEmitter()
emitter.setMaxListeners(12)

let useDarkMode: string = $q.localStorage.getItem('darkMode') || "auto" as string

if ($q.platform.is.safari && !$q.platform.is.bex) {
  console.log("switching dark mode default to false on safari non-bex")
  useDarkMode = $q.localStorage.getItem('darkMode') || "false" as string
}

if (useDarkMode === "true") {
  $q.dark.set(true)
} else if (useDarkMode === "false") {
  $q.dark.set(false)
} else {
  $q.dark.set("auto")
}

if (useDarkMode === "true") {
  setCssVar('primary', '#D9E8F5');
  setCssVar('secondary', '#26A69A');
  setCssVar('accent', '#aab9df');
  setCssVar('dark', '#1d1d1d');
  setCssVar('positive', '#21BA45');
  setCssVar('negative', '#C10015');
  setCssVar('info', '#31CCEC');
  setCssVar('separator', '#AA0099');
  // setCssVar('warning', 'green');

  // $body-font-size   : var(--q-theme-font-size, 20px);
  // $body-line-height : var(--q-theme-line-height, 1.2);
  // $typography-font-family: var(--q-theme-font-family, "'Roboto', '-apple-system', 'Helvetica Neue', Helvetica, Arial, sans-serif");
  // $button-font-size: var(--q-theme-btn-font-size, 16px);
}

const fontsize = useUiStore().fontsize
useUiStore().setFontsize(fontsize)

AppService.init($q, router, false)

info(`tabsets started: mode=${process.env.MODE}, version=${import.meta.env.PACKAGE_VERSION}`)

</script>
