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
          class="q-pa-sm q-mb-none row items-start q-gutter-md relative-position overflow-hidden cursor-pointer non-selectable"
          @click.stop="selected()">
          <transition name="q-transition--scale" :class="showDocumentation ? 'documentation' : 'box'">
            <q-card v-if="!showDocumentation" class="my-card fit">
              <q-card-section class="q-pb-none">
                <div class="row">
                  <div class="col-11">
                    <div class="text-h6 q-mb-sm">{{ $t('create_your_first_ts') }}</div>
                  </div>
                  <div class="col text-right">
                    <q-icon
                      name="sym_o_help"
                      class="cursor-pointer"
                      @click="toggleDocumentation"
                      size="xs"
                      color="accent" />
                  </div>
                </div>

                <q-input
                  v-model="tabsetName"
                  id="addTabsetSubmitBtn"
                  class="input-box"
                  autofocus
                  ref="tabsetNameRef"
                  :error-message="$t('no_special_chars_and_length')"
                  :error="!newTabsetNameIsValid()"
                  data-testid="newTabsetName"
                  @keydown.enter="addFirstTabset()"
                  hint="e.g. Music, Holidays, News..."
                  :label="$t('tabset_name')" />
              </q-card-section>
              <q-card-section class="q-ml-sm q-pl-none text-grey-8 text-body1">
                <q-checkbox v-model="addCurrentTabs" :label="$t('add_current_tabs')" size="xs" color="text-grey-8" />
              </q-card-section>
              <q-card-actions align="center" class="q-pr-md q-pb-xs q-ma-none q-my-md">
                <DialogButton
                  :label="$t('add_tabset')"
                  @was-clicked="addFirstTabset"
                  color="primary"
                  :disable="tabsetName.trim().length === 0 || !newTabsetNameIsValid()" />
              </q-card-actions>
              <q-card-actions align="center" class="q-pr-md q-pb-md q-ma-none q-mt-xl">
                <div>&nbsp;</div>
              </q-card-actions>
              <q-card-actions align="center" class="q-pr-md q-pb-md q-ma-none q-mt-none">
                <div
                  class="text-center q-ma-none q-pa-none text-accent cursor-pointer"
                  style="font-size: smaller"
                  @click="importFromBackup()">
                  or import from backup...
                </div>
              </q-card-actions>
            </q-card>

            <q-card v-else class="my-card fit" :class="showDocumentation ? 'documentation' : 'box'">
              <q-card-section class="q-pb-none">
                <div class="q-row">
                  <div class="q-col text-h6">Getting started...</div>
                </div>
                <div class="q-row q-my-md q-ml-sm">
                  <div class="q-col text-body1">
                    <div class="row">
                      <div class="col-1">
                        <q-icon name="o_featured_play_list" color="primary" class="q-mb-xs" size="xs" />
                      </div>
                      <div class="col q-ml-sm">Create a <em>collection</em> first</div>
                    </div>
                  </div>
                </div>
                <div class="q-row q-my-md q-ml-sm">
                  <div class="q-col text-body1">
                    <div class="row">
                      <div class="col-1">
                        <q-icon name="o_tab" color="primary" class="q-mr-sm q-mb-xs" size="xs" />
                      </div>
                      <div class="col q-ml-sm">Add your <em>active tab</em> to the new collection</div>
                    </div>
                  </div>
                </div>
                <div class="q-row q-my-md q-ml-sm">
                  <div class="q-col text-body1">
                    <div class="row">
                      <div class="col-1">
                        <q-icon name="o_replay" color="primary" class="q-mr-sm q-mb-xs" size="xs" />
                      </div>
                      <div class="col q-ml-sm">Switch tab, Repeat</div>
                    </div>
                  </div>
                </div>
                <div class="q-row q-my-md q-ml-sm">
                  <div class="q-col text-body1">
                    <div class="row">
                      <div class="col-1">
                        <q-icon name="o_settings" color="primary" class="q-mr-sm q-mb-xs" size="xs" />
                      </div>
                      <div class="col q-ml-sm">Discover more features</div>
                    </div>
                  </div>
                </div>
                <div class="q-row">
                  <div class="q-col text-body1 text-center q-mt-xl">
                    <DialogButton label="got it" @was-clicked="toggleDocumentation()" color="primary" />
                  </div>
                </div>
                <div class="q-row q-mt-lg">
                  <div
                    class="q-col text-body2 text-blue-8 text-center"
                    @click="useNavigationService().browserTabFor('https://youtu.be/jxOonJ_x7Eg')">
                    Introductionary Video
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
const showDocumentation = ref(true)
const imgSrc = ref('https://cdn.quasar.dev/img/parallax2.jpg')

onMounted(() => {
  Analytics.firePageViewEvent('WelcomePage', document.location.href)
  windowLocation.value = window.location.href
  LocalStorage.set(TITLE_IDENT, 'Tabsets' + stageIdentifier())
})

const urlFirst = 'https://cdn.quasar.dev/img/parallax2.jpg'
const urlSecond = 'https://cdn.quasar.dev/img/parallax1.jpg'

const toggleDocumentation = () => {
  showDocumentation.value = !showDocumentation.value
}

watchEffect(() => {
  useUiStore().showLoginTable = login.value
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

<style lang="scss">
.documentation {
  border: 3px solid $accent;
  border-radius: 10px;
  min-height: 400px;
}

.box {
  border: 1px solid $accent;
  border-radius: 10px;
  min-height: 400px;
}
</style>
