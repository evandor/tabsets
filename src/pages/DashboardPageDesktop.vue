<template>
  <q-page padding>
    <!-- BANNER -->
    <section id="banner" class="q-mt-xs">
      <q-card flat class="ext-cta-banner q-pa-lg row items-center justify-between">
        <!-- Text -->
        <div>
          <div class="ext-cta-title q-mb-xs">Ready to save the web?</div>
          <div class="ext-cta-subtitle">Install the bibbly extension and start collecting in just one click.</div>
        </div>

        <!-- Button -->
        <q-btn
          color="white"
          text-color="primary"
          no-caps
          unelevated
          class="ext-cta-btn"
          label="Get the bibbly extension"
          href="#" />
      </q-card>
    </section>

    <!-- NEW LINK OR COLLECTION -->
    <section id="create" class="q-pt-xl q-pb-lg">
      <header class="q-mb-md">
        <div class="row justify-between items-center no-wrap bc-header">
          <!-- left: title + info -->
          <div class="row items-center no-wrap bc-title-wrap">
            <h2 class="bc-title q-mb-none q-mt-none">Recent links and collections</h2>
          </div>
        </div>
      </header>

      <q-input v-model="value" outlined rounded class="add-field" :placeholder="placeholder">
        <!-- Dropdown VORN im Feld -->
        <template #prepend>
          <div class="prepend-block">
            <q-btn-dropdown
              flat
              dense
              no-caps
              :label="typeLabel"
              class="q-pa-none prepend-text"
              text-color="grey-9"
              size="14px">
              <q-list dense>
                <q-item clickable v-close-popup @click="setType('link')">
                  <q-item-section>Link</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="setType('collection')">
                  <q-item-section>Collection</q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </div>
        </template>

        <!-- Button RECHTS im Feld -->
        <template #append>
          <q-btn label="Add" color="warning" rounded no-caps unelevated class="q-px-xl" @click="onAdd()" />
        </template>
      </q-input>
    </section>

    <!-- BIBBLY COLLECTIONS -->
    <section id="bibbly_collections" class="q-pt-xl q-pb-lg">
      <header class="q-mb-md">
        <div class="row justify-between items-center no-wrap bc-header">
          <!-- left: title + info -->
          <div class="row items-center no-wrap bc-title-wrap">
            <h2 class="bc-title q-mb-none q-mt-none">bibbly Collections</h2>
            <q-btn
              class="q-ml-xs info-btn"
              round
              dense
              flat
              color="primary"
              icon="info_outline"
              aria-label="About bibbly Collections">
              <q-tooltip class="tooltip-md" anchor="bottom middle" self="top middle">
                Predefined, category-based views of your saved links. <br />
                We automatically add structure, context, and smart sorting to them,<br />
                so you get more from what you’ve saved.
              </q-tooltip>
            </q-btn>
          </div>

          <!-- right: explore -->
          <q-btn
            v-if="collections.length > 4"
            flat
            no-caps
            color="primary"
            class="bc-explore self-end"
            @click="goExplore"
            label="Explore bibbly Collections"
            icon-right="arrow_forward" />
        </div>
      </header>

      <!-- Grid: 1 / 2 / 4 pro Zeile -->
      <div class="row items-stretch q-col-gutter-lg q-row-gutter-lg">
        <div v-for="c in displayedCollections" :key="c.key" class="col-12 col-sm-6 col-md-4 col-lg-3">
          <q-card class="collection-card">
            <q-img :src="c.img" :alt="c.label" fit="cover" :ratio="16 / 10">
              <div class="absolute-bottom text-subtitle2 text-center">
                {{ c.label }}
              </div>
            </q-img>
          </q-card>
        </div>
      </div>
    </section>

    <!-- TUTORIALS -->
    <section id="create" class="q-pt-xl q-pb-lg">
      <header class="q-mb-md">
        <div class="row justify-between items-center no-wrap bc-header">
          <!-- left: title + info -->
          <div class="row items-center no-wrap bc-title-wrap">
            <h2 class="bc-title q-mb-none q-mt-none">Tutorials</h2>
          </div>
        </div>
      </header>
      <!-- Grid: 1 / 2 / 4 pro Zeile -->
      <div class="row items-stretch q-col-gutter-lg q-row-gutter-lg">
        <div v-for="c in displayedCollections" :key="c.key" class="col-12 col-sm-6 col-md-4 col-lg-3">
          <q-card class="collection-card">
            <q-video src="https://www.youtube.com/embed/k3_tw44QsZQ?rel=0" />

            <q-card-section>
              <div class="text-h6">Our Changing Planet</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </section>
  </q-page>
  <q-dialog v-model="showAuthDialog">
    <q-card class="q-pl-sm" style="width: min(90vw, 420px)">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-grey-9">Create an account – It’s free!</div>
        <q-space />

        <q-btn flat round dense icon="close" v-close-popup aria-label="Close" color="grey-6" size="sm" />
      </q-card-section>

      <q-card-section class="q-pt-md text-grey-8"> Enjoy an even better saving experience! </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="column q-gutter-xs">
          <div class="row items-center q-gutter-sm">
            <q-icon name="check" color="secondary" />
            <div class="text-grey-9">Organize your links in multiple collections</div>
          </div>
          <div class="row items-center q-gutter-sm">
            <q-icon name="check" color="secondary" />
            <div class="text-grey-9">Work seamlessly across devices</div>
          </div>
          <div class="row items-center q-gutter-sm">
            <q-icon name="check" color="secondary" />
            <div class="text-grey-9">Save your work securely</div>
          </div>
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none q-px-lg">
        <q-btn class="full-width" color="secondary" unelevated no-caps @click="goToRegister"> Sign Up </q-btn>
      </q-card-section>

      <q-card-section align="center" class="text-grey-8"> It only takes a few seconds </q-card-section>

      <q-card-actions align="center">
        <div class="text-grey-7 text-caption">Already have an account?</div>
        <q-btn flat no-caps label="Login" to="/login" color="secondary" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import Pic7 from 'src/assets/images/pic7.png'
