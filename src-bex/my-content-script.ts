// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks


// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks
import { bexContent } from 'quasar/wrappers'

// console.log("in bexContext11")

// const
//   iFrame = document.createElement('iframe'),
//   defaultFrameHeight = '82px'
//
// /**
//  * Set the height of our iFrame housing our BEX
//  * @param height
//  */
// const setIFrameHeight = (height:any) => {
//   iFrame.height = height
// }
//
// /**
//  * Reset the iFrame to its default height e.g The height of the top bar.
//  */
// const resetIFrameHeight = () => {
//   setIFrameHeight(defaultFrameHeight)
// }
//
// /**
//  * The code below will get everything going. Initialize the iFrame with defaults and add it to the page.
//  * @type {string}
//  */
// iFrame.id = 'bex-app-iframe'
// iFrame.width = '100%'
// resetIFrameHeight()
//
// // Assign some styling so it looks seamless
// Object.assign(iFrame.style, {
//   position: 'fixed',
//   top: '0',
//   right: '0',
//   bottom: '0',
//   left: '0',
//   border: '0',
//   zIndex: '9999999', // Make sure it's on top
//   overflow: 'visible'
// })
//
// ;(function () {
//   // When the page loads, insert our browser extension app.
//   iFrame.src = chrome.runtime.getURL('www/index.html')
//   document.body.prepend(iFrame)
// })()

export default bexContent((bridge) => {
  console.log("bexContentBridge", bridge)
  /**
   * When the drawer is toggled set the iFrame height to take the whole page.
   * Reset when the drawer is closed.
   */
  // bridge.on('wb.drawer.toggle', ({ data, respond }) => {
  //   console.log("there!!!", data, respond)
  //   // if (data.open) {
  //   //   setIFrameHeight('100%')
  //   // } else {
  //   //   resetIFrameHeight()
  //   // }
  //   respond('yeah')
  // })

  // bridge.on('some.event', ({ data, respond }) => {
  //   console.log('Event receieved, responding...')
  //   respond(data.someKey + ' hey!')
  // })
  //
  // bridge.on('*', ({ data, respond }) => {
  //   console.log('Gotya, responding...')
  //   respond(data.someKey + ' hey!')
  // })


})
