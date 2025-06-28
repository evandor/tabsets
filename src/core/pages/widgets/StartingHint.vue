<template>
  <transition appear enter-active-class="animated fadeIn slower delay-5s" leave-active-class="animated fadeOut">
    <div class="q-ma-sm q-mt-xl" v-if="!hide">
      <div class="row items-center text-grey-5 q-mb-sm">Welcome to your first Tabset<br />Get started by...</div>
      <div class="box" style="min-width: 300px">
        <q-list class="q-my-md">
          <q-item clickable @click="useUiStore().startButtonAnimation('addtab')">
            <q-item-section avatar>
              <q-btn fab-mini padding="xs" icon="o_add" round size="xs" color="warning" />
            </q-item-section>

            <q-item-section>
              <q-item-label>Adding a new Tab</q-item-label>
              <q-item-label caption
                >Context sensitive menu, e.g. to add the current tab to your tabsets collection.
              </q-item-label>
            </q-item-section>
          </q-item>

          <transition
            v-show="showTabs"
            appear
            enter-active-class="animated fadeIn slower delay-1s"
            leave-active-class="animated fadeOut">
            <q-item clickable @click="useUiStore().startButtonAnimation('tabsList')">
              <q-item-section avatar>
                <!--                <SidePanelToolbarButton icon="playlist_add" class="q-ml-sm" />-->
                <q-img :src="favicon()" width="26px" class="q-ml-xs" />
              </q-item-section>

              <q-item-section>
                <q-item-label><span>Open saved Tabs</span></q-item-label>
                <q-item-label caption><span>Click a tab in the tabset view to open it</span> </q-item-label>
              </q-item-section>
            </q-item>
          </transition>

          <transition
            v-show="showMenu"
            appear
            enter-active-class="animated fadeIn slower delay-1s"
            leave-active-class="animated fadeOut">
            <q-item clickable @click="useUiStore().startButtonAnimation('menu')">
              <q-item-section avatar>
                <SidePanelToolbarButton icon="menu" class="q-ml-sm" />
              </q-item-section>

              <q-item-section>
                <q-item-label><span>Additional Features</span></q-item-label>
                <q-item-label caption
                  ><span>Use this menu to access other featurs like search, open-all in, ...</span>
                </q-item-label>
              </q-item-section>
            </q-item>
          </transition>

          <transition
            v-show="showSettings"
            appear
            enter-active-class="animated fadeIn slower delay-1s"
            leave-active-class="animated fadeOut">
            <q-item clickable @click="useUiStore().startButtonAnimation('settings')">
              <q-item-section avatar>
                <SidePanelToolbarButton icon="o_settings" class="q-ml-sm" />
              </q-item-section>

              <q-item-section>
                <q-item-label>Settings</q-item-label>
                <q-item-label caption>Click here to fine-tune settings and activate more features</q-item-label>
              </q-item-section>
            </q-item>
          </transition>

          <transition
            v-show="showBookmarks"
            appear
            enter-active-class="animated fadeIn slower delay-1s"
            leave-active-class="animated fadeOut">
            <q-item
              clickable
              @click="
                useUiStore().startButtonAnimation(
                  useFeaturesStore().hasFeature(FeatureIdent.BOOKMARKS) ? 'bookmarks' : 'settings',
                )
              ">
              <q-item-section avatar>
                <SidePanelToolbarButton
                  icon="bookmark"
                  class="q-ml-sm"
                  :color="useFeaturesStore().hasFeature(FeatureIdent.BOOKMARKS) ? 'primary' : 'grey-6'" />
              </q-item-section>

              <q-item-section>
                <q-item-label
                  ><span :class="useFeaturesStore().hasFeature(FeatureIdent.BOOKMARKS) ? 'text-primary' : 'text-grey-6'"
                    >Bookmarks Manager</span
                  >
                </q-item-label>
                <q-item-label caption
                  ><span :class="useFeaturesStore().hasFeature(FeatureIdent.BOOKMARKS) ? 'text-primary' : 'text-grey-6'"
                    >Click to open the Bookmarks Manager. Available in the settings.</span
                  >
                </q-item-label>
              </q-item-section>
            </q-item>
          </transition>

          <transition appear enter-active-class="animated fadeIn slower delay-1s" leave-active-class="animated fadeOut">
            <q-item clickable @click="hideStartingHint()">
              <q-item-section>
                <q-item-label class="text-center text-caption cursor-pointer text-blue-8">Hide </q-item-label>
              </q-item-section>
            </q-item>
          </transition>
        </q-list>
      </div>
      <!--      <div class="row q-mt-lg">-->
      <!--        <div-->
      <!--          class="col text-body2 text-blue-8 text-center cursor-pointer q-mb-sm"-->
      <!--          @click="useNavigationService().browserTabFor('https://docs.tabsets.net/glossary')">-->
      <!--          Glossary-->
      <!--        </div>-->
      <!--      </div>-->
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { LocalStorage } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import SidePanelToolbarButton from 'src/core/components/SidePanelToolbarButton.vue'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { ref } from 'vue'

const showSettings = ref(false)
const showTabs = ref(false)
const showMenu = ref(false)
const showBookmarks = ref(false)
const showHideButton = ref(false)

const hide = ref(false)

setTimeout(() => (showTabs.value = true), 4 * 1000)
setTimeout(() => (showMenu.value = true), 7 * 1000)
setTimeout(() => (showSettings.value = true), 10 * 1000)
setTimeout(() => (showBookmarks.value = true), 13 * 1000)
setTimeout(() => (showHideButton.value = true), 15 * 1000)

const favicon = () => chrome.runtime.getURL('icons/favicon-64x64.png')
const hideStartingHint = () => {
  LocalStorage.setItem('ui.hideStartingHint', true)
  hide.value = true
}
</script>
