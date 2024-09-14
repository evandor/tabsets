import { boot } from 'quasar/wrappers'
import {BrowserClient, defaultStackParser, getDefaultIntegrations, makeFetchTransport, Scope} from "@sentry/browser";


//https://enterprisevue.dev/blog/error-handling-in-vue-3/
export default boot(async ({app}) => {

  const integrations = getDefaultIntegrations({}).filter(
    (defaultIntegration) => {
      return !["BrowserApiErrors", "Breadcrumbs", "GlobalHandlers"].includes(
        defaultIntegration.name,
      );
    },
  );

  const client = new BrowserClient({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.TABSETS_STAGE,
    transport: makeFetchTransport,
    stackParser: defaultStackParser,
    integrations: integrations,
  });

  const scope = new Scope();
  scope.setClient(client);
  client.init();

  app.config.errorHandler = (err:any, vm, info) => {
    //console.log("got error!", typeof err, err)
    scope.captureException(new Error(err.toString() + ": " + err.stack));

    //console.error("-- Scope:", res);
    console.error("-- Error:", err);
    console.error("-- Vue component:", vm);
    console.error("-- Additional info:", info);
  };
})
