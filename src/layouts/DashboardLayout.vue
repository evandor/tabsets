<template>
  <q-layout view="hHh lpR fFf">
    <q-header ref="headerRef" elevated class="bg-transparent-header">
      <q-toolbar class="q-py-md q-px-lg items-center justify-between">
        <!-- Logo links -->
        <div class="row items-center cursor-pointer q-gutter-sm" @click="goToDashboard">
          <img src="../assets/images/logo.png" alt="Bibbly Logo" class="logo-image" />
          <q-toolbar-title class="app-logo-text q-ml-sm"> bibbly. </q-toolbar-title>
        </div>

        <!-- Buttons right side for logged in user -->

        <div v-if="authenticated" class="row items-center q-gutter-sm">
          <!-- Desktop -->
          <div class="row q-gutter-sm items-center" v-if="$q.screen.gt.sm">
            <q-btn-dropdown color="secondary" no-caps label="My Account" style="font-size: 1rem">
              <q-list style="min-width: 260px">
                <!-- Header: Avatar + Name + Email -->
                <div class="row items-center q-pa-md q-gutter-md">
                  <q-avatar>
                    <q-icon size="lg" color="secondary" name="account_circle" />
                  </q-avatar>
                  <div class="col">
                    <div class="text-subtitle1">{{ userName }}</div>
                    <div class="text-caption text-grey-7">{{ userEmail }}</div>
                  </div>
                </div>

                <!-- Get a plan -->
                <div class="q-px-md q-pb-sm">
                  <q-btn
                    label="Get a plan"
                    color="primary"
                    unelevated
                    class="full-width"
                    @click="getPlan"
                    v-close-popup />
                </div>

                <q-separator spaced />

                <!-- Account -->
                <q-item clickable v-ripple @click="showAccount" v-close-popup>
                  <q-item-section avatar>
                    <q-icon name="manage_accounts" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Account</q-item-label>
                  </q-item-section>
                </q-item>

                <!-- Subscription -->
                <q-item clickable v-ripple @click="openSubscription" v-close-popup>
                  <q-item-section avatar>
                    <q-icon name="credit_card" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Subscription</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge color="secondary" rounded class="q-ml-sm">free</q-badge>
                  </q-item-section>
                </q-item>

                <q-separator spaced />

                <!-- Logout -->
                <q-item clickable v-ripple @click="logoutUser" v-close-popup>
                  <q-item-section avatar>
                    <q-icon name="logout" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Log out</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </div>
          <!-- Mobile -->
          <q-btn dense round flat icon="menu" color="secondary" v-else>
            <q-menu>
              <q-list style="min-width: 120px">
                <q-item clickable v-close-popup>
                  <q-item-section>Dashboard</q-item-section>
                </q-item>
                <q-item clickable v-close-popup>
                  <q-item-section>bibbly Collections</q-item-section>
                </q-item>
                <q-item clickable v-close-popup>
                  <q-item-section>My Collections</q-item-section>
                </q-item>
                <q-separator spaced />
                <q-item clickable v-close-popup @click="goToRegister">
                  <q-item-section>Account</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="goToRegister">
                  <q-item-section>Subscription</q-item-section>
                </q-item>
                <q-separator spaced />
                <q-item clickable v-close-popup @click="onLogout">
                  <q-item-section>Logout</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>

        <!-- Buttons right side for anonymous user -->

        <div v-else class="row items-center q-gutter-sm">
          <!-- Desktop -->
          <div class="row q-gutter-sm items-center" v-if="$q.screen.gt.sm">
            <q-btn flat no-caps style="color: #191919" @click="goToLogin">
              <span style="font-size: 1rem">Login</span>
            </q-btn>
            <q-btn color="secondary" no-caps @click="goToRegister">
              <span style="font-size: 1rem">Sign Up</span>
              <q-icon name="arrow_forward" size="16px" class="q-ml-sm" />
            </q-btn>
          </div>

          <!-- Mobile -->
          <q-btn dense round flat icon="menu" color="secondary" v-else>
            <q-menu>
              <q-list style="min-width: 120px">
                <q-item clickable v-close-popup>
                  <q-item-section>Dashboard</q-item-section>
                </q-item>
                <q-separator spaced />
                <q-item clickable v-close-popup>
                  <q-item-section>Pricing</q-item-section>
                </q-item>
                <q-item clickable v-close-popup>
                  <q-item-section>About</q-item-section>
                </q-item>
                <q-separator spaced />
                <q-item clickable v-close-popup @click="goToLogin">
                  <q-item-section>Login</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="goToRegister">
                  <q-item-section>Sign Up</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-white" :width="280">
      <q-scroll-area class="fit">
        <q-list padding class="text-grey-8">
          <!-- DEFAULT COLLECTIONS -->

          <q-item v-ripple v-for="link in drawerDefaultCollections" :key="link.text" clickable>
            <q-item-section avatar>
              <q-icon :name="link.icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ link.text }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator inset class="q-my-sm" />

          <!-- CUSTOM COLLECTIONS -->

          <q-expansion-item
            icon="bookmark"
            label="My Collections"
            dense
            group="collectionsgroup"
            header-class="text-primary">
            <q-list padding>
              <q-item class="q-pl-lg bg-primary-soft" clickable v-ripple @click="onNewCollectionClick">
                <q-item-section avatar class="icon-tight">
                  <q-icon name="add" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>New Collection</q-item-label>
                </q-item-section>
              </q-item>

              <q-item
                class="q-pl-lg hover-actions"
                v-ripple
                v-for="link in drawerCustomCollections"
                :key="link.id"
                @click.stop="openCollection(link.id)"
                clickable>
                <q-item-section avatar>
                  <q-icon :name="link.icon" />
                </q-item-section>

                <q-item-section>
                  <q-item-label>
                    {{ link.name }}
                  </q-item-label>
                </q-item-section>

                <!-- rechtsbündiger More-Button -->
                <q-item-section side class="actions">
                  <q-btn
                    class="more-btn"
                    flat
                    dense
                    round
                    size="sm"
                    icon="more_vert"
                    aria-label="More actions"
                    @click.stop
                    @mousedown.stop>
                    <q-menu anchor="top right" self="top left" :offset="[0, 0]">
                      <q-list dense style="min-width: 100px">
                        <q-item clickable v-close-popup>
                          <q-item-section side class="icon-tight">
                            <q-icon size="xs" name="push_pin" color="grey-8" />
                          </q-item-section>
                          <q-item-section
                            ><q-item-label class="text-grey-8 text-caption">Pin</q-item-label></q-item-section
                          >
                        </q-item>
                        <q-item clickable v-close-popup>
                          <q-item-section side class="icon-tight">
                            <q-icon size="xs" name="edit" color="grey-8" />
                          </q-item-section>
                          <q-item-section
                            ><q-item-label class="text-grey-8 text-caption">Edit</q-item-label></q-item-section
                          >
                        </q-item>

                        <q-item clickable v-close-popup>
                          <q-item-section side class="icon-tight">
                            <q-icon size="xs" name="delete" color="grey-8" />
                          </q-item-section>
                          <q-item-section
                            ><q-item-label class="text-grey-8 text-caption">Delete</q-item-label></q-item-section
                          >
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>

          <q-separator inset class="q-my-sm" />

          <!-- BIBBLY COLLECTIONS -->

          <q-expansion-item
            icon="bookmark"
            label="bibbly Collections"
            dense
            group="collectionsgroup"
            default-opened
            header-class="text-secondary">
            <q-list>
              <q-item
                class="q-pl-lg hover-actions"
                v-ripple
                v-for="link in drawerBibblyCollections"
                :key="link.label"
                clickable>
                <q-item-section avatar>
                  <q-icon :name="link.icon" />
                </q-item-section>

                <q-item-section>
                  <q-item-label>
                    {{ link.label }}
                  </q-item-label>
                </q-item-section>

                <!-- rechtsbündiger More-Button -->
                <q-item-section side class="actions">
                  <q-btn
                    class="more-btn"
                    flat
                    dense
                    round
                    size="sm"
                    icon="more_vert"
                    aria-label="More actions"
                    @click.stop
                    @mousedown.stop>
                    <q-menu anchor="top right" self="top left" :offset="[0, 0]">
                      <q-list dense style="min-width: 100px">
                        <q-item clickable v-close-popup @click="pinCollection(link)">
                          <q-item-section side class="icon-tight">
                            <q-icon size="xs" name="push_pin" color="grey-8" />
                          </q-item-section>
                          <q-item-section
                            ><q-item-label class="text-grey-8 text-caption">Pin</q-item-label></q-item-section
                          >
                        </q-item>
                        <q-item clickable v-close-popup @click="hideCollection(link)">
                          <q-item-section side class="icon-tight">
                            <q-icon size="xs" name="visibility_off" color="grey-8" />
                          </q-item-section>
                          <q-item-section
                            ><q-item-label class="text-grey-8 text-caption">Hide</q-item-label></q-item-section
                          >
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>

          <q-separator inset class="q-my-sm" />

          <!-- SETTINGS -->

          <q-item v-ripple v-for="link in drawerSettings" :key="link.text" clickable>
            <q-item-section>
              <q-item-label>{{ link.text }} <q-icon v-if="link.icon" :name="link.icon" /></q-item-label>
            </q-item-section>
          </q-item>

          <div class="q-mt-md">
            <div class="flex flex-center q-gutter-xs">
              <a class="drawer-footer-link text-grey-6" href="javascript:void(0)" aria-label="About"
                >bibbly · created by Skysail · © {{ new Date().getFullYear() }}</a
              >
            </div>
          </div>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <!-- Dialog for create new collection -->
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

    <!-- Seiteninhalt -->
    <q-page-container>
      <div class="content-with-ads row no-wrap q-pa-lg">
        <!-- Hauptinhalt -->
        <div class="col">
          <router-view />
        </div>

        <!-- Rechte Werbe-Spalte (nur ≥ md) -->
        <aside v-if="$q.screen.gt.sm" class="ads-column q-ml-lg">
          <q-scroll-area class="fit">
            <div class="q-gutter-md">
              <!-- Beispiel-Banner 300x250 -->
              <q-card flat bordered>
                <q-img src="https://via.placeholder.com/300x250?text=Ad+300x250" ratio="4/3" />
                <q-card-section class="text-caption">Sponsored</q-card-section>
              </q-card>

              <!-- Beispiel-Banner 300x600 -->
              <q-card flat bordered>
                <q-img src="https://via.placeholder.com/300x600?text=Ad+300x600" ratio="1/2" />
                <q-card-section class="text-caption">Anzeige</q-card-section>
              </q-card>

              <!-- Beispiel-Banner 300x100 -->
              <q-card flat bordered>
                <q-img src="https://via.placeholder.com/300x100?text=Ad+300x100" ratio="3/1" />
                <q-card-section class="text-caption">Affiliate</q-card-section>
              </q-card>
            </div>
          </q-scroll-area>
        </aside>
      </div>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useAuthStore } from 'stores/authStore'
import { onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const headerRef = ref(null)
const router = useRouter()
const authenticated = ref(false)
const showAuthDialog = ref(false)
const leftDrawerOpen = ref(false)

const userName = ref('John Doe')
const userEmail = ref('john.doe@email.com')
const browserName = ref('Browser')
const drawerBibblyCollections = ref<Tabset[]>([])
const drawerCustomCollections = ref<Tabset[]>([])

watchEffect(() => {
  authenticated.value = useAuthStore().isAuthenticated()
  console.log('user', useAuthStore().user)
})

const drawerDefaultCollections = [
  { icon: 'web', text: 'Top links' },
  { icon: 'person', text: 'For you' },
  { icon: 'star_border', text: 'Favourites' },
  { icon: 'search', text: 'Saved searches' },
]

watchEffect(() => {
  drawerBibblyCollections.value = useTabsetsStore().getBibblyCollections
})

watchEffect(() => {
  drawerCustomCollections.value = [...useTabsetsStore().tabsets.values()].filter(
    (ts: Tabset) => ts.type !== TabsetType.BIBBLY,
  )
})

//   [
//   { icon: 'outdoor_grill', text: 'Recipies' },
//   { icon: 'radio', text: 'News' },
//   { icon: 'beach_access', text: 'Travel' },
//   { icon: 'restaurant_menu', text: 'Restaurants' },
//   { icon: 'menu_book', text: 'Bibliography' },
//   { icon: 'shopping_cart', text: 'Shopping' },
// ]

// const drawerCustomCollections = [
//   { icon: '', text: 'Work', isbibblytemplate: false },
//   { icon: '', text: 'My Italy trip 2025', isbibblytemplate: false },
//   { icon: '', text: 'Templates', isbibblytemplate: false },
//   { icon: '', text: 'Gym', isbibblytemplate: false },
// ]

const drawerSettings = [
  { icon: '', text: 'Settings' },
  { icon: '', text: 'About' },
  //{ icon: 'open_in_new', text: 'Get the Android app' },
  //{ icon: 'open_in_new', text: 'Get the iOS app' },
  //{ icon: '', text: 'Send feedback' },
  { icon: 'open_in_new', text: 'Help' },
]

/* function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
} */

async function goToDashboard() {
  await router.push('/dashboard')
}

async function goToLogin() {
  await router.push('/p/login')
}

function onLogout() {
  console.log('Logout geklickt')
}

async function goToRegister() {
  await router.push('/p/register')
}

function getPlan() {}

function showAccount() {}

function logoutUser() {
  useAuthStore()
    .logout()
    .then(() => {
      //router.push
    })
}

function setHeaderOffsetVar() {
  const el = headerRef.value?.$el as HTMLElement | undefined
  const h = el?.offsetHeight ?? 72 // Fallback
  document.documentElement.style.setProperty('--header-offset', `${h}px`)
}

onMounted(() => {
  browserName.value = detectBrowser()
  setHeaderOffsetVar()
  window.addEventListener('resize', setHeaderOffsetVar, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', setHeaderOffsetVar)
})

function detectBrowser(): string {
  const ua = navigator.userAgent

  if (/OPR\//.test(ua)) return 'Opera'
  if (/Edg\//.test(ua)) return 'Edge'
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua)) return 'Chrome'
  if (/Firefox\//.test(ua)) return 'Firefox'
  if (/Safari/.test(ua) && !/Chrome\//.test(ua)) return 'Safari'
  return 'Browser'
}

async function onNewCollectionClick() {
  if (!authenticated.value) {
    showAuthDialog.value = true
  } else {
    await router.push('/newcollection')
  }
}
</script>

<style scoped>
.bg-transparent-header {
  background-color: rgba(255, 255, 255, 0.8);
  /* Weiß mit 80% Deckkraft */
  backdrop-filter: blur(10px);
  /* optional für Glassmokeffekt */
}

.logo-image {
  height: 30px;
  object-fit: contain;
}

.q-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.q-page-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.q-page {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.q-item__label {
  color: #3c4043;
  letter-spacing: 0.01785714em;
  font-size: 0.86rem;
  font-weight: 500;
  line-height: 1.25rem;
}

.drawer-footer-link {
  text-decoration: none;
  font-weight: 500;
  font-size: 0.75rem;
}

/* für more actions button im Drawer
/* Platz rechts reservieren, damit nichts springt */
:deep(.hover-actions .actions) {
  width: 40px;
  /* konstante Breite für den Action-Bereich */
  display: flex;
  justify-content: flex-end;
}

/* Standard: Button verstecken */
:deep(.hover-actions .more-btn) {
  opacity: 0;
  pointer-events: none;
  /* nicht anklickbar, solange unsichtbar */
  transition: opacity 0.15s ease;
}

/* Auf Hover ODER Tastaturfokus einblenden */
:deep(.hover-actions:hover .more-btn),
:deep(.hover-actions:focus-within .more-btn) {
  opacity: 1;
  pointer-events: auto;
}

/* Blasse Primary als Hintergrund von new collection*/
.bg-primary-soft {
  background: color-mix(in srgb, var(--q-primary) 8%, white);
  /* 8–16% wirkt oft gut */
  border-radius: 0px;
  /* optional, hübscher */
  transition: background 0.15s ease;
  /* optional */
}

.bg-primary-soft:hover {
  background: color-mix(in srgb, var(--q-primary) 12%, white);
  /* etwas mehr bei Hover */
}

/* css für ad spalte */

.content-with-ads {
  align-items: flex-start;
  /* wichtig, damit sticky korrekt greift */
}

/* Rechte Werbespalte */
.ads-column {
  width: 320px;
  /* gängige Ad-Breite */
  max-width: 320px;
  position: sticky;
  top: var(--header-offset, 72px);
  /* „unter den Header schieben“ */
  align-self: flex-start;
  /* damit sich die Spalte nicht ausdehnt */
  height: calc(100vh - var(--header-offset, 72px));
  /* q-scroll-area braucht eine feste Höhe */
}

@media print {
  .ads-column {
    display: none !important;
    /* Ads im Druck ausblenden */
  }
}

.new-collection-card {
  width: 100%;
  max-width: 300px;
}
</style>
