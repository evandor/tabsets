<template>
  <div class="q-ma-md">
    <b>Recommended Features</b>
    <ToggleAllFeaturesInCategory v-if="useSettingsStore().has('DEV_MODE')" :category="'RECOMMENDED'" />
  </div>

  <q-list>
    <q-item
      v-for="f in featuresByType(['RECOMMENDED'])"
      clickable
      v-ripple
      :dense="useSettingsStore().has('DEV_MODE')"
      :active="f === selected2"
      :disable="wrongMode(f)"
      @click="showFeature2(f)">
      <q-item-section avatar>
        <q-icon :name="f.icon" size="1.3em" :color="iconColor2(f)" />
      </q-item-section>
      <q-item-section>{{ f.name }}</q-item-section>
      <q-tooltip class="tooltip" v-if="wrongMode(f)"> This feature is not available in this mode of tabsets</q-tooltip>
    </q-item>
  </q-list>

  <div class="q-ma-md">
    <b>Optional Features</b>
    <ToggleAllFeaturesInCategory v-if="useSettingsStore().has('DEV_MODE')" :category="'OPTIONAL'" />
  </div>

  <q-list>
    <q-item
      v-for="f in featuresByType(['OPTIONAL'])"
      clickable
      v-ripple
      :dense="useSettingsStore().has('DEV_MODE')"
      :active="f === selected2"
      :disable="wrongMode(f)"
      @click="showFeature2(f)">
      <q-item-section avatar>
        <q-icon :name="f.icon" size="1.3em" :color="iconColor2(f)" />
      </q-item-section>
      <q-item-section>{{ f.name }}</q-item-section>
      <q-tooltip class="tooltip" v-if="wrongMode(f)"> This feature is not available in this mode of tabsets</q-tooltip>
    </q-item>
  </q-list>

  <div class="q-ma-md" v-if="useSettingsStore().has('DEV_MODE')">
    <b>Experimental Features</b>
    <ToggleAllFeaturesInCategory v-if="useSettingsStore().has('DEV_MODE')" :category="'EXPERIMENTAL'" />
  </div>

  <q-list v-if="useSettingsStore().has('DEV_MODE')">
    <q-item
      v-for="f in featuresByType(['EXPERIMENTAL'])"
      clickable
      v-ripple
      :dense="useSettingsStore().has('DEV_MODE')"
      :active="f === selected2"
      :disable="wrongMode(f)"
      @click="showFeature2(f)">
      <q-item-section avatar>
        <q-icon :name="f.icon" size="1.3em" :color="iconColor2(f)" />
      </q-item-section>
      <q-item-section>{{ f.name }}</q-item-section>
      <q-tooltip class="tooltip" v-if="wrongMode(f)"> This feature is not available in this mode of tabsets</q-tooltip>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { useQuasar } from 'quasar'
import { AppFeatures } from 'src/app/models/AppFeatures'
import { FeatureType } from 'src/app/models/FeatureIdent'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import { Feature } from 'src/features/models/Feature'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import ToggleAllFeaturesInCategory from 'src/features/widgets/ToggleAllFeaturesInCategory.vue'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const selected2 = ref<Feature | undefined>(undefined)

const features = ref(new AppFeatures().features)

const featuresByType = (types: FeatureType[]) =>
  _.filter(features.value, (f: Feature) => {
    const typeAndModeMatch = types.map((t: FeatureType) => t.toString()).indexOf(f.type) >= 0 && !wrongMode(f)
    if (f.requires.length > 0) {
      let missingRequirement = false
      f.requires.forEach((requirement: string) => {
        if (useFeaturesStore().activeFeatures.indexOf(requirement.toLowerCase()) === -1) {
          missingRequirement = true
        }
      })
      if (missingRequirement) {
        return false
      }
    }
    return typeAndModeMatch
  })

const iconColor2 = (f: Feature) => {
  return useFeaturesStore().activeFeatures.indexOf(f.ident.toLowerCase()) >= 0
    ? f.defaultColor
      ? f.defaultColor
      : 'green'
    : 'grey'
}

const showFeature2 = (f: Feature) => {
  selected2.value = f
  if (route.path.startsWith('/mainpanel/')) {
    router.push('/mainpanel/features/' + f.ident.toLowerCase())
  } else {
    router.push('/features/' + f.ident.toLowerCase())
  }
}

const wrongMode = (f: Feature) => {
  if (f.useIn.indexOf('chrome_bex') >= 0) {
    if (useQuasar().platform.is.chrome) {
      return false
    }
  }
  return f.useIn?.indexOf('all') < 0 && f.useIn?.indexOf(process.env.MODE || '') < 0
}
</script>