import Pic10 from 'src/assets/images/pic10.jpg'
import Pic20 from 'src/assets/images/pic20.jpg'
import Pic30 from 'src/assets/images/pic30.jpg'
import { useAuthStore } from 'stores/authStore'
import { computed, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import ChromeApi from 'src/app/BrowserApi'
import { Tab } from 'src/tabsets/models/Tab'
import { uid } from 'quasar'
import { useUtils } from 'src/core/services/Utils'

const router = useRouter()
const { normalize } = useUtils()

type Coll = { key: string; label: string; icon: string; img: string }
const authenticated = ref(false)
const showAuthDialog = ref(false)
const maxDesktopItems = 4
const displayedCollections = computed(() => collections.slice(0, maxDesktopItems))

watchEffect(() => {
  authenticated.value = useAuthStore().isAuthenticated()
})

const collections: Coll[] = [
  { key: 'recipes', label: 'Recipies', icon: 'outdoor_grill', img: Pic7 },
  { key: 'restaurants', label: 'Restaurants', icon: 'restaurant_menu', img: Pic30 },
  { key: 'news', label: 'News', icon: 'radio', img: Pic10 },
  { key: 'travel', label: 'Travel', icon: 'beach_access', img: Pic20 },
  { key: 'news', label: 'Shopping', icon: 'radio', img: Pic10 },
  { key: 'travel', label: 'Bibliography', icon: 'beach_access', img: Pic20 },
]

const value = ref('')
type AddType = 'link' | 'collection'
const addType = ref<AddType>('link')

const typeLabel = computed(() => (addType.value === 'link' ? 'Link' : 'Collection'))
const placeholder = computed(() =>
  addType.value === 'link' ? 'Paste a link to save' : 'Enter a name to create a new collection',
)

function goExplore() {
  // Zielroute anpassen:
  // router.push('/collections')
  console.log('explore collections')
}

function setType(t: AddType) {
  addType.value = t
  value.value = '' // optional: Eingabe leeren beim Wechsel
}

function onAdd(t: AddType = addType.value) {
  if (t === 'link') {
    addLink(value.value)
  } else {
    addCollection(value.value)
  }
}

async function addLink(url: string) {
  console.log("url", url)
  let useUrl = normalize(url)
  console.log('normalizing url', url, useUrl)
  const chromeTab = ChromeApi.createChromeTabObject(useUrl, useUrl, null as unknown as string)
  const tab = new Tab(uid(), chromeTab)
  // tab.created = new Date().getTime()
  // tab.createdBy = useAuthStore().user.email || undefined
  // tab.extension = tab.determineUrlExtension(chromeTab)
  await useCommandExecutor().executeFromUi(new AddTabToTabsetCommand(tab))
}

async function addCollection(name: string) {
  if (!authenticated.value) {
    showAuthDialog.value = true
  } else {
    // TODO: call your API to create the collection
  }
}

async function goToRegister() {
  await router.push('/register')
}
</script>

<style lang="sass" scoped>
/* --- banner --- */
.ext-cta-banner
  background: linear-gradient(90deg, $primary, $secondary)
  color: white
  border-radius: 12px
  box-shadow: 0 8px 24px rgba(0,0,0,0.08)

.ext-cta-title
  font-size: 1.6rem
  font-weight: 700
  line-height: 1.3

.ext-cta-subtitle
  font-size: 1rem
  font-weight: 400
  opacity: 0.9

.ext-cta-btn
  font-weight: 600
  padding: 10px 20px
  border-radius: 8px

/* --- collections section --- */
.bc-title
  font-size: 1.5rem;
  font-weight: 800
  letter-spacing: .2px
  color: #191919
  margin: 0          // remove default h2 margins
  line-height: 1.15  // tightens the vertical rhythm

.bc-explore
  font-weight: 600

.bc-header
  min-height: 44px   // gives a consistent row height


.bc-title-wrap
  align-items: center

.info-btn
  display: inline-flex
  align-items: center


.tooltip-md
  max-width: 360px
  white-space: normal
  line-height: 1.45

.collection-card
  border-radius: 10px
  overflow: hidden

  // combined add button

.add-field
  :deep(.q-field__control)
    border-radius: 9999px
  :deep(.q-field__inner)
    min-height: 64px

  :deep(.q-field__prepend)
    padding-left: 12px
  :deep(.q-field__append)
    padding-right: 8px

  .prepend-block
    display: flex
    align-items: center
    gap: 10px
    padding-right: 12px
    margin-right: 8px
    border-right: 1px solid rgba(0,0,0,.12)
</style>
