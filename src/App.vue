<template>
  <router-view/>
</template>

<script setup lang="ts">
import {useQuasar} from "quasar";
import {useUtils} from "src/services/Utils";
import {EventEmitter} from "events";
import AppService from "src/services/AppService";
import {Analytics} from "app/src-bex/google-analytics";

const {inBexMode} = useUtils()

const $q = useQuasar()

// https://stackoverflow.com/questions/9768444/possible-eventemitter-memory-leak-detected
const emitter = new EventEmitter()
emitter.setMaxListeners(12)

$q.dark.set($q.localStorage.getItem('darkMode') || false)

console.log("calling appService init")
AppService.init()

// //import Analytics from '../scripts/google-analytics.js';
//
// // Fire a page view event on load
// window.addEventListener('load', () => {
//   console.log("ga: firePageViewEvent")
//   Analytics.firePageViewEvent(document.title, document.location.href);
// });
//
// // Listen globally for all button events
// document.addEventListener('click', (event) => {
//   if (event.target instanceof HTMLButtonElement) {
//     console.log("ga: HTMLButtonElement")
//     Analytics.fireEvent('click_button', { id: event.target.id });
//   }
// });

</script>
