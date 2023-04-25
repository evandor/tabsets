// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks
// @ts-ignore
import {bexContent} from 'quasar/wrappers'

/*
 * This script will be injected all the time; other script like content-script-thumbnails
 * are only injected when appropriate permission is given by the user
 */
export default bexContent((bridge: any) => {

  console.log("tabsets: initializing tabset extension content script")

  // @ts-ignore
  bridge.on('websiteImg', ({ data, respond }) => {
    console.log('Event received, responding...', data)
    chrome.runtime.sendMessage(data, (res) => {
      console.log("2", res)
    })
    respond('sent')
  })


})
