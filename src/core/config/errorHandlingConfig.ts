import { BrowserClient, defaultStackParser, getDefaultIntegrations, makeFetchTransport, Scope } from '@sentry/vue'

export function useErrorHandlingConfig() {
  const setupErrorHandling = () => {
    //addIntegration(feedbackIntegration())
    const integrations = getDefaultIntegrations({}).filter((defaultIntegration) => {
      return !['BrowserApiErrors', 'Breadcrumbs', 'GlobalHandlers'].includes(defaultIntegration.name)
    })
    //console.log('integrations', integrations)

    // integrations.push(feedbackIntegration({
    //   colorScheme: "system",
    // }))

    const client = new BrowserClient({
      dsn: process.env.SENTRY_DSN!,
      environment: process.env.TABSETS_STAGE!,
      release: process.env.SENTRY_PROJECT_NAME + '@' + (import.meta ? import.meta.env?.PACKAGE_VERSION : '0.0.0'),
      transport: makeFetchTransport,
      stackParser: defaultStackParser,
      integrations: integrations, //.concat([feedbackIntegration()]),
    })

    const scope = new Scope()
    scope.setClient(client)
    client.init()

    // All feedback fields are optional, except `message`.
    // const userFeedback = {
    //   name: 'John Doe',
    //   email: 'john@doe.com',
    //   message: 'I really like your App, thanks!',
    // }
    // scope.captureFeedback(userFeedback)

    return scope
  }

  return {
    setupErrorHandling,
  }
}
