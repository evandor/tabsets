<template>

  <q-layout view="lHh Lpr lFf">
    <q-page class="q-pa-md flex flex-center">
      <q-card class="full-width" style="max-width: 800px;">
        <div class="row no-wrap">


          <!-- Card Inhalt -->
          <div class="col">

            <!-- Titel & Kategorie -->
            <q-card-section>
              <q-img :src="recipe.image" style="height: 200px; width: 100%;" ratio="16/9" class="recipe-img">
              </q-img>
            </q-card-section>

            <q-card-section class="q-pt-none">
              <div class="text-h6 midnight-green">{{ recipe.title }}</div>
              <div class="text-subtitle2 text-grey-7">{{ recipe.category }}</div>
              <div class="text-caption">
                <a :href="recipe.source" target="_blank" rel="noopener" class="text-8 source-link">
                  {{ recipe.domain }}
                </a>
              </div>
            </q-card-section>


            <q-separator />



            <q-card-actions align="around">
              <q-item-label caption>Zubereitung: {{ recipe.prepTime }} min</q-item-label>
              <q-item-label caption>Zeit gesamt: {{ recipe.prepTime + recipe.cookTime }} min</q-item-label>
              <q-item-label caption>Portionen: {{ recipe.portions }}</q-item-label>
            </q-card-actions>

            <q-separator />

            <!-- Zutaten, alle Produkte ohne Menge werden am Ende der Liste angezeigt -->
            <q-card-section>
              <div class="text-subtitle1 q-mb-sm">Zutaten</div>
              <q-list>

                <!-- Zutaten MIT Menge -->
                <q-item v-for="(ingredient, index) in ingredientsWithAmount" :key="index"
                  :class="index % 2 === 0 ? 'bg-grey-2' : ''">
                  <q-item-section side style="min-width: 80px; ">
                    {{ ingredient.amount }}
                  </q-item-section>
                  <q-item-section>
                    {{ ingredient.product }}
                  </q-item-section>
                </q-item>

                <!-- Zutaten OHNE Menge -->
                <q-item v-if="ingredientsWithoutAmount.length" class="bg-grey-2">
                  <q-item-section>
                    {{ingredientsWithoutAmount.map(i => i.product).join(', ')}}
                  </q-item-section>
                </q-item>

              </q-list>
            </q-card-section>

            <!-- Anleitung -->
            <q-card-section>
              <div class="text-subtitle1 q-mb-sm">Anleitung</div>
              <ul class="q-pl-md">
                <li v-for="(instruction, index) in recipe.instructions" :key="index">
                  {{ instruction }}
                </li>
              </ul>
            </q-card-section>
          </div>
        </div>
      </q-card>
    </q-page>
  </q-layout>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import recipesData from 'src/data/recipes.json'



const route = useRoute()
const recipeId = route.params.id as string
const ingredientsWithAmount = computed(() =>
  recipe.value.ingredients.filter(i => i.amount && i.amount.trim() !== '')
)

const ingredientsWithoutAmount = computed(() =>
  recipe.value.ingredients.filter(i => !i.amount || i.amount.trim() === '')
)


interface Ingredient {
  amount: string
  product: string
}

interface Recipe {
  id: string
  title: string
  image: string
  category: string
  prepTime: number
  cookTime: number
  portions: number
  ingredients: Ingredient[]
  instructions: string[]
  source: string
  domain: string
}

const recipe = computed<Recipe>(() =>
  recipesData.find(r => r.id === recipeId) || {
    id: '0',
    title: 'Unbekanntes Rezept',
    image: '',
    category: 'Allgemein',
    prepTime: 0,
    cookTime: 0,
    portions: 1,
    ingredients: [],
    instructions: [],
    source: 'Unbekannt',
    domain: 'Unbekannt'
  }
)

</script>


<style scoped>
.q-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
