<template>
  <transition
    appear
    enter-active-class="animated fadeIn slower delay-5s"
    leave-active-class="animated fadeOut"
  >
    <div class="q-ma-lg q-mt-xl">
      <div class="row items-center text-grey-5">how to start?</div>
      <div style="min-width: 300px; border: 1px solid #efefef; border-radius: 5px">
        <q-list>
          <!--          <q-item clickable @click="useUiStore().startButtonAnimation('newTabset')">-->
          <!--            <q-item-section avatar>-->
          <!--              <q-btn outline label="+" color="primary" size="sm"/>-->
          <!--            </q-item-section>-->

          <!--            <q-item-section>-->
          <!--              <q-item-label>Add Collection</q-item-label>-->
          <!--              <q-item-label caption>Click to create a new tabset collection</q-item-label>-->
          <!--            </q-item-section>-->
          <!--          </q-item>-->

          <q-item clickable @click="useUiStore().startButtonAnimation('addtab')">
            <q-item-section avatar>
              <!--              <SidePanelToolbarButton-->
              <!--                icon="tab"-->
              <!--                color="warning"/>-->
              <q-btn outline label="..." color="primary" size="sm" />
            </q-item-section>

            <q-item-section>
              <q-item-label>Add Tab</q-item-label>
              <q-item-label caption>Add the current tab to your tabsets collection.</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable @click="useUiStore().startButtonAnimation('settings')">
            <q-item-section avatar>
              <SidePanelToolbarButton icon="o_settings" />
            </q-item-section>

            <q-item-section>
              <q-item-label>Settings</q-item-label>
              <q-item-label caption>Click here to activate more features</q-item-label>
            </q-item-section>
          </q-item>

          <q-item
            clickable
            @click="
              useUiStore().startButtonAnimation(
                useFeaturesStore().hasFeature(FeatureIdent.BOOKMARKS) ? 'bookmarks' : 'settings',
              )
            "
          >
            <q-item-section avatar>
              <SidePanelToolbarButton
                icon="bookmark"
                :color="
                  useFeaturesStore().hasFeature(FeatureIdent.BOOKMARKS) ? 'primary' : 'grey-6'
                "
              />
            </q-item-section>

            <q-item-section>
              <q-item-label
                ><span
                  :class="
                    useFeaturesStore().hasFeature(FeatureIdent.BOOKMARKS)
                      ? 'text-primary'
                      : 'text-grey-6'
                  "
                  >Bookmarks Manager</span
                >
              </q-item-label>
              <q-item-label caption
                ><span
                  :class="
                    useFeaturesStore().hasFeature(FeatureIdent.BOOKMARKS)
                      ? 'text-primary'
                      : 'text-grey-6'
                  "
                  >Click to open the Bookmarks Manager. Available in the settings.</span
                >
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { useUiStore } from 'src/ui/stores/uiStore'
import SidePanelToolbarButton from 'src/core/components/SidePanelToolbarButton.vue'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
</script>
