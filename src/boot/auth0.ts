import {boot} from 'quasar/wrappers'
import {createAuth0} from '@auth0/auth0-vue';

export default boot(({app}) => {
  const clientOptions = {
    domain: 'skysail.eu.auth0.com',
    clientId: 'mqe1fc3eajTkGrmiWLiEH8pH6W3lx960', // Tabsets-SPA
    authorizationParams: {
      redirect_uri: (process.env.MODE === 'bex') ? window.location.origin + "/www/index.html" : window.location.origin,
      audience: 'tabsets-spa-api-ident'
    }
  }
  console.log("redirect", clientOptions)
  const auth0 = createAuth0(clientOptions)

  // Set i18n instance on app
  app.use(auth0);
});
