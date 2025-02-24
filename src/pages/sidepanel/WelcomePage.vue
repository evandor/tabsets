<template>
  <q-page-container>
    <q-page>
      <div v-if="showWatermark" id="watermark">{{ watermark }}</div>

      <div class="q-ma-none q-pa-md fit">
        <div class="row q-mt-lg q-ml-sm">
          <div class="row">
            <div class="col-12 text-caption">The Art Of Linking</div>
          </div>
          <div class="col-12 text-h6 q-mb-md">{{ $t('welcome_to_tabsets') }}</div>
        </div>

        <div class="q-pa-sm q-mb-none row items-start q-gutter-md" @click.stop="selected()">
          <q-card class="my-card fit">
            <q-card-section class="q-pb-none">
              <div class="text-subtitle2 q-mb-sm">{{ $t('create_your_first_ts') }}</div>
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
            <q-card-section class="q-ml-sm q-pl-none text-grey-8">
              <q-checkbox v-model="addCurrentTabs" :label="$t('add_current_tabs')" size="xs" color="text-grey-8" />
            </q-card-section>
            <q-card-actions align="right" class="q-pr-md q-pb-xs q-ma-none q-my-md">
              <DialogButton
                :label="$t('add_tabset')"
                @was-clicked="addFirstTabset"
                :disable="tabsetName.trim().length === 0 || !newTabsetNameIsValid()" />
            </q-card-actions>
            <q-card-actions align="right" class="q-pr-md q-pb-md q-ma-none q-mt-none">
              <div
                class="text-right q-ma-none q-pa-none text-accent cursor-pointer"
                style="font-size: smaller"
                @click="importFromBackup()">
                or import from backup...
              </div>
            </q-card-actions>
            <!--            <q-card-actions align="right" class="q-pr-md q-pb-md q-ma-none q-mt-none">-->
            <!--              <div-->
            <!--                class="text-right q-ma-none q-pa-none text-accent cursor-pointer"-->
            <!--                style="font-size: smaller"-->
            <!--                @click="importFromBookmarks()">-->
            <!--                or import from bookmarks...-->
            <!--              </div>-->
            <!--              <div-->
            <!--                class="text-right q-ma-none q-pa-none text-accent cursor-pointer"-->
            <!--                style="font-size: smaller"-->
            <!--                @click="opentabsView()">-->
            <!--                or start from your open tabs...-->
            <!--              </div>-->
            <!--            </q-card-actions>-->
          </q-card>
        </div>
        <div class="row q-mr-sm">
          <div class="col-12 text-right">
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
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import { STRIP_CHARS_IN_USER_INPUT, TITLE_IDENT } from 'src/boot/constants'
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useNavigationService } from 'src/core/services/NavigationService'
import Analytics from 'src/core/utils/google-analytics'
import { ActivateFeatureCommand } from 'src/features/commands/ActivateFeatureCommand'
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

onMounted(() => {
  Analytics.firePageViewEvent('WelcomePage', document.location.href)
  windowLocation.value = window.location.href
  LocalStorage.set(TITLE_IDENT, 'Tabsets' + stageIdentifier())
})

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

const opentabsView = () => {
  // useFeaturesStore().activateFeature(FeatureIdent.OPEN_TABS)
  useUiStore().sidePanelSetActiveView(SidePanelViews.TABS_LIST)
}

const importFromBookmarks = () => {
  useCommandExecutor()
    .execute(new ActivateFeatureCommand(FeatureIdent.BOOKMARKS))
    .then(() => {
      router.push('/sidepanel/bookmarks/import')
    })
}

const importFromBackup = () => {
  const url = chrome.runtime.getURL('/www/index.html#/mainpanel/settings?tab=importExport')
  useNavigationService().browserTabFor(url)
}
</script>

<style scoped>
:deep(.input-box .q-field__control),
:deep(.input-box .q-field__marginal) {
  height: 52px;
  font-size: 18px;
}
</style>
