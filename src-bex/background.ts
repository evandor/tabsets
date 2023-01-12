import {bexBackground} from 'quasar/wrappers';

var corsExceptions: any[] = [];
var sameOriginOnly = false;

function formatHeaders(headersObject: any) {
  var headers = [];
  for (var pair of headersObject.entries()) {
    headers.push({
      name: pair[0],
      value: pair[1]
    });
  }

  return headers;
}

function createRequestObject(request: any) {
  return {
    method: request.method,
    url: request.url,
    referrer: request.referrer,
    headers: formatHeaders(request.headers)
  };
}

function getCorsForUrl(request: any) {
  var urlHost = hostParser(request.url);
  var referrerHost = hostParser(request.referrer);

  if (request.mode === 'navigate') {
    return 'navigate';
  }

  if (urlHost === referrerHost || request.referrer === '') {
    return 'same-origin';
  }

  var isAnException = corsExceptions.some(function (exception: any) {
    return (request.url.indexOf(exception) !== -1);
  });

  return isAnException ? 'cors' : 'no-cors';
}

function hostParser(url: string) {
  var match = url.match(/^(https?\:\/\/[^\/]*)(\/|$)/);
  return match && match[1];
}

// self.addEventListener('activate', function (event) {
//   console.log('[Service worker] Activated');
// });
//
// self.addEventListener('message', function handler(event) {
//   if (event.data && event.data.type === 'hello') {
//
//     if (event.data.debug) {
//       // TODO : find a solution to set debug mode before SW install and activate...
//       //console.setDebug(true);
//     }
//
//     corsExceptions = event.data.corsExceptions;
//     sameOriginOnly = event.data.sameOriginOnly;
//
//     console.log('[Service worker] Hello message received');
//
//     // var clientId = event.source.id;
//     // clientsList.setClientPort(clientId, event.ports[0]);
//     console.log('[Service worker] Client\'s messaging port registered');
//
//     // Tell the client that the worker is ready
//    // sendToClient(clientId, {type: 'plugged'});
//
//     console.log('[Service worker] Flushing the message waiting list');
//     // var awaitingMessages = clientsList.flushWaitingList(clientId);
//     // awaitingMessages.forEach(function(data) {
//     //   sendToClient(clientId, data);
//     // });
//
//   } else {
//     console.log('[Service worker] Un-catched message:');
//     console.log(event.data);
//   }
// })
//
// self.addEventListener('fetch', function handler(event) {
//   console.log('[Service worker] fetch: ');
//
//   var request = createRequestObject(event['request' as keyof object]);
//
//   console.log('[Service worker] Request sent', request);
//
//   var mode = getCorsForUrl(event['request' as keyof object]);
//   var credentials = (mode === 'same-origin') ? 'include' : 'omit';
//
//   if (sameOriginOnly && mode !== 'same-origin') {
//     console.log('[Service worker] Request blocked by sameOriginOnly option');
//     return;
//   }
//
//   // @ts-ignore
//   event.respondWith(
//
//     // @ts-ignore
//     fetch(new Request(event['request' as keyof object], {mode: mode, credentials: credentials}))
//
//       .then(function(response) {
//         console.log('[Service worker] Response received');
//
//         // sendToClient(event.clientId, {
//         //   type: 'response',
//         //   request: request,
//         //   response: createResponseObject(response)
//         // });
//
//         return response;
//       })
//
//       .catch(function(error) {
//         console.error('[Service worker] Fetch failed:');
//         console.error(error);
//
//         var response = new Response(new Blob(), {
//           status: 409,
//           statusText: '[Service worker problem] Remove the CORS exception for this request'
//         });
//
//         // sendToClient(event.clientId, {
//         //   type: 'response',
//         //   request: request,
//         //   response: createResponseObject(response)
//         // });
//       })
//   );
//
//   // if (event['preloadResponse' as keyof object]) {
//   //   (event['preloadResponse' as keyof object] as Promise<any>)
//   //     .then((res) => console.log("res", res))
//   //     .catch(err => console.error("drr", err))
//   // }
// })

chrome.runtime.onInstalled.addListener((details) => {
  //console.log("adding listener in background.ts", details)
  // @ts-ignore
  chrome.action.onClicked.addListener((tab) => {
    // Opens our extension in a new browser window.
    // Only if a popup isn't defined in the manifest.
    //console.log("tab", tab)

    if (details.reason === "update") {
      chrome.tabs.create(
        {
          url: 'https://tabsets.web.app/#/updateFrom/' + details.previousVersion,
        }
      );
    }

    chrome.tabs.create(
      {
        url: chrome.runtime.getURL('www/index.html'),
      },
      (newTab) => {
        // Tab opened.
        //console.log("newTab", newTab)
      }
    );

  });

});

declare module '@quasar/app-vite' {
  interface BexEventMap {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    log: [{ message: string; data?: any[] }, never];
    getTime: [never, number];

    'storage.get': [{ key: string | null }, any];
    'storage.set': [{ key: string; value: any }, any];
    'storage.remove': [{ key: string }, any];
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }
}

export default bexBackground((bridge, cons/* , allActiveConnections */) => {
  //console.log("bexBackgroundBridge", bridge)
  //console.log("cons", cons)

  // bridge.on('log', ({ data, respond }) => {
  //   console.log(`[BEX] ${data.message}`, ...(data.data || []));
  //   respond();
  // });
  //
  // bridge.on('getTime', ({ respond }) => {
  //   respond(Date.now());
  // });
  //
  // bridge.on('storage.get', ({ data, respond }) => {
  //   const { key } = data;
  //   if (key === null) {
  //     chrome.storage.local.get(null, (items) => {
  //       // Group the values up into an array to take advantage of the bridge's chunk splitting.
  //       respond(Object.values(items));
  //     });
  //   } else {
  //     chrome.storage.local.get([key], (items) => {
  //       respond(items[key]);
  //     });
  //   }
  // });
  // Usage:
  // const { data } = await bridge.send('storage.get', { key: 'someKey' })

  // bridge.on('storage.set', ({ data, respond }) => {
  //   chrome.storage.local.set({ [data.key]: data.value }, () => {
  //     respond();
  //   });
  // });
  // // Usage:
  // // await bridge.send('storage.set', { key: 'someKey', value: 'someValue' })
  //
  // bridge.on('storage.remove', ({ data, respond }) => {
  //   chrome.storage.local.remove(data.key, () => {
  //     respond();
  //   });
  // });
  // Usage:
  // await bridge.send('storage.remove', { key: 'someKey' })

  /*
  // EXAMPLES
  // Listen to a message from the client
  bridge.on('test', d => {
    console.log(d)
  })

  // Send a message to the client based on something happening.
  chrome.tabs.onCreated.addListener(tab => {
    bridge.send('browserTabCreated', { tab })
  })

  // Send a message to the client based on something happening.
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
      bridge.send('browserTabUpdated', { tab, changeInfo })
    }
  })
   */
});
