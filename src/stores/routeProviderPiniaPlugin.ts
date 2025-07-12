import { PiniaPluginContext } from 'pinia'

export function routeProviderPiniaPlugin(context: PiniaPluginContext) {
  console.log('context', context)
  console.log('context', context.app)

  return { secret: 'the cake is a lie' }
}
