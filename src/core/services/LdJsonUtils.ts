import { parse, toSeconds } from 'iso8601-duration'

export function useLdJsonUtils() {
  function typeIs(data: object, type: string): boolean {
    return (
      data['@type' as keyof object] !== undefined &&
      'Recipe' === (((data['@type' as keyof object] || '') as string) || '')
    )
  }

  function extractName(trf: object): string | undefined {
    return trf['name' as keyof object]
  }

  function extractRecipeCategory(trf: object): string | undefined {
    return trf['recipeCategory' as keyof object]
  }

  function extractRecipeIngredients(trf: object): string[] {
    const ings = trf['recipeIngredient' as keyof object]
    console.log('ings', ings)
    return ings
  }

  function extractRecipeInstructions(trf: object): string[] {
    const instructions = trf['recipeInstructions' as keyof object]
    // console.log('instructions', instructions)
    if (Array.isArray(instructions)) {
      return Array.from(instructions).map((instruction: any) => {
        if (instruction['@type' as keyof object] === 'HowToStep') {
          return instruction['text' as keyof object]
        }
      })
    }
    return instructions
  }

  /**
   * expects a duration string like PT1H30M or PT1H30M30S and returns the number of seconds.
   * If there are any problems, returns -1.
   */
  function extractDuration(trf: object, key: string): number {
    const duration: string | undefined = trf[key as keyof object] as unknown as string | undefined
    if (!duration) {
      return -1
    }
    if (duration.startsWith('PT')) {
      return toSeconds(parse(duration))
    }
    return -1
  }

  function extractImage(trf: object): string | undefined {
    const maybeImage = trf['image' as keyof object]
    if (!maybeImage) {
      return undefined
    }
    const image = Array.isArray(maybeImage) ? maybeImage[0] : maybeImage
    // console.log('image', image)
    if (typeof image === 'object' && image['@type' as keyof object] === 'ImageObject') {
      return image['url' as keyof object] as string
    }
    return image
  }

  return {
    typeIs,
    extractName,
    extractRecipeCategory,
    extractRecipeIngredients,
    extractRecipeInstructions,
    extractDuration,
    extractImage,
  }
}
