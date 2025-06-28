// import {useSearchStore} from "src/search/stores/searchStore";
// import {uid, useQuasar} from "quasar";
// import mitt from 'mitt'
//
// const emitter = mitt()
//
// class onMessageListener {
//
//   private onMessageListener = (request: any, sender: chrome.runtime.MessageSender, sendResponse: any) =>
//     this.onMessage(request, sender, sendResponse)
//
//   onMessage(request: any, sender: chrome.runtime.MessageSender, sendResponse: any) {
//     //if (inIgnoredMessages(request)) {
//     //  return true
//     //}
//     console.debug(" <<< got message in ChromeListeners", request)
//     if (request.msg === 'add-to-search') {
//       useSearchStore().addToIndex(
//         uid(),
//         request.data.name,
//         request.data.title,
//         request.data.url,
//         request.data.description,
//         request.data.content,
//         request.data.tabsets,
//         request.data.favIconUrl)
//     }
//   }
//
//   async initListeners() {
//     console.log(" init onMessage listener for search")
//     //chrome.runtime.onMessage.addListener(this.onMessageListener)
//
//
//     // useQuasar().bex.on('some.event', ({ data, respond }) => {
//     //   console.log('Event receieved, responding...')
//     //   respond(data.someKey + ' hey!')
//     // })
//   }
//
//   async resetListeners() {
//     console.log(" ...resetting listeners (after re-initialization)")
//     chrome.runtime.onMessage.removeListener(this.onMessageListener)
//   }
// }
//
// export default new onMessageListener();
