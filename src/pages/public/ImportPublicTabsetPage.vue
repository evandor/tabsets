<template>

  <div class="wrap" v-if="!runImport">
    <div class="text-h4">Shared Tabset</div>

    <div class="text-caption q-ma-lg">
      'Anonymous' wants to share a tabset named '{{ name }}' with you.<br>
      Click on "show" to proceed.
    </div>

    <div class="justify-center items-center q-gutter-md">
      <q-btn label="Close Window" color="accent" />
      <q-btn label="Show" color="warning" @click="start()" />
    </div>
  </div>

  <div class="wrap" v-else>
    <div class="loading">
      <div class="bounceball q-mr-lg"></div>
      <div class="text">please wait, loading tabset...</div>
    </div>
  </div>

</template>


<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {uid, useMeta, useQuasar} from "quasar";
import {Tabset} from "src/models/Tabset";
import {FirebaseCall} from "src/services/firebase/FirebaseCall";
import {useTabsetService} from "src/services/TabsetService2";
import {UserLevel, useUiStore} from "stores/uiStore";

const route = useRoute();
const router = useRouter();

const $q = useQuasar()

const shareId = ref(null as unknown as string)
const tabset = ref<Tabset>(new Tabset(uid(), "empty", []))
const runImport = ref(false)

const name = ref<string>(atob(route.query['n'] as string || btoa('unknown')))
const img = atob(route.query['i'] as string || btoa('https://tabsets.web.app/favicon.ico'))

let waitCounter = 0

async function setupTabset(importedTS: Tabset) {
  console.log("setup Tabset", waitCounter)

  try {
    console.log("useTabsetService()", useTabsetService())
    const res = await useTabsetService().saveTabset(importedTS)
    console.log("res", res)
    useTabsetService().selectTabset(importedTS.id)
    useTabsetService().reloadTabset(importedTS.id)
    router.push("/tabsets/" + tabset.value.id)
  } catch (err) {
    if (waitCounter++ < 5) {
      setTimeout(() => {setupTabset(importedTS as Tabset)}, 1000)
    } else {
      router.push("/tabsets")
    }
  }
}

onMounted(() => {
  if (!route || !route.params) {
    return
  }
  shareId.value = route?.params.sharedId as string
})

const start = () => {
  runImport.value = true
  console.log("shareId", shareId.value, name.value)
  FirebaseCall.get("/share/public/" + shareId.value, false)
    .then((res: any) => {
      tabset.value = res as Tabset

      const existingUserLevel = useUiStore().userLevel
      console.log("existinguserlevel", existingUserLevel)
      if (!existingUserLevel || existingUserLevel === UserLevel.UNKNOWN) {
        // PWA first time user
        useUiStore().setUserLevel(UserLevel.PWA_ONLY_USER)
      }

      const exists = useTabsetService().getTabset(tabset.value.id)
      if (!exists) {
        console.log("shared tabset does not exist yet, creating...")
        const importedTS = tabset.value //new Tabset(tabset.value.id, tabset.value.name, tabset.value.tabs as Tab[])
        importedTS.sharedId = shareId.value
        importedTS.importedAt = new Date().getTime()
        importedTS.sharedPath = route.fullPath
        console.log("importedTS", importedTS)
        setupTabset(importedTS as Tabset)
      } else if (exists) {
        console.log("...", exists.sharedAt, tabset.value.sharedAt, (exists.sharedAt || 0 - (tabset.value?.sharedAt || 0)))
        if (exists.sharedAt && (exists.sharedAt < (tabset.value.sharedAt || 0))) {
          const updatedTS = tabset.value
          updatedTS.sharedId = shareId.value
          updatedTS.importedAt = new Date().getTime()
          console.log("updatedTS", updatedTS)
          setupTabset(updatedTS as Tabset)
        } else {
          router.push("/tabsets/" + tabset.value.id)
        }
      } else {
        router.push("/tabsets/" + tabset.value.id)
      }
    })
    .catch((err) => {
      console.log("got error", err)
    })
}

</script>

<style lang="scss">
@import  url(https://fonts.googleapis.com/css?family=Montserrat);

$width: 25px;
$height: 25px;

$bounce_height: 30px;

body {
  position: relative;
  width: 100%;
  height: 100vh;
}

.wrap {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.text {
  color: #000066;
  font-size: 24px;
  display: inline-block;
  margin-left: 5px;
  font-family: Montserrat;
}

.bounceball {
  position: relative;
  display: inline-block;
  height: 37px;
  width: $width;
  &:before {
    position: absolute;
    content: '';
    display: block;
    top: 0;
    width: $width;
    height: $height;
    border-radius: 50%;
    background-color: #fbae17;
    transform-origin: 50%;
    animation: bounce 500ms alternate infinite ease;
  }
}

@keyframes bounce {
  0% {
    top: $bounce_height;
    height: 5px;
    border-radius: 60px 60px 20px 20px;
    transform: scaleX(2);
  }
  35% {
    height: $height;
    border-radius: 50%;
    transform: scaleX(1);
  }
  100% {
    top: 0;
  }
}
</style>
