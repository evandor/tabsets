import { useLdJsonUtils } from 'src/core/services/LdJsonUtils'
import { Tab } from 'src/tabsets/models/Tab'

export function useRecipesServices() {
  function extractFrom(r2: { tab: Tab; trf: object }) {
    console.log('extracting from', r2.tab.url, r2.trf)
    const useTitle: string = useLdJsonUtils().extractName(r2.trf) || ''
    const useCategory: string = useLdJsonUtils().extractRecipeCategory(r2.trf) || ''
    const useImage = useLdJsonUtils().extractImage(r2.trf)
    const prepTime = useLdJsonUtils().extractDuration(r2.trf, 'prepTime')
    const cookTime = useLdJsonUtils().extractDuration(r2.trf, 'cookTime')
    const totalTime = useLdJsonUtils().extractDuration(r2.trf, 'totalTime')
    const ingredients = useLdJsonUtils().extractRecipeIngredients(r2.trf)
    const instructions = useLdJsonUtils().extractRecipeInstructions(r2.trf)

    //const useImage = Array.isArray(img) ? img[0] : img

    let domain = '???'
    try {
      const theURL = new URL(r2.tab.url || '')
      domain = theURL.hostname
    } catch (e) {}

    const rezept = {
      id: r2.tab.id,
      title: useTitle,
      category: useCategory,
      ingredients: ingredients.map((line: string) => {
        return { amount: ' ', product: line }
      }),
      instructions: instructions,
      prepTime: Math.round(prepTime / 60),
      cookTime: Math.round(cookTime / 60),
      totalTime: Math.round(totalTime / 60),
      portions: 1,
      image: useImage || '',
      source: r2.tab.url || '',
      domain: domain,
    }

    return rezept
  }
  return {
    extractFrom,
  }
}
