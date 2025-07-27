<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <!-- Linker Leerbereich (nur Desktop sichtbar) -->
      <div class="col-0 col-md-1" />

      <!-- Hauptinhalt -->
      <div class="col-12 col-md-8">
        <q-input filled v-model="search" label="Suche nach Rezept" />

        <q-card flat class="q-pa-sm q-my-md">
          <div class="row q-gutter-sm">
            <q-btn
              v-for="cat in categories"
              :key="cat"
              :label="cat"
              flat
              rounded
              size="md"
              :class="['badge-green', { active: selectedCategory === cat }, 'q-mb-sm', 'q-mr-sm']"
              @click="selectedCategory = cat" />
          </div>
        </q-card>

        <div class="row q-col-gutter-md">
          <div v-for="recipe in filteredRecipes" :key="recipe.id" class="col-12 col-sm-6 col-md-4 col-lg-3">
            <RecipeCard :recipe="recipe" />
          </div>
        </div>
      </div>

      <!-- Werbung rechts (nur auf Desktop sichtbar) -->
      <div class="col-0 col-md-3">
        <div class="q-pa-md bg-grey-2 text-grey-7 rounded-borders">
          <p>🔸 Werbung</p>
          <p style="font-size: 0.85em">Hier könnte Ihre Anzeige stehen.</p>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import RecipeCard from 'components/RecipeCard.vue'
import { uid } from 'quasar'
import { TabReference, TabReferenceType } from 'src/content/models/TabReference'
import recipesData from 'src/data/recipes.json'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const tabsetId = ref(null as unknown as string)
const tabset = ref<Tabset>(new Tabset(uid(), 'empty', []))

const tab = ref('')
const route = useRoute()

onMounted(() => {
  if (!route || !route.params) {
    return
  }
  // initial setup from route params
  tabsetId.value = route?.params.tabsetId as string
  tabset.value = useTabsetsStore().getTabset(tabsetId.value) || new Tabset(uid(), 'empty', [])
})

const search = ref('')
const selectedCategory = ref('')
const recipes = ref(recipesData)

const categories = ['Alle Rezepte', ...new Set(recipes.value.map((r) => r.category))]

type TabAndReference = { tab: Tab; trf: object }
type TabAndReferences = { tab: Tab; trfs: TabReference[] }

const filteredRecipes = computed(() => {
  const allRecipies = recipes.value

  console.log('input', tabset.value.tabs)
  const rs: TabAndReference[] = tabset.value.tabs
    .flatMap((t: Tab) => {
      const tRs: TabReference[] = t.tabReferences.filter(
        (tr: TabReference) =>
          tr.type === TabReferenceType.LINKING_DATA &&
          tr.data['@type' as keyof object] &&
          'Recipe' === (((tr.data['@type' as keyof object] || '') as string) || ''),
      )
      return { tab: t, trfs: tRs }
    })
    .flatMap((tabAndReferences: TabAndReferences) => {
      const res: TabAndReference[] = tabAndReferences.trfs.map((tr: TabReference) => {
        return { tab: tabAndReferences.tab, trf: tr.data }
      })
      return res
    })
  //.map((tr: TabReference) => tr.data)
  console.log('rs', rs)

  rs.forEach((r2) => {
    const useTitle: string = ((r2.trf['name' as keyof object] || '') as string) || ''
    const useCategory: string = ((r2.trf['recipeCategory' as keyof object] || '') as string) || ''
    const useImage: string = ((r2.trf['image' as keyof object] || '') as string) || ''

    let domain = '???'
    try {
      const theURL = new URL(r2.tab.url || '')
      domain = theURL.hostname
    } catch (e) {}

    const rezept = {
      id: 'test',
      title: useTitle,
      category: useCategory,
      ingredients: [],
      instructions: [],
      prepTime: 0,
      cookTime: 0,
      portions: 1,
      image: useImage,
      source: 'source',
      domain: domain,
    }
    allRecipies.push(rezept)
  })

  return recipes.value.filter(
    (r) =>
      r.title.toLowerCase().includes(search.value.toLowerCase()) &&
      (selectedCategory.value === 'Alle Rezepte' ||
        selectedCategory.value === '' ||
        r.category === selectedCategory.value),
  )
})
</script>
<style lang="scss" scoped>
.badge-green {
  border: 1px solid;
  border-color: $aspargus;
  color: $aspargus;
}

.badge-green.active {
  background-color: $aspargus;
  color: white;
}
</style>
