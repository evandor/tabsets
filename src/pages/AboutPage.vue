<template>

  <q-page class="constrained-width">

    <q-toolbar class="text-primary ">
      <div class="row fit">
        <q-toolbar-title>
          <div class="row justify-start items-baseline">

          </div>
        </q-toolbar-title>
      </div>
    </q-toolbar>

    <div class="q-pa-md q-ml-xl">
      <div class="text-h4 q-ml-md">
        Tabsets Browser Extension
      </div>
      <div class="text-subtitle1 q-ml-lg q-mb-xs">Handle more links, with less tabs open</div>
      <div class="text-caption q-ml-lg q-mb-md">Version {{ appVersion }}</div>

      <div class="text-body1 q-ma-md" v-if="tabsStore.tabsets.size === 0">
        <q-chip label="Tabsets" square color="warning"/>
        is a browser extension which helps you organize your links. As simple as that.<br><br>
        A tabset is just a collection of tabs you can give a name to. You can use them instead of (or together with)
        bookmarks - and you can even search within pages you already visited. Check it out and:
      </div>
      <div class="text-body1 q-ma-md" v-else>
        is a browser extension which helps you organize your links. As simple as that.<br><br>
        You are managing <b>{{ tabsStore.allTabsCount }} tabs</b> in <b>{{ tabsStore.tabsets.size }} Tabset(s)</b>
        already - and can access <b>{{ bookmarksStore.bookmarksLeaves.length }} bookmarks</b> of yours.
      </div>


      <template v-if="tabsStore.tabsets.size === 0">

        <div class="row">
          <div class="col-3"></div>
          <div class="col-6 q-pa-md">
            <Transition name="delayed-appear" appear>
              <q-btn class="fit bg-white" outline color="primary"
                     data-testid="createFirstTabsetBtn"
                     @click="addTabset"
                     label="create your first tabset"></q-btn>
            </Transition>
          </div>
          <div class="col-3"></div>
        </div>

      </template>
      <template v-else>

        <div class="row">
          <div class="col-3"></div>
          <div class="col-6 q-pa-md">
              <q-btn class="fit bg-white" outline color="primary"
                     @click="router.push('/tabset')"
                     label="goto your tabsets"></q-btn>
          </div>
          <div class="col-3"></div>
        </div>

      </template>

      <template v-if="tabsStore.mostAccessedTabs.length >= 3">
        <div class="text-h5 q-ma-md">
          Most accessed sites
        </div>

        <div class="q-pa-md">
          <TabcardsMostAccessed :tabs="tabsStore.mostAccessedTabs" group="mostAccessed"/>
        </div>
      </template>


      <div class="text-h6 q-ma-md q-mt-xl text-grey-7">
        Good to know
      </div>

      <div class="text-body1 q-ma-md">
        <ul>
          <li>All data remains on your computer - no backend communication whatsoever</li>
          <li>Open source: see <a href="https://www.github.com/evandor/tabsets" target="_blank">github project</a></li>
          <li><a href="https://opensource.org/licenses/MIT" target="_blank">MIT</a> license</li>
        </ul>
      </div>

      <div class="text-h6 q-ma-md text-grey-7">
        Supported Browsers
      </div>

      <div class="text-body1 q-ma-md">
        <ul>
          <li>Chrome (<a
            href="https://chrome.google.com/webstore/detail/tabsets-extension/afkknkdbgondbbfjehipnjmojndnjhjg?hl=en&authuser=0'"
            target="_blank">webstore</a>)
          </li>
          <li>Brave (<a
            href="https://chrome.google.com/webstore/detail/tabsets-extension/afkknkdbgondbbfjehipnjmojndnjhjg?hl=en&authuser=0'"
            target="_blank">webstore</a>)
          </li>
          <li class="text-grey-7">Firefox (once manifest v3 is supported)</li>
        </ul>
      </div>

      <div class="text-h6 q-ma-md text-grey-7">
        Official Extension Website
      </div>

      <div class="text-body1 q-ma-md">
        <a href="https://tabsets.web.app" target="_blank">https://tabsets.web.app</a>
      </div>
    </div>

  </q-page>

</template>

<script setup lang="ts">

import TabcardsMostAccessed from "components/layouts/TabcardsMostAccessed.vue"
import {useQuasar} from "quasar"
import {useUiStore} from "stores/uiStore"
import NewTabsetDialog from "src/components/dialogues/NewTabsetDialog.vue"
import {useTabsStore} from "stores/tabsStore";
import {useBookmarksStore} from "stores/bookmarksStore";
import {useRouter} from "vue-router";

//@ts-ignore
const appVersion = import.meta.env.PACKAGE_VERSION

const tabsStore = useTabsStore()
const bookmarksStore = useBookmarksStore()
const router = useRouter()
const $q = useQuasar()

const addTabset = () => $q.dialog({
  component: NewTabsetDialog, componentProps: {
    setEmptyByDefault: useUiStore().newTabsetEmptyByDefault
  }
})

</script>

<style lang="sass" scoped>

.delayed-appear-enter-active
  transition: all 2s ease-in
  transition-delay: 1s

.delayed-appear-enter-from,
.delayed-appear-leave-to
  opacity: 0

</style>
