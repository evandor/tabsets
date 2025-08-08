import { createBridge } from '#q-app/bex/content'

const bridge = createBridge({ debug: false })

// chrome.storage.local.get('tabsets.ext.ai.active').then((active: object) => {
//   console.log('[BEX-CT] active', active)
//   if (true === active['tabsets.ext.ai.active' as keyof object]) {
//     console.log('[BEX-CT] hi3r')
//     bridge
//       .connectToBackground()
//       .then(() => {
//         console.log(`[BEX-CT] Connected to background`)
//         chrome.storage.local.set({ 'tabsets.ext.ai.categories': ['recipe', 'news', 'food', 'programming'] })
//         //LocalStorage.setItem('tabsets.categories', ['recipe', 'food'])
//         chrome.storage.local.get('tabsets.ext.ai.categories').then((categories: { [p: string]: any }) => {
//           console.log('[BEX-CT] categories', categories['tabsets.ext.ai.categories'])
//           bridge
//             .send({
//               event: 'tabsets.bex.categoriesList',
//               to: 'background',
//               payload: { categories: categories['tabsets.ext.ai.categories'] },
//             })
//             .then((answer: object | undefined) => {
//               console.log('[BEX-CT] answer', answer)
//             })
//         })
//       })
//       .catch((err) => {
//         console.error('[BEX-CT] Failed to connect to background:', err)
//       })
//   }
// })
