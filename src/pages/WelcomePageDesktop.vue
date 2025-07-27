<template>
  <q-page class="welcome-bg column">

    <!-- Intro Section -->
    <div class="q-pa-xl bg-white">
      <div class="text-center q-mb-md q-mt-xl">
        <div class="app-desc-welcome">Bookmarks, But <span class="gradient-text">Better</span></div>
        <div class="app-desc-text-welcome q-mt-lg">
          The links you save are more than just URLs - they reflect your curiosity, your taste, and your intent.<br>
          Collected together, they form a curated mosaic of meaning - uniquely yours.<br>
          And when you share them with friends or family, they become a trusted shortcut to what’s worth seeing.
        </div>
        <div class="row justify-center q-gutter-sm q-mt-xl">
          <q-btn color="secondary" unelevated class="text-capitalize q-mr-sm" @click="goToRegister">
            <span style="font-size: 1rem;">
              Start free trial
            </span>
          </q-btn>

          <q-btn style="background: #191919; color: white" class="text-capitalize q-ml-sm">
            <span style="font-size: 1rem;">
              Learn more
            </span>
          </q-btn>
        </div>
      </div>
    </div>

    <!-- Carousel Section -->
    <div class="q-pa-md flex flex-center">
      <div style="max-width: 900px; width: 100%;">

        <!-- Neue Überschrift + Beschreibung -->
        <div class="text-center q-mb-lg">
          <div class="app-ext-welcome">
            Explore Your Collections
          </div>
          <div class="app-ext-text-welcome q-mt-sm">
            Choose from a variety of smart link collections tailored to your interests - and try them instantly.
          </div>
        </div>
        <q-carousel animated v-model="slide" navigation infinite :autoplay="autoplay" arrows
          transition-prev="slide-right" transition-next="slide-left" swipeable control-color="secondary" height="500px"
          class="welcome-carousel">
          <q-carousel-slide v-for="(item, index) in slides" :key="index" :name="item.name" :img-src="item.img"
            class="column no-wrap flex-center">
            <div class="slide-overlay" />
            <div class="carousel-overlay q-pa-md">
              <div class="q-mb-md icon-wrapper">
                <q-icon :name="item.icon" size="50px" color="primary" />
              </div>
              <div class="q-mt-md text-center">
                <div class="q-mt-md app-card-title-welcome">{{ item.title }}</div>
              </div>
              <div class="text-subtitle1 text-grey-7 q-mt-sm text-center">
                {{ item.subtitle }}
              </div>
              <div class="text-body1 q-mt-md text-center">Try it now</div>
              <q-form @submit.prevent="submitUrl" class="q-mt-sm">
                <q-input v-model="demoUrl" :label="item.inputLabel" dense filled bg-color="white" type="url"
                  :rules="[isValidUrl]" class="q-mt-sm">
                  <template #append>
                    <q-btn flat icon="send" color="secondary" @click="submitUrl" />
                  </template>
                </q-input>
              </q-form>
            </div>
          </q-carousel-slide>
        </q-carousel>

      </div>
    </div>


    <!-- Download Extension Section -->
    <div class="q-pa-xl bg-grey-1 text-center">
      <div class="app-ext-welcome q-mb-sm">
        Save Links with the bibbly Extension
      </div>

      <div class="app-ext-text-welcome q-mb-md">
        Install the bibbly browser extension to add links in just one click - from any website, at any time.<br />
        Everything you save is instantly added to your collection - no copy-paste, no hassle.
      </div>

      <q-btn label="Get the Extension" icon="extension" color="secondary" unelevated size="md"
        class="q-mt-sm text-capitalize" @click="goToExtension" />
    </div>
  </q-page>

</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Notify } from 'quasar';
import { useRouter } from 'vue-router';
import Pic30 from 'src/assets/images/pic30.jpg'
import Pic20 from 'src/assets/images/pic20.jpg'
import Pic10 from 'src/assets/images/pic10.jpg'
import Pic7 from 'src/assets/images/pic7.png'

const router = useRouter();
const demoUrl = ref('');



const slide = ref('style')
const autoplay = ref(8000)

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

async function goToRegister() {
  await router.push('/register')
}


function isValidUrl(val: string) {
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' + // optional http(s)
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*).)+[a-z]{2,}|' + // domain
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR IPv4
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port/path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'
  );
  return pattern.test(val) || 'Bitte eine gültige URL eingeben';
}

function submitUrl() {
  if (!isValidUrl(demoUrl.value)) {
    Notify.create({
      type: 'negative',
      message: 'Bitte gib eine gültige URL ein',
    });
    return;
  }
  // Beispiel: leite weiter zur Vorschau mit Query-Param
  void router.push({ name: 'preview', query: { url: demoUrl.value } });
}

function goToExtension() {
  window.open('https://example.com/extension', '_blank') // ← hier den echten Link einfügen
}

</script>

<style scoped lang="scss">
.welcome-carousel {
  background-color: #91B494;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
}

.welcome-bg {
  background-color: white;
}

.welcome-carousel {
  background-color: #91B494;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;


}

.carousel-overlay {
  background-color: rgba(255, 255, 255, 0.9);
  /* halbtransparent weiß */
  border-radius: 5px;
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;

}

.icon-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.slide-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 100, 80, 0.2); // Farbe + Transparenz
  mix-blend-mode: multiply;
  z-index: 1;
  pointer-events: none;
}

.carousel-overlay {
  position: relative; // stellt sicher, dass es über dem Overlay liegt
  z-index: 2;
}
</style>
