<template>
  <q-page class="welcome-bg column">

    <!-- Intro Section -->
    <section id="intro" class="q-pa-xl bg-white">
      <div class="text-center q-mb-md q-mt-xl">
        <div class="app-desc-welcome">
          Bookmarks, But <span class="gradient-text">Better</span>
        </div>
        <div class="app-desc-text-welcome text-grey-8 q-mt-lg">
          The links you save are more than just URLs – they reflect your curiosity, your taste, and your intent.<br><br>
          Collected together, they form a curated mosaic of meaning – uniquely yours.<br><br>
          And when you share them with friends or family, they become a trusted shortcut to what’s worth seeing.
        </div>
        <div class="row justify-center q-gutter-sm q-mt-xl">
          <q-btn color="secondary" unelevated class="text-capitalize q-mr-sm" @click="goToRegister">
            <span style="font-size: 1rem;">Start free trial</span>
          </q-btn>

          <q-btn style="background: #191919; color: white" class="text-capitalize q-ml-sm"
            @click="scrollToSection('product')">
            <span style="font-size: 1rem;">Learn more</span>
          </q-btn>
        </div>
      </div>
    </section>

    <!-- Cards Section (instead Carousel) with Collections -->
    <section id="collections" class="q-pa-sm flex flex-center bg-grey-1">
      <div class="text-center q-ma-lg">
        <div class="app-ext-welcome">
          Explore Your Collections
        </div>
        <div class="app-ext-text-welcome text-grey-8 q-mt-xs">
          Choose from a variety of smart link collections tailored to your interests - and try them instantly.
        </div>
      </div>

      <q-carousel v-model="activeSlide" animated swipeable navigation padding control-color="secondary" height="auto"
        arrows class="bg-grey-1">
        <q-carousel-slide v-for="(item, index) in slides" :key="index" :name="index" class="q-pa-sm">
          <q-card flat bordered class="q-pa-md">
            <q-img :src="item.img" style="height: 200px; object-fit: cover;" spinner-color="secondary"
              class="full-width" />
            <div class="column items-center">
              <div class="app-card-title-welcome q-mt-md text-accent">{{ item.title }}</div>
              <div class="text-body text-grey-7 text-center q-mt-sm">
                {{ item.subtitle }}
              </div>
              <q-form @submit.prevent="submitUrl" class="full-width q-mt-md">
                <q-input v-model="demoUrl" :label="item.inputLabel" dense filled bg-color="grey-2" type="url"
                  :rules="[isValidUrl]">
                  <template #append>
                    <q-btn flat icon="send" color="secondary" @click="submitUrl" />
                  </template>
                </q-input>
              </q-form>
            </div>
          </q-card>
        </q-carousel-slide>
      </q-carousel>
    </section>

    <!-- Product Section -->
    <section id="product" class="q-pa-xl">
      <!-- Zentrierter Bereich -->
      <div class="text-center">
        <div class="app-ext-welcome q-mb-sm">
          Key Features at a Glance
        </div>

        <div class="app-ext-text-welcome q-mb-md text-grey-8">
          Discover how bibbly helps you collect, organize, and preserve online content effortlessly.
        </div>
      </div>

      <!-- Liste -->
      <div class="feature-list-wide">
        <q-list separator inset class="q-px-md feature-item">
          <q-item v-for="(feature, index) in features" :key="index" class="q-py-md feature-item">
            <div class="feature-content">

              <q-icon :name="feature.icon" color="secondary" size="32px" class="feature-icon" />
              <div class="feature-text">
                <div class="text-h6 text-accent">
                  {{ feature.title }}
                </div>
                <div class="text-subtitle1 q-mt-xs text-grey-8">
                  {{ feature.description }}
                </div>
              </div>

            </div>
          </q-item>
        </q-list>
      </div>
    </section>



    <!-- Download Extension Section -->
    <section id="extension" class="q-pa-xl bg-grey-1 text-center">
      <div class="app-ext-welcome q-mb-sm">
        Save Links with the bibbly Extension
      </div>

      <div class="app-ext-text-welcome text-grey-8 q-mb-md">
        <p v-if="!isSupportedBrowser" class="text-warning" style="font-style: italic;">
          Sorry, your browser is currently not supported.<br> You can get the extension for the following browsers:
          {{ supportedBrowsers.join(', ') }}.
        </p>
        <p v-else>
          Install the bibbly browser extension for {{ browserName }} to add links in just one click - from any
          website, at any time.<br />
          Everything you save is instantly added to your collection - no copy-paste, no hassle.
        </p>
      </div>

      <q-btn v-if="isSupportedBrowser" label="Get the Extension" icon="extension" color="secondary" unelevated size="md"
        class="q-mt-sm text-capitalize" @click="goToExtension" />
    </section>

    <!-- About Section -->
    <section id="about" class="q-pa-xl text-center">
      <div class="app-ext-welcome q-mb-sm">
        About
      </div>

      <div class="q-my-md flex flex-center">
        <q-img :src="Pic200" class="about-image-mobile" spinner-color="primary"
          alt="Organizing information illustration" />
      </div>

      <div class="app-ext-text-welcome text-grey-8 q-mb-sm">
        We believe that small, clever tools can simplify your life and give you the time to focus on what truly
        matters.<br><br>
        As IT professionals, we spend a lot of time at our computers, often with
        numerous tabs open,
        gathering all kinds of information. <br><br>
        Our mission is to keep this information organized and easily
        retrievable.<br><br>
        That's where Bibbly comes in –
        designed to help us, and hopefully, to help you too.
      </div>

    </section>
    <section class="text-center"> <q-btn flat dense class="text-capitalize text-caption" @click="scrollToTop"
        label="Back to Top" icon-right="arrow_upward" size="sm" color="grey" /></section>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'
