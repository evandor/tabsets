<template>
  <router-view/>
</template>

<script setup lang="ts">
import {useQuasar} from "quasar";
import {useUtils} from "src/services/Utils";
import {EventEmitter} from "events";
import AppService from "src/services/AppService";

const {inBexMode} = useUtils()

const $q = useQuasar()

// https://stackoverflow.com/questions/9768444/possible-eventemitter-memory-leak-detected
const emitter = new EventEmitter()
emitter.setMaxListeners(12)

$q.dark.set($q.localStorage.getItem('darkMode') || false)

console.log("calling appService init")
AppService.init()

</script>
