import { boot } from 'quasar/wrappers'
import {BrowserClient, defaultStackParser, getDefaultIntegrations, makeFetchTransport, Scope} from "@sentry/browser";

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
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
    scope.captureException(new Error(err.toString()));

    console.error("-- Error:", err);
    console.error("-- Vue component:", vm);
    console.error("-- Additional info:", info);
  };
})
