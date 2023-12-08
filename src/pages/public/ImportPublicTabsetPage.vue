<template>

  <div class="wrap">
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

const route = useRoute();
const router = useRouter();

const $q = useQuasar()

const tabsetId = ref(null as unknown as string)
const tabset = ref<Tabset>(new Tabset(uid(), "empty", []))

console.log("query", route.query['n'])
const name = atob(route.query['n'] as string || btoa('unknown'))
const img = atob(route.query['i'] as string || btoa('https://tabsets.web.app/favicon.ico'))

let waitCounter = 0

async function setupTabset(importedTS: Tabset) {
  console.log("setup Tabset", waitCounter)

  try {
    console.log("useTabsetService()", useTabsetService())
    await useTabsetService().saveTabset(importedTS)
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


  // if (!useTabsetService() && waitCounter < 10) {
  //   waitCounter++
  //   console.log("tabset service not ready yet, retrying ", waitCounter)
  //   setTimeout(() => {
  //     setupTabset(importedTS as Tabset)
  //   }, 1000)
  // } else if (waitCounter >= 10) {
  //   router.push("/tabsets/")
  // } else {
  //   console.log("useTabsetService()", useTabsetService())
  //   useTabsetService().saveTabset(importedTS)
  //   useTabsetService().selectTabset(importedTS.id)
  //   useTabsetService().reloadTabset(importedTS.id)
  //   router.push("/tabsets/" + tabset.value.id)
  // }
}

onMounted(() => {
  if (!route || !route.params) {
    return
  }
  tabsetId.value = route?.params.sharedId as string
  console.log("tabsetId", tabsetId.value, name.value)
  FirebaseCall.get("/share/public/" + tabsetId.value, false)
    .then((res: any) => {
      tabset.value = res as Tabset

      const exists = useTabsetService().getTabset(tabset.value.id)
      if (!exists) {
        const importedTS = tabset.value //new Tabset(tabset.value.id, tabset.value.name, tabset.value.tabs as Tab[])
        console.log("importedTS", importedTS)
        setupTabset(importedTS as Tabset)
      }
    })
})

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
