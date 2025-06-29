<template>
  <q-page-container>
    <q-page>
      <div v-if="showWatermark" id="watermark">{{ watermark }}</div>

      <div class="q-ma-none q-pa-md fit">
        <div class="row q-mt-lg q-ml-sm">
          <div class="row">
            <div class="col-12 text-caption">The Art Of Linking</div>
          </div>
          <div class="col-12 text-h6 q-mb-md text-primary">{{ $t('welcome_to_tabsets') }}</div>
        </div>

        <div
          class="q-pa-none q-ma-sm row items-start relative-position overflow-hidden cursor-pointer non-selectable"
          @click.stop="selected()">
          <transition name="q-transition--jump-right" class="documentation">
            <q-card class="my-card fit documentation">
              <q-card-section class="q-pb-none">
                <div class="q-row">
                  <div class="q-col text-h6">Getting started...</div>
                </div>
                <div class="q-row q-my-md q-ml-sm">
                  <div class="q-col text-body1">
                    <div class="row">
                      <div class="col-1">
                        <q-icon name="o_person" color="primary" class="q-mb-xs" size="xs" />
                      </div>
                      <div class="col q-ml-sm">
                        Start by creating an <em>account</em> to be able to access your tabsets from any machine on any
                        browser.
                      </div>
                    </div>
                  </div>
                </div>
                <div class="q-row q-my-md q-ml-sm">
                  <div class="q-col text-body1">
                    <div class="row">
                      <div class="col-1">
                        <q-icon name="o_tab" color="primary" class="q-mr-sm q-mb-xs" size="xs" />
                      </div>
                      <div class="col q-ml-sm">Then create a tabset and start adding your <em>tab(s)</em></div>
                    </div>
                  </div>
                </div>
                <div class="q-row q-my-md q-ml-sm">
                  <div class="q-col text-body1">
                    <div class="row">
                      <div class="col-1">
                        <q-icon name="o_replay" color="primary" class="q-mr-sm q-mb-xs" size="xs" />
                      </div>
                      <div class="col q-ml-sm">Switch tab or tabset, Repeat</div>
                    </div>
                  </div>
                </div>
                <div class="q-row q-mt-md q-ml-sm">
                  <div class="q-col text-body1">
                    <div class="row">
                      <div class="col-1">
                        <q-icon name="o_settings" color="primary" class="q-mr-sm q-mb-xs" size="xs" />
                      </div>
                      <div class="col q-ml-sm">Discover more features</div>
                    </div>
                  </div>
                </div>
                <div class="q-row q-mb-md q-ml-sm">
                  <div class="q-col text-body1">
                    <div class="row">
                      <div class="col-1"></div>
                      <div class="col q-ml-md text-body2 text-grey">
                        Search<br />
                        Drag & Drop<br />
                        Bookmarks Integration<br />
                        Quick Access to tabs<br />
                        ...<br />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="q-row">
                  <div class="q-col text-body1 text-center q-mt-sm">
                    <DialogButton label="got it..." @was-clicked="gotoLoginPage()" data-testid="welcome-got-it" />
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
          </transition>
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
  </q-page-container>
</template>

<script lang="ts" setup>
import { LocalStorage, openURL } from 'quasar'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import { STRIP_CHARS_IN_USER_INPUT, TITLE_IDENT } from 'src/boot/constants'
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useNavigationService } from 'src/core/services/NavigationService'
import Analytics from 'src/core/utils/google-analytics'
import { CreateTabsetCommand } from 'src/tabsets/commands/CreateTabsetCommand'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useAuthStore } from 'stores/authStore'
import { onMounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const tabsetName = ref('')
const tabsetNameRef = ref<HTMLElement>(null as unknown as HTMLInputElement)
const windowLocation = ref('---')
const login = ref(false)
const addCurrentTabs = ref(false)
const showWatermark = ref(false)
const watermark = ref('')
const openTabsCount = ref(0)

onMounted(() => {
  Analytics.firePageViewEvent('WelcomePage', document.location.href)
  windowLocation.value = window.location.href
  LocalStorage.set(TITLE_IDENT, 'Tabsets' + stageIdentifier())
})

const gotoLoginPage = () => {
  LocalStorage.setItem('ui.welcomepro.shown', true)
  if (useAuthStore().isAuthenticated()) {
    router.push('/sidepanel')
    return
  }
  router.push('/sidepanel/login?mode=signup')
}

watchEffect(() => {
  openTabsCount.value = useTabsStore2().browserTabs.length
})

watchEffect(() => {
  // we might have been redirected here too early, redirecting
  // back as soon we know we actually do have some tabsets
  if (useTabsetsStore().tabsets.size > 0) {
    //console.log('routing back! We have tabsets!')
    router.back()
  }
})

watchEffect(() => {
  showWatermark.value = useUiStore().getWatermark().length > 0
  watermark.value = useUiStore().getWatermark()
})

const addFirstTabset = () => {
  useCommandExecutor()
    .executeFromUi(new CreateTabsetCommand(tabsetName.value, addCurrentTabs.value ? useTabsStore2().browserTabs : []))
    .then((res: any) => {
      useUiStore().sidePanelSetActiveView(SidePanelViews.MAIN)
      router.push('/sidepanel?first=true')
    })
}

const newTabsetNameIsValid = () => tabsetName.value.length <= 32 && !STRIP_CHARS_IN_USER_INPUT.test(tabsetName.value)

//https://groups.google.com/a/chromium.org/g/chromium-extensions/c/nb058-YrrWc
const selected = () => tabsetNameRef.value?.focus()

const stageIdentifier = () => (process.env.TABSETS_STAGE !== 'PRD' ? ' (' + process.env.TABSETS_STAGE + ')' : '')

const clicked = (url: string) => openURL(url)

const importFromBackup = () => {
  const url = chrome.runtime.getURL('/www/index.html#/mainpanel/settings?tab=importExport')
  useNavigationService().browserTabFor(url)
}
</script>
