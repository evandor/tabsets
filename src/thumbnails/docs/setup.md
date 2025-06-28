## Setup

In the src/app/AppEventDispatcher file we need to setup the capture message:

```typescript

dispatchEvent(name: string, params: object) {
  //console.debug(" >>> dispatching event", name, params)
  switch (name) {
    //...
    case 'capture-screenshot':
      useThumbnailsService().handleCaptureCallback(params['tabId' as keyof object], params['data' as keyof object])
      break
    default:
      console.log(`unknown event ${name}`)
  }
}
```
