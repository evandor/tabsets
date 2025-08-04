import { createBridge } from '#q-app/bex/content'

const bridge = createBridge({ debug: false })

chrome.storage.local.get('tabsets.ext.ai.active').then((active: object) => {
  console.log('active', active)
  if (true === active['tabsets.ai.active' as keyof object]) {
    console.log('hi3r')
    bridge
      .connectToBackground()
      .then(() => {
        console.log(`[BEX-CT] Connected to background`)
        // chrome.storage.local.set({ 'tabsets.ai.active': true })
        //LocalStorage.setItem('tabsets.categories', ['recipe', 'food'])
        chrome.storage.local.get('tabsets.ext.categories').then((categories: { [p: string]: any }) => {
          console.log('categories', categories['tabsets.categories'])
          bridge
            .send({
              event: 'tabsets.bex.categoriesList',
              to: 'background',
              payload: { categories: categories['tabsets.ai.categories'] },
            })
            .then((answer: object | undefined) => {
              console.log('answer', answer)
            })
        })
      })
      .catch((err) => {
        console.error('[BEX-CT] Failed to connect to background:', err)
      })
  }
})
