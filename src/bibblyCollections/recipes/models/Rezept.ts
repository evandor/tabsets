interface Ingredient {
  amount: string
  product: string
}

// interface Recipe {
//   id: string
//   title: string
//   image: string
//   category: string
//   prepTime: number
//   cookTime: number
//   portions: number
//   instructions: string[]
//   source: string
//   domain: string
// }

export type Rezept = {
  id: string
  title: string
  category: string
  instructions: string[]
  prepTime: number
  cookTime: number
  portions: number
  ingredients?: Ingredient[]
  image: string
  source?: string
  domain: string
}
