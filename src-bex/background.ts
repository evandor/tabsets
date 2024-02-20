import {bexBackground} from 'quasar/wrappers';
import OnInstalledReason = chrome.runtime.OnInstalledReason;
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import {getToken} from "firebase/messaging";
import FirebaseServices from "src/services/firebase/FirebaseServices";
import {useAuthStore} from "stores/authStore";
import FirestorePersistenceService from "src/services/persistence/FirestorePersistenceService";
import {uid} from "quasar";
import { getMessaging } from "firebase/messaging/sw";
import { onBackgroundMessage } from "firebase/messaging/sw";

// https://stackoverflow.com/questions/49739438/when-and-how-does-a-pwa-update-itself
const updateTrigger = 10

// https://developer.chrome.com/docs/extensions/mv3/tut_analytics/
//console.log("ga: installing google analytics")

// chrome.gcm.register(['77748275803'], (callback) => {
//  console.log("gcm callback", callback)
//   chrome.gcm.send(
//     {
//       data: {msg: "i am the data"},
//       destinationId: uid(),
//       messageId: uid()
//     },
//     (callback) => {
//       console.log("gcm callback send:", callback)
//     })
// })
//
// chrome.gcm.onMessage.addListener((message) => {
//   console.log("gcm message", message)
// })

addEventListener('unhandledrejection', async (event) => {
  console.log("ga: fire error event", event)
  // getting error: Service worker registration failed. Status code: 15
  //Analytics.fireErrorEvent(event.reason);
});

chrome.runtime.onInstalled.addListener((callback) => {
  console.log("ga: fire event install", callback.reason, callback.previousVersion)
  // getting error: "Service worker registration failed. Status code: 15"
  // Analytics.fireEvent('install-' + callback.reason);
  if (callback.reason !== OnInstalledReason.CHROME_UPDATE) {
    chrome.tabs.create({
      active: true,
      url: callback.previousVersion ?
        "https://tabsets.web.app/#/updatedFrom/" + callback.previousVersion :
        "https://tabsets.web.app/#/installed/"
    })
  }
});

chrome.omnibox.onInputEntered.addListener((text) => {
  const newURL = chrome.runtime.getURL("/www/index.html#/searchresult?t=" + encodeURIComponent(text))
  chrome.tabs.create({url: newURL})
    .catch((err) => console.log("background.js error", err))
});

let modelPromise: any = null

// @ts-ignore
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  // @ts-ignore
  chrome.sidePanel
    .setPanelBehavior({openPanelOnActionClick: true})
    .catch((error: any) => console.error(error));
}

chrome.runtime.onInstalled.addListener((details) => {
  console.debug("adding onInstalled listener in background.ts", details)
  // @ts-ignore
  if (chrome.action) {
    // @ts-ignore
    chrome.action.onClicked.addListener((tab) => {
      // Opens our extension in a new browser window.
      // Only if a popup isn't defined in the manifest.
      chrome.tabs.create(
        {
          url: chrome.runtime.getURL('www/index.html'),
        },
        (newTab) => {
          console.log("newTab", newTab)
        }
      );
    });
  } else {
    // @ts-ignore
    //browser.browserAction.onClicked.addListener(openMyPage);
  }
});

chrome.runtime.onStartup.addListener(() => {
  console.log("adding onStartup listener in background.ts")
  // @ts-ignore
  if (chrome.action) {
    // @ts-ignore
    chrome.action.onClicked.addListener((tab) => {
      // Opens our extension in a new browser window.
      // Only if a popup isn't defined in the manifest.

      chrome.tabs.create(
        {
          url: chrome.runtime.getURL('www/index.html'),
        },
        (newTab) => {
          console.log("newTab", newTab)
        }
      );
    });
  }
})

chrome.runtime.onConnect.addListener(function (port) {
  if (port.name === 'tabsetsSidepanel') {
    //console.log("port3", port)
    port.onDisconnect.addListener(async () => {
      //alert('Sidepanel closed.');
    });
  }
});

// chrome.runtime.onInstalled.addListener(async () => {
//   console.log("---hier Startup---")
//
//   //FirebaseServices.init()
//   // const token = await getToken(getMessaging(), {
//   //   serviceWorkerRegistration: self.registration, // note: we use the sw of ourself to register with
//   // });
//   console.log("---hier2 Startup---")
//   const firebaseApp = firebase.initializeApp({
//     apiKey: process.env.FIREBASE_API_KEY,
//     authDomain: process.env.FIREBASE_AUTH_DOMAIN,
//     projectId: process.env.FIREBASE_PROJECT_ID,
//     appId: process.env.FIREBASE_APP_ID,
//     messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID
//   })
//   console.log("hier")
//   const messaging = getMessaging(firebaseApp)
//
//   console.log("===>", messaging, self)
//   try {
//     const token = await getToken(messaging, {
//       // @ts-ignore
//       serviceWorkerRegistration: self.registration, // note: we use the sw of ourself to register with
//     });
//     console.log("token", token)
//
//
//     //localStorage.setItem('fcmToken', token)
//     //setDoc(doc(FirebaseServices.getFirestore(), "users", useAuthStore().user.uid), {fcmToken: token})
//     //await FirestorePersistenceService.updateUserToken(token)
//     //postMessage({name:"update-fcm-token", token: token})
//   } catch (err) {
//     console.log("got error", err)
//     const permission = await Notification.requestPermission();
//     console.log("permission", permission)
//   }
// });

const firebaseApp = firebase.initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  appId: process.env.FIREBASE_APP_ID,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID
})
const messaging = getMessaging(firebaseApp)

onBackgroundMessage(messaging, async (payload:any) => {
  console.log(`Huzzah! A Message.`, payload);

  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/firebase-logo.png'
  };

  await self.registration.showNotification(notificationTitle, notificationOptions);
});
// onMessage(FirebaseServices.getMessaging(), async (payload:any) => {
//   console.log(`Huzzah! A Message.`, payload);
//
//   // Note: you will need to open a notification here or the browser will do it for you.. something, something, security
// });

export default bexBackground((bridge, cons/* , allActiveConnections */) => {
  console.log("==== hier =====")
  // bridge.on('some.event', ({data, respond}) => {
  //   console.log('Event receieved, responding...')
  //   respond(data.someKey + ' hey!')
  // })

  const firebaseApp = firebase.initializeApp({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    appId: process.env.FIREBASE_APP_ID,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID
  })
  const messaging = getMessaging(firebaseApp)
  getToken(messaging, {
    // @ts-ignore
    serviceWorkerRegistration: self.registration, // note: we use the sw of ourself to register with
  }).then((token) => {
    bridge.send('fcm.token.received', { token: token })
      .then((data) => {
        console.log('fcm.token.received response', data)
      })
  }).catch((err) => {
    console.log("===>", err)
  })


  // chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  //   console.log("sending to bridge")
  //   bridge.send('highlight.content', { url: tab.url })
  // })

  bridge.on('quasar.detect', ({data, respond}) => {
    console.log("quasar.detect2", data)
    // Let's resolve the `send()` call's promise, this way we can await it on the other side then display a notification.
    respond()
  })

});
