<template>

  <div class="q-ma-md">
    <b>Default Features</b>
  </div>

  <q-list>
    <q-item
      v-for="f in featuresByType(FeatureType.DEFAULT)"
      clickable v-ripple
      :active="f === selected2"
      :disable="wrongMode(f)"
      @click="showFeature2(f)">

      <q-item-section avatar>
        <q-icon :name="f.icon" size="1.3em" :color="iconColor2(f)"/>
      </q-item-section>
      <q-item-section>{{ f.name }}</q-item-section>
      <q-tooltip class="tooltip" v-if="wrongMode(f)">
        This feature is not available in this mode of tabsets
      </q-tooltip>
    </q-item>

  </q-list>

  <div class="q-ma-md">
    <b>Recommended Features</b>
  </div>

  <q-list>
    <q-item
      v-for="f in featuresByType(FeatureType.RECOMMENDED)"
      clickable v-ripple
      :active="f === selected2"
      :disable="wrongMode(f)"
      @click="showFeature2(f)">

      <q-item-section avatar>
        <q-icon :name="f.icon" size="1.3em" :color="iconColor2(f)"/>
      </q-item-section>
      <q-item-section>{{ f.name }}</q-item-section>
      <q-tooltip class="tooltip" v-if="wrongMode(f)">
        This feature is not available in this mode of tabsets
      </q-tooltip>
    </q-item>

  </q-list>

  <div class="q-ma-md">
    <b>Optional Features</b>
  </div>

  <q-list>
    <q-item
      v-for="f in featuresByType(FeatureType.OPTIONAL)"
      clickable v-ripple
      :active="f === selected2"
      @click="showFeature2(f)">

      <q-item-section avatar>
        <q-icon :name="f.icon" size="1.3em" :color="iconColor2(f)"/>
      </q-item-section>
      <q-item-section>{{ f.name }}</q-item-section>
    </q-item>
  </q-list>

  <div class="q-ma-md" v-if="useSettingsStore().isEnabled('dev')">
    <b>Experimental Features</b>
  </div>

  <q-list v-if="useSettingsStore().isEnabled('dev')">
    <q-item
      v-for="f in featuresByType(FeatureType.EXPERIMENTAL)"
      clickable v-ripple
      :active="f === selected2"
      :disable="wrongMode(f)"
      @click="showFeature2(f)">

      <q-item-section avatar>
        <q-icon :name="f.icon" size="1.3em" :color="iconColor2(f)"/>
      </q-item-section>
      <q-item-section>{{ f.name }}</q-item-section>
      <q-tooltip class="tooltip" v-if="wrongMode(f)">
        This feature is not available in this mode of tabsets
      </q-tooltip>
    </q-item>
  </q-list>


</template>

<script setup lang="ts">

import {useTabsStore} from "src/stores/tabsStore"
import {ref} from "vue";
import {useRouter} from "vue-router";
import {usePermissionsStore} from "src/stores/permissionsStore";
import _ from "lodash"
import {AppFeatures} from "src/models/AppFeatures";
import {AppFeature, FeatureIdent, FeatureType} from "src/models/AppFeature";
import {useSettingsStore} from "stores/settingsStore";

const tabsStore = useTabsStore()
const router = useRouter()
const selected = ref('')
const selected2 = ref<AppFeature | undefined>(undefined)

const features = ref(new AppFeatures().features)

const featuresByType = (type: FeatureType) =>
  _.filter(features.value, (f: AppFeature) => {
    const typeAndModeMatch = f.type === type && !wrongMode(f)
    if (f.requires.length > 0) {
      let missingRequirement = false
      f.requires.forEach((requirement: FeatureIdent) => {
        if (!usePermissionsStore().hasFeature(requirement)) {
          missingRequirement = true
        }
      })
      if (missingRequirement) {
        return false
      }
    }
    return typeAndModeMatch
  })

const recommendedFeatures = [
  {ident: 'bookmarks', name: 'Bookmarks', icon: 'o_bookmarks', useIn: ['bex'], target: '/features/bookmarks'}
]

const optionalFeatures = [
  {ident: 'sidebar', name: 'Sidebar View', icon: 'o_input', useIn: ['electron'], target: '/features/sidebar'},
]


const open = (ident: string) => {
  router.push("/help/" + ident)
}

//@ts-ignore
const appVersion = import.meta.env.PACKAGE_VERSION


const iconColor2 = (f: AppFeature) => {
  switch (f) {
    // case "Bookmarks":
    //   return usePermissionsStore().hasFeature('bookmarks') ? 'green' : 'primary'
    // case "Bookmarks":
    //   return usePermissionsStore().hasFeature('bookmarks') ? 'green' : 'primary'
    default:
      return usePermissionsStore().hasFeature(f.ident) ? 'green' : 'primary'
  }
}

const showFeature = (f: any) => {
  selected.value = f.ident
  router.push(f.target)
}
const showFeature2 = (f: AppFeature) => {
  selected2.value = f
  const path = "/features/" + f.ident.toLowerCase()
  router.push(path)
}

const checkBexMode = (f: any) => process.env.MODE === "bex" ? true : !f.bexOnly

const filterMode = (fs: any[]) => _.filter(fs, (f: any) =>
  f.useIn?.indexOf('all') >= 0 || f.useIn?.indexOf(process.env.MODE) >= 0)

const wrongMode = (f: any) => {
  return f.useIn?.indexOf('all') < 0 && f.useIn?.indexOf(process.env.MODE) < 0
}
</script>
