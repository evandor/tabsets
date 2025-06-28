## Example

In tabsets/src/tabsets/commands/AddTabToTabsetCommand.ts, there's a call

```typescript
AppEventDispatcher.dispatchEvent('add-to-search', {
  name: this.tab.name || '',
  title: this.tab.title || '',
  url: this.tab.url || '',
  description: this.tab.description,
  content: content ? content : '',
  tabsets: [this.tabset!.id],
  favIconUrl: this.tab.favIconUrl || '',
})
```

and in the AppEventDispatcher this is handled like this

```typescript
dispatchEvent(name: string, params: object) {
  //console.debug(" >>> dispatching event", name, params)
  try {
    switch (name) {
      case 'add-to-search':
        useSearchStore().addObjectToIndex(params)
        break
      case 'upsert-in-search':
        useSearchStore().upsertObject(params)
        break
      default:
        console.log(`unknown event ${name}`)
    }
  } catch (err) {
    console.warn("problem dispatching event: ", err)
  }
}
```

This is an example for an upsert:

```typescript
AppEventDispatcher.dispatchEvent('upsert-in-search', doc)
```
