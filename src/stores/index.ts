import { defineStore } from '#q-app/wrappers'
import { createPinia } from 'pinia'
import IFirebaseServices from 'src/services/firebase/IFirebaseServices'
import { useFirebaseServices } from 'src/services/firebase/useFirebaseServices'
import { markRaw } from 'vue'

/*
 * When adding new properties to stores, you should also
 * extend the `PiniaCustomProperties` interface.
 * @see https://pinia.vuejs.org/core-concepts/plugins.html#typing-new-store-properties
 */

declare module 'pinia' {
  export interface PiniaCustomProperties {
    // set hello(value: string | Ref<string>)
    // get hello(): string

    // type the router added by the plugin above (#adding-new-external-properties)
    // router: Router
    firebaseServices: IFirebaseServices
  }
}
function SecretPiniaPlugin() {
  return { secret: 'the cake is a lie' }
}

export default defineStore((/* { ssrContext } */) => {
  const pinia = createPinia()

  // You can add Pinia plugins here
  // pinia.use(({ store }) => {
  //   store.router = markRaw(useRouter()) as Router
  // })
  // pinia.use(() => ({ hello: 'world' }))
  pinia.use(({ store }) => {
    // store.hello = 'world'
    store.firebaseServices = markRaw(useFirebaseServices().firebaseServices)
  })

  return pinia
})
