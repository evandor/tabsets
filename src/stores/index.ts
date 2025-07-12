import { defineStore } from '#q-app/wrappers'
import { createPinia } from 'pinia'

declare module 'pinia' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface PiniaCustomProperties {
    // set hello(value: string | Ref<string>)
    // get hello(): string
    // type the router added by the plugin above (#adding-new-external-properties)
    // router: Router
    //firebaseServices: IFirebaseServices
    // simpleNumber: number
    // hello: string
    // secret: string
  }
}

export default defineStore(() => {
  const pinia = createPinia()
  // pinia.use(routeProviderPiniaPlugin)
  // You can add Pinia plugins here
  // pinia.use(({ store }) => {
  //   // store.router = markRaw(router)
  // })
  // pinia.use(SecretPiniaPlugin)
  // // pinia.use(() => ({ hello: 'world' }))
  // pinia.use(({ options, store }) => {
  //   // console.log('===', options, store)
  //   store.hello = 'world'
  //   store.simpleNumber = Math.random()
  //   store.$state.simpleNumber = Math.random()
  //   console.log('===>', store.simpleNumber, store.$state.simpleNumber)
  //   // make sure your bundler handles this. webpack and vite should do it by default
  //   if (process.env.NODE_ENV === 'development') {
  //     // add any keys you set on the store
  //     store._customProperties.add('hello')
  //   }
  // })

  // pinia.use(({ store }) => {
  //   store.$subscribe((s: any, t: any) => {
  //     console.log('HIER', s, t)
  //   })
  //   store.$onAction((s: any) => {
  //     console.log('HIER!', s)
  //   })
  // })

  // pinia.use(({store}) => ({ hello: 'world' }))
  // pinia.use(({ store }) => {
  //   store.hello = 'world'
  //   // store.firebaseServices = markRaw(useFirebaseServices().firebaseServices)
  // })

  return pinia
})
