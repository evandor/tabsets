<template>
  <q-page style="min-width: 350px">
    <div v-if="showWatermark" id="watermark">{{ watermark }}</div>

    <div class="q-ma-none q-pa-md fit boxed">
      <div class="row q-mt-lg q-ml-sm">
        <div class="row fit">
          <div class="col-12 text-body2 text-center">The Art Of Linking</div>
        </div>
        <div class="col-12 text-h6 q-mb-md text-primary text-center">{{ $t('welcome_to_tabsets') }}</div>
      </div>

      <div
        class="q-pa-none q-ma-sm row items-start relative-position overflow-hidden cursor-pointer non-selectable"
        @click.stop="selected()">
        <!-- documentation -->
        <AnimatedContent
          :distance="100"
          direction="vertical"
          :reverse="false"
          :duration="0.8"
          ease="power3.out"
          :initial-opacity="0"
          :animate-opacity="true"
          :scale="1"
          :threshold="0.1"
          :delay="0">
          <q-card class="my-card fit popupbox">
            <q-card-section class="q-pb-none">
              <div class="q-row">
                <div class="q-col text-h6 text-center">Thank you for choosing Tabsets - we appreciate it</div>
              </div>
              <div class="q-row q-my-md">
                <div class="q-col text-body1 text-center">Let's begin without further delay!</div>
              </div>
              <div class="q-row q-my-md">
                <div class="q-col text-body1 text-center">Click the button to start adding tabs</div>
              </div>
              <div class="q-row">
                <div class="q-col text-body1 text-center q-mt-sm">
                  <DialogButton
                    label="ok, let's go"
                    :color="$q.dark.isActive ? '' : 'primary'"
                    :text-color="$q.dark.isActive ? 'warning' : 'white'"
                    @was-clicked="createGettingStartedTabset()"
                    :default-action="true"
                    data-testid="welcome-got-it" />
                </div>
              </div>
              <div class="q-row q-mt-lg">
                <div
                  class="col text-body2 text-blue-8 text-center cursor-pointer q-mb-sm"
                  @click="useNavigationService().browserTabFor('https://youtu.be/jxOonJ_x7Eg')">
                  Introduction Video
                </div>
              </div>
            </q-card-section>
          </q-card>
        </AnimatedContent>
      </div>
      <div class="row q-mr-sm">
        <div class="col-12 text-center">
          <span
            class="text-grey q-mx-none cursor-pointer"
            style="font-size: smaller"
            @click.stop="clicked('https://tabsets.web.app/#/privacy')"
            >Privacy</span
          >
          <span class="q-ma-none q-pa-none q-mx-xs text-grey-5">|</span>
          <span
            class="text-grey q-mx-none cursor-pointer"
            style="font-size: smaller"
            @click.stop="clicked('https://tabsets.web.app/#/tos')"
            >Terms of Service</span
          >
          <span class="q-ma-none q-pa-none q-mx-xs text-grey-5">|</span>
          <span
            class="text-grey q-mx-none cursor-pointer"
            style="font-size: smaller"
            @click.stop="clicked('https://docs.tabsets.net')"
            >Documentation</span
          >
        </div>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import { LocalStorage, openURL } from 'quasar'
import AnimatedContent from 'src/Animations/AnimatedContent/AnimatedContent.vue'
import { TITLE_IDENT } from 'src/boot/constants'
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useNavigationService } from 'src/core/services/NavigationService'
import Analytics from 'src/core/utils/google-analytics'
import { CreateSpecialTabsetCommand } from 'src/tabsets/commands/CreateSpecialTabsetCommand'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'
import { onMounted, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const tabsetNameRef = ref<HTMLElement>(null as unknown as HTMLInputElement)
const windowLocation = ref('---')
const showWatermark = ref(false)
const watermark = ref('')
const openTabsCount = ref(0)

onMounted(() => {
  Analytics.firePageViewEvent('WelcomePage', document.location.href)
  windowLocation.value = window.location.href
  LocalStorage.set(TITLE_IDENT, 'Tabsets' + stageIdentifier())
})

const createGettingStartedTabset = () => {
  // const tab1 = BrowserApi.createChromeTabObject('Getting Started', 'https://docs.tabsets.net/get-started')
  // const tab2 = BrowserApi.createChromeTabObject('Release Notes', 'https://docs.tabsets.net/release-notes')
  // LocalStorage.setItem('ui.hideWelcomePage', true)
  // router.push('/popup/getstarted')

  useCommandExecutor()
    .executeFromUi(new CreateSpecialTabsetCommand('UNCATEGORIZED', 'sym_o_help_center'))
    .then(() => {
      LocalStorage.setItem('ui.hideWelcomePage', true)
      chrome.storage.local.remove('tabsets.ext.ai.active')
      console.log('route', route.fullPath)

      // chrome.sidePanel.setOptions({
      //   enabled: false,
      // })

      // if (route.fullPath !== '/popup/welcome') {
      router.push('/popup/getstarted')
      // }
      //useNavigationService().browserTabFor('https://docs.tabsets.net/get-started')
    })
    .catch((err: any) => console.warn('got error', err))
}

watchEffect(() => {
  openTabsCount.value = useTabsStore2().browserTabs.length
})

// watchEffect(() => {
//   // we might have been redirected here too early, redirecting
//   // back as soon we know we actually do have some tabsets
//   if (useTabsetsStore().tabsets.size > 0) {
//     //console.log('routing back! We have tabsets!')
//     router.back()
//   }
// })

watchEffect(() => {
  showWatermark.value = useUiStore().getWatermark().length > 0
  watermark.value = useUiStore().getWatermark()
})

//https://groups.google.com/a/chromium.org/g/chromium-extensions/c/nb058-YrrWc
const selected = () => tabsetNameRef.value?.focus()

const stageIdentifier = () => (process.env.TABSETS_STAGE !== 'PRD' ? ' (' + process.env.TABSETS_STAGE + ')' : '')

const clicked = (url: string) => openURL(url)

const importFromBackup = () => {
  const url = chrome.runtime.getURL('/www/index.html#/mainpanel/settings?tab=importExport')
  useNavigationService().browserTabFor(url)
}
</script>
