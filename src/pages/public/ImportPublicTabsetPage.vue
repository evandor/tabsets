<template>
  <div class="wrap" v-if="state === 'runImport'">
    <div class="text-h4">Shared Tabset</div>

    <div class="text-body1 q-mx-none q-my-lg">
      <i>{{ author }}</i> wants to share a tabset named <i>{{ name }}</i> with you.<br />
      Click on "show" (or "update") to proceed.
    </div>

    <div class="text-body1 q-mx-none q-my-lg" v-if="maybeTabset">
      You already imported this tabset {{ maybeTabset.importedAt }}, updated at {{ date }}
    </div>

    <div class="justify-center items-center q-gutter-md">
      <q-btn label="Close Window" color="accent" @click="closeWindow()" />
      <q-btn :label="maybeTabset ? 'Update' : 'Show'" color="warning" @click="start()" />
    </div>
  </div>

  <div class="wrap" v-else-if="state === 'importing'">
    <div class="loading">
      <div class="bounceball q-mr-lg"></div>
      <div class="text">please wait, loading tabset...</div>
    </div>
  </div>

  <div class="wrap" v-else>
    <div class="text-h4">Shared Tabset</div>

    <div class="text-body1 q-mx-none q-my-lg">
      <i>{{ author }}</i> wants to share a tabset named <i>{{ name }}</i> with you.<br />
      Click on "show" (or "update") to proceed.
    </div>

    <div class="text-body1 q-mx-none q-my-lg">Sorry, this tabset is not available any more.</div>

    <div class="justify-center items-center q-gutter-md">
      <q-btn label="Close Window" color="accent" @click="closeWindow()" />
    </div>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { uid } from 'quasar'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const shareId = ref(null as unknown as string)
const tabset = ref<Tabset>(new Tabset(uid(), 'empty', []))
const state = ref('runImport')
const maybeTabset = ref<Tabset | undefined>(undefined)

const author = ref<string>(atob((route.query['a'] as string) || btoa('unknown user')))
const name = ref<string>(atob((route.query['n'] as string) || btoa('unknown')))
const date = ref<number>(route.query['d'] as unknown as number)
//const img = atob(route.query['i'] as string || btoa('https://tabsets.web.app/favicon.ico'))

let waitCounter = 0

async function setupTabset(importedTS: Tabset) {
  // console.log('setup Tabset')
  // importedTS.id = uid()
  // const res = await useTabsetService().saveTabset(importedTS)
  // console.log('res', res)
  // useTabsetService().selectTabset(importedTS.id)
  //useTabsetService().reloadTabset(importedTS.id)
  router.push('/p/tabsets/' + tabset.value.id)
}

function paramNotSet(ident: string) {
  return !route.query[ident] || (route.query[ident] as string).trim().length === 0
}

onMounted(() => {
  if (!route || !route.params) {
    return
  }
  shareId.value = route?.params.sharedId as string
  if (shareId.value) {
    console.log('searching for tabset with shareId', shareId.value)
    maybeTabset.value = _.first(
      _.filter(
        [...useTabsetsStore().tabsets.values()] as Tabset[],
        (ts: Tabset) => ts.sharing?.sharedId === shareId.value,
      ),
    )
    // skip intro ?
    if (paramNotSet('a') && paramNotSet('n')) {
      start()
    }
    //console.log("%cfound", "color:green", maybeTabset.value)
  }
})

// useMeta(() => {
//   return {
//     // whenever "title" from above changes, your meta will automatically update
//     title: tabset.value.tabs.length > 0 ? tabset.value.tabs[0].title : '???',
//     meta: {
//       //description: {name: 'og:title', content: 'Page 1'},
//       ogTitle: {
//         property: 'og:title',
//         content: 'sharing with tabsets'
//       }
//       // ogImage: {
//       //   property: 'og:image',
//       //   content: tabset.value.tabs.length > 0 ? tabset.value.tabs[0].image : ''
//       // }
//     }
//   }
// })

const start = async () => {
  state.value = 'importing'
  console.log('shareId', shareId.value, name.value)

  tabset.value = await useTabsetsStore().loadPublicTabset(shareId.value)
  console.log('tabset', tabset.value)
  await setupTabset(tabset.value)
}

const closeWindow = () => window.close()
</script>

<style lang="scss">
@import url(https://fonts.googleapis.com/css?family=Montserrat);

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
