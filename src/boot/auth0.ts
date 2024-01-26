import {boot} from 'quasar/wrappers'
import {createAuth0} from '@auth0/auth0-vue';

// not active (in quasar.config.js)
export default boot(({app}) => {

    let redirectUrl = window.location.origin + "/www/index.html#/sidepanel"
    // @ts-ignore
    if (process.env.MODE === 'bex' && !chrome.sidePanel) {
        redirectUrl = window.location.origin + "/www/index.html#/tabsets"
    }
    if (process.env.MODE === 'pwa') {
        //redirectUrl = window.location.origin + "/#/sidepanel" - maybe for mobile phones?
        redirectUrl = window.location.origin + "/#/tabsets" // - for browsers
    } else if (process.env.MODE === "electron") {
        //redirectUrl = "chrome-extension://noelfbnoaghjdgfbhieajghjopkhoode/www/index.html"
        redirectUrl = "http://localhost/callback"
    }

    console.log("redirect", process.env.MODE, redirectUrl)

    const clientOptions = {
        domain: 'skysail.eu.auth0.com',
        clientId: 'mqe1fc3eajTkGrmiWLiEH8pH6W3lx960', // Tabsets-SPA
        authorizationParams: {
            redirect_uri: redirectUrl,
            audience: 'tabsets-api-ident'
        }
    }
    //console.log("setting up auth", clientOptions)
    const auth0 = createAuth0(clientOptions)

    app.use(auth0);
});
