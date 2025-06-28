<template>
  <div class="q-ma-md" v-if="!hide">
    <div class="row text-primary q-mb-md" style="border: 0 solid grey">
      <div class="col-12 text-center">
        <span>We've created a first tabset for you, called<br />'My first tabset'</span>
      </div>
    </div>

    <div class="q-pa-none q-ma-sm row items-start relative-position overflow-hidden cursor-pointer non-selectable">
      <transition name="q-transition--scale" class="popupbox">
        <!-- documentation -->
        <q-card class="my-card fit popupbox">
          <q-card-section class="q-pb-none">
            <div class="q-row q-my-md">
              <div class="q-col text-body1 text-center">One last step</div>
            </div>
            <div class="q-row q-my-md">
              <div class="q-col text-body1 text-center">
                Once you click the button, you'll be able to see details about the current tab. Click the plus sign to
                add it to your tabset
              </div>
            </div>
            <div class="q-row">
              <div class="q-col text-body1 text-center q-mt-sm">
                <DialogButton
                  label="Show current tab"
                  :color="$q.dark.isActive ? '' : 'primary'"
                  :text-color="$q.dark.isActive ? 'warning' : 'white'"
                  @was-clicked="hideStartingHint()"
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
</template>

<script lang="ts" setup>
import { LocalStorage, openURL } from 'quasar'
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'
import { useNavigationService } from 'src/core/services/NavigationService'
import { ref } from 'vue'

const emits = defineEmits(['hidden'])
const hide = ref(false)

const hideStartingHint = () => {
  LocalStorage.setItem('ui.hideStartingHint', true)
  hide.value = true
  emits('hidden')
}

const clicked = (url: string) => openURL(url)
</script>
