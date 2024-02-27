<template>
  <q-page-container>
    <q-page>

      <div class="q-ma-none q-pa-md fit">
        <div class="row q-mt-lg">
          <div class="row">
            <div class="col-12 text-caption">
              The Art Of Linking
            </div>
          </div>
          <div class="col-12 text-h6 q-mb-md">
            {{ t('welcome_to_tabsets') }} {{ stageIdentifier() }}
          </div>
        </div>

        <div class="q-pa-sm q-mb-none row items-start q-gutter-md" @click.stop="selected()">
          <q-card class="my-card fit">
            <q-card-section>
              <span class="text-subtitle2">{{ t('create_your_first_ts')}}</span>
              <br>
              Provide a name and add tabs later
            </q-card-section>
            <q-card-section class="q-pb-none">
              <q-input v-model="tabsetName"
                       dense
                       autofocus
                       ref="tabsetNameRef"
                       error-message="Please do not use special Characters, maximum length is 32"
                       :error="!newTabsetNameIsValid()"
                       data-testid="newTabsetName"
                       @keydown.enter="addFirstTabset()"
                       label="Tabset name"/>
            </q-card-section>
            <q-card-actions align="right" class="q-pr-md q-pb-md q-ma-none">
              <DialogButton
                label="Add Tabset"
                @was-clicked="addFirstTabset"
                :disable="tabsetName.trim().length === 0 || !newTabsetNameIsValid()"/>
            </q-card-actions>
          </q-card>
        </div>
        <div class="row q-mr-sm">
          <div class="col-12 text-right">
            <span class="text-grey q-mx-none cursor-pointer" style="font-size:smaller"
                  @click.stop="clicked('https://tabsets.web.app/#/privacy')">Privacy</span>
            <span class="q-ma-none q-pa-none q-mx-xs text-grey-5">|</span>
            <span class="text-grey q-mx-none cursor-pointer" style="font-size:smaller"
                  @click.stop="clicked('https://tabsets.web.app/#/tos')">Terms of Service</span>
            <span class="q-ma-none q-pa-none q-mx-xs text-grey-5">|</span>
            <span class="text-grey q-mx-none cursor-pointer" style="font-size:smaller"
                  @click.stop="clicked('https://docs.tabsets.net')">Documentation</span>
          </div>
        </div>

        <br><br>

        <div class="row q-mt-lg q-ml-md">
          <div class="col-12 text-caption q-mb-sm">
            Optionally
          </div>
          <div class="col-12 q-mb-md">
            <q-checkbox size="xs" v-model="activateBookmarks" class="text-grey" label="Activate Bookmarks Integration"/>
            <q-checkbox size="xs" v-model="activateNotifications" class="text-grey" label="Activate Notifications"/>
            <template v-if="firebaseActive()">
              <q-checkbox
                size="xs" v-model="login" class="text-grey" label="Login or create Account"/>
            </template>
          </div>
        </div>

      </div>
    </q-page>
  </q-page-container>
</template>

<script lang="ts" setup>

import {SidePanelView, useUiStore} from "src/stores/uiStore";
import {onMounted, ref, watchEffect} from "vue";
import {useTabsStore} from "stores/tabsStore";
import {useRouter} from "vue-router";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {CreateTabsetCommand} from "src/domain/tabsets/CreateTabset";
import {STRIP_CHARS_IN_USER_INPUT, TITLE_IDENT} from "boot/constants";
import Analytics from "src/utils/google-analytics";
import DialogButton from "components/buttons/DialogButton.vue";
import {useAuthStore} from "stores/authStore";
import {LocalStorage, openURL} from "quasar";
import {FeatureIdent} from "src/models/AppFeature";
import {AppFeatures} from "src/models/AppFeatures";
import {GrantPermissionCommand} from "src/domain/commands/GrantPermissionCommand";
import {usePermissionsStore} from "stores/permissionsStore";
import { useI18n } from 'vue-i18n'

const router = useRouter()

const tabsetName = ref('')
const tabsetNameRef = ref<HTMLElement>(null as unknown as HTMLInputElement)
const windowLocation = ref('---')
const activateBookmarks = ref(false)
const activateNotifications = ref(false)
const login = ref(false)

const { t } = useI18n({inheritLocale: true,})

onMounted(() => {
  Analytics.firePageViewEvent('WelcomePage', document.location.href);
  windowLocation.value = window.location.href
  LocalStorage.set(TITLE_IDENT, 'Tabsets' + stageIdentifier())
})

watchEffect(() => {
  const bmFeature = new AppFeatures().getFeature(FeatureIdent.BOOKMARKS)
  if (activateBookmarks.value && bmFeature) {
    useCommandExecutor().execute(new GrantPermissionCommand('bookmarks'))
  } else if (!activateBookmarks.value && bmFeature) {
    //useCommandExecutor().execute(new RevokePermissionCommand('bookmarks'))
    usePermissionsStore().deactivateFeature('bookmarks')
  }
})

watchEffect(() => {
  const feature = new AppFeatures().getFeature(FeatureIdent.NOTIFICATIONS)
  if (activateNotifications.value && feature) {
    useCommandExecutor().execute(new GrantPermissionCommand('notifications'))
  } else if (!activateNotifications.value && feature) {
    usePermissionsStore().deactivateFeature('notifications')
  }
})

watchEffect(() => {
  useUiStore().showLoginTable = login.value
})

watchEffect(() => {
  const ar = useAuthStore().useAuthRequest
  if (ar) {
    console.log(">>> authRequest received @", window.location.href)
    const baseLocation = window.location.href.split("?")[0]
    if (window.location.href.indexOf("?") < 0) {
      const tsIframe = window.parent.frames[0]
      //console.log("iframe", tsIframe)
      if (tsIframe) {
        console.debug(">>> new window.location.href", baseLocation + "?" + ar)
        tsIframe.location.href = baseLocation + "?" + ar
        tsIframe.location.reload()
      }
    }
    useAuthStore().setAuthRequest(null as unknown as string)
  }
})

watchEffect(() => {
  // we might have been redirected here too early, redirecting
  // back as soon we know we actually do have some tabsets
  if (useTabsStore().tabsets.size > 0) {
    console.log("routing back! We have tabsets!")
    router.back()
  }
})

const addFirstTabset = () => {
  useCommandExecutor()
    .executeFromUi(new CreateTabsetCommand(tabsetName.value, []))
    .then((res) => {
      useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)
      router.push("/sidepanel?first=true")
    })
}

const newTabsetNameIsValid = () =>
  tabsetName.value.length <= 32 && !STRIP_CHARS_IN_USER_INPUT.test(tabsetName.value)

//https://groups.google.com/a/chromium.org/g/chromium-extensions/c/nb058-YrrWc
const selected = () => tabsetNameRef.value.focus()

const stageIdentifier = () => process.env.TABSETS_STAGE !== 'PRD' ? ' (' + process.env.TABSETS_STAGE + ')' : ''

const clicked = (url: string) => openURL(url)

const firebaseActive = () => {
  return process.env.USE_FIREBASE && process.env.USE_FIREBASE.toString() === "true"
}

</script>