import Pic200 from 'src/assets/images/pic200.jpg'
import Pic30 from 'src/assets/images/pic30.jpg'
import Pic20 from 'src/assets/images/pic20.jpg'
import Pic10 from 'src/assets/images/pic10.jpg'
import Pic7 from 'src/assets/images/pic7.png'

const router = useRouter()
const demoUrl = ref('')
const activeSlide = ref(0) // für v-model im q-carousel

const browserName = ref('Browser');
const supportedBrowsers = ['Chrome', 'Firefox', 'Edge', 'Opera'];

const slides = [
  {
    name: 'style',
    img: Pic30,
    icon: 'restaurant_menu',
    title: 'Welcome to your Dining Guide',
    subtitle: 'Turn links into smart, searchable, and personalized collections – plated to your cravings.',
    inputLabel: 'Enter a restaurant URL'
  },
  {
    name: 'tv',
    img: Pic20,
    icon: 'beach_access',
    title: 'Welcome to your Trip Planner',
    subtitle: 'Turn links into smart, searchable, and personalized collections – mapped to your next adventure.',
    inputLabel: 'Enter a travel destination URL'
  },
  {
    name: 'layers',
    img: Pic10,
    icon: 'radio',
    title: 'Welcome to your News Feed',
    subtitle: 'Turn links into smart, searchable, and personalized collections – filtered to your interests.',
    inputLabel: 'Enter a news site URL'
  },
  {
    name: 'map',
    img: Pic7,
    icon: 'outdoor_grill',
    title: 'Welcome to your Recipe Book',
    subtitle: 'Turn links into smart, searchable, and personalized collections – seasoned to your taste.',
    inputLabel: 'Enter a recipe URL'
  }
]

const features = [
  {
    icon: 'search',
    title: 'Search',
    description: 'Quickly search across your collections and webpages to access what you need in seconds.'
  },
  {
    icon: 'comment',
    title: 'Comments',
    description: 'Leave notes or reminders on links, snapshots, or collections - just for you or your team.'
  },
  {
    icon: 'photo_camera',
    title: 'Snapshots',
    description: 'Save a visual copy of any webpage as it appears today - reliable, even if it changes tomorrow.'
  },
  {
    icon: 'description',
    title: 'Metadata',
    description: 'Automatically store title, author, URL, and access date to ensure trustworthy references.'
  },
  {
    icon: 'share',
    title: 'Share',
    description: 'Share your curated content with family, friends, or collaborators - instantly and easily.'
  },
  {
    icon: 'notifications',
    title: 'Monitoring',
    description: 'Create alerts and get notified when a webpage changes - stay informed without effort.'
  }
]

function isValidUrl(val: string) {
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' + // optional http(s)
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*).)+[a-z]{2,}|' + // domain
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR IPv4
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port/path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'
  )
  return pattern.test(val) || 'Bitte eine gültige URL eingeben'
}

function submitUrl() {
  if (!isValidUrl(demoUrl.value)) {
    Notify.create({
      type: 'negative',
      message: 'Bitte gib eine gültige URL ein',
    })
    return
  }
  void router.push({ name: 'preview', query: { url: demoUrl.value } })
}

async function goToRegister() {
  await router.push('/register')
}

function goToExtension() {
  window.open('https://example.com/extension', '_blank')
}

function scrollToSection(sectionId: string) {
  setTimeout(() => {
    const el = document.getElementById(sectionId)
    if (el) {
      const offset = 80 // Header-Höhe ggf. dynamisch machen
      const top = el.getBoundingClientRect().top + window.pageYOffset - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }, 100)
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(() => {
  browserName.value = detectBrowser();
  console.log('Detected browser:', browserName.value);
})

function detectBrowser(): string {
  const ua = navigator.userAgent;

  if (/OPR\//.test(ua)) return 'Opera';
  if (/Edg\//.test(ua)) return 'Edge';
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua)) return 'Chrome';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari/.test(ua) && !/Chrome\//.test(ua)) return 'Safari';

  return 'Browser';
}

const isSupportedBrowser = computed(() =>
  supportedBrowsers.includes(browserName.value)
);
</script>

<style scoped>
.welcome-bg {
  background-color: white;
}


.about-image-mobile {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  object-fit: cover;
}

.feature-list-wide {
  max-width: 680px;
  margin-left: auto;
  margin-right: auto;
}

.feature-description {

  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 0.9rem;
  color: grey;
}

@media (max-width: 560px) {
  .feature-description {
    font-size: 0.8rem;
  }
}

.feature-content {
  display: flex;
  align-items: center;
  /* <- zentriert Icon vertikal zum Textblock */
  justify-content: space-between;
  gap: 16px;
}

.feature-text {
  flex: 1;
}

.feature-icon {
  flex-shrink: 0;
}

/* Mobile: Icon über dem Text */
@media (max-width: 500px) {
  .feature-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .feature-text {
    text-align: center;
  }
}
</style>
