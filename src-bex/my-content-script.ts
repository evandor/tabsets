/**
 * Importing the file below initializes the content script.
 *
 * Warning:
 *   Do not remove the import statement below. It is required for the extension to work.
 *   If you don't need createBridge(), leave it as "import '#q-app/bex/content'".
 */
import { createBridge } from '#q-app/bex/content'

console.log('[BEX-CT] loading my-content-scripts')

// The use of the bridge is optional.
const bridge = createBridge({ debug: false })
/**
 * bridge.portName is 'content@<path>-<number>'
 *   where <path> is the relative path of this content script
 *   filename (without extension) from /src-bex
 *   (eg. 'my-content-script', 'subdir/my-script')
 *   and <number> is a unique instance number (1-10000).
 */

/**
 * When the drawer is toggled set the iFrame height to take the whole page.
 * Reset when the drawer is closed.
 */
bridge.on('wb.drawer.toggle', (x) => {
  if ((x['data' as keyof object] as any).open) {
    setIFrameHeight('100%')
  } else {
    resetIFrameHeight()
  }
  const f = x['respond' as keyof object] as any
  f()
})

const iFrame = document.createElement('iframe')
const defaultFrameHeight = '62px'

/**
 * Set the height of our iFrame housing our BEX
 * @param height
 */
function setIFrameHeight(height: string) {
  bridge.log('logging2', height)
  iFrame.height = height
}

/**
 * Reset the iFrame to its default height e.g The height of the top bar.
 */
function resetIFrameHeight() {
  setIFrameHeight(defaultFrameHeight)
}

/**
 * The code below will get everything going. Initialize the iFrame with defaults and add it to the page.
 * @type {string}
 */
iFrame.id = 'bex-app-iframe'
iFrame.width = '100%'
resetIFrameHeight()

// Assign some styling so it looks seamless
Object.assign(iFrame.style, {
  //position: 'fixed',
  top: '0',
  right: '0',
  bottom: '0',
  left: '0',
  border: '0',
  zIndex: '9999999', // Make sure it's on top
  // overflow: 'visible'
})
;(function () {
  // When the page loads, insert our browser extension app.
  iFrame.src = chrome.runtime.getURL('www/index.html')
  document.body.prepend(iFrame)
})()

declare module '@quasar/app-vite' {
  interface BexEventMap {
    'some.event': [{ someProp: string }, void]
  }
}

// Hook into the bridge to listen for events sent from the other BEX parts.
bridge.on('some.event', ({ payload }) => {
  if (payload.someProp) {
    // Access a DOM element from here.
    // Document in this instance is the underlying website the contentScript runs on
    const el = document.getElementById('some-id')
    if (el) {
      el.innerText = 'Quasar Rocks!'
    }
  }
})

/**
 * Leave this AFTER you attach your initial listeners
 * so that the bridge can properly handle them.
 *
 * You can also disconnect from the background script
 * later on by calling bridge.disconnectFromBackground().
 *
 * To check connection status, access bridge.isConnected
 */
bridge
  .connectToBackground()
  .then(() => {
    console.log('Connected to background')
  })
  .catch((err) => {
    console.error('Failed to connect to background:', err)
  })

// More examples:

// Listen to a message from the client
// bridge.on('test', message => {
//   console.log(message);
//   console.log(message.payload);
// });

// Send a message and split payload into chunks
// to avoid max size limit of BEX messages.
// Warning! This happens automatically when the payload is an array.
// If you actually want to send an Array, wrap it in an object.
// bridge.send({
//   event: 'test',
//   to: 'app',
//   payload: [ 'chunk1', 'chunk2', 'chunk3', ... ]
// }).then(responsePayload => { ... }).catch(err => { ... });

// Send a message and wait for a response
// bridge.send({
//   event: 'test',
//   to: 'background',
//   payload: { banner: 'Hello from content-script' }
// }).then(responsePayload => { ... }).catch(err => { ... });

// Listen to a message from the client and respond synchronously
// bridge.on('test', message => {
//   console.log(message);
//   return { banner: 'Hello from a content-script!' };
// });

// Listen to a message from the client and respond asynchronously
// bridge.on('test', async message => {
//   console.log(message);
//   const result = await someAsyncFunction();
//   return result;
// });
// bridge.on('test', message => {
//   console.log(message);
//   return new Promise(resolve => {
//     setTimeout(() => {
//       resolve({ banner: 'Hello from a content-script!' });
//     }, 1000);
//   });
// });

// Broadcast a message to background, app & the other content scripts
// bridge.portList.forEach(portName => {
//   bridge.send({ event: 'test', to: portName, payload: 'Hello from content-script!' });
// });
//
// // Find any connected content script and send a message to it
// const contentPort = bridge.portList.find(portName => portName.startsWith('content@'));
// if (contentPort) {
//   bridge.send({ event: 'test', to: contentPort, payload: 'Hello from a content-script!' });
// }

// Send a message to a certain content script
// bridge
//   .send({ event: 'test', to: 'content@my-content-script-2345', payload: 'Hello from a content-script!' })
//   .then(responsePayload => { ... })
//   .catch(err => { ... });

// Listen for connection events
// (the "@quasar:ports" is an internal event name registered automatically by the bridge)
// --> ({ portList: string[], added?: string } | { portList: string[], removed?: string })
// bridge.on('@quasar:ports', ({ portList, added, removed }) => {
//   console.log('Ports:', portList);
//   if (added) {
//     console.log('New connection:', added);
//   } else if (removed) {
//     console.log('Connection removed:', removed);
//   }
// });

// Current bridge port name (can be 'content@<name>-<xxxxx>')
console.log('[BEX-CT] bridge.portName', bridge.portName)

// Dynamically set debug mode
// bridge.setDebug(true); // boolean
//
// // Log a message on the console (if debug is enabled)
// bridge.log('Hello world!');
// bridge.log('Hello', 'world!');
// bridge.log('Hello world!', { some: 'data' });
// bridge.log('Hello', 'world', '!', { some: 'object' });
// Log a warning on the console (regardless of the debug setting)
// bridge.warn('bridge.portName', bridge.portName);
// bridge.warn('Hello', 'world!');
// bridge.warn('Hello world!', { some: 'data' });
// bridge.warn('Hello', 'world', '!', { some: 'object' });
