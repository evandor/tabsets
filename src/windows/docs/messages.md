## Messages

### In

none

### Out

List of outgoing messages

#### restore-tabset

to avoid dependencies on other submodules, this command can be used to trigger an event when a window should be
opened which contains a list of tabs (as used in the tabsets module)

```typescript
sendMsg('restore-tabset', { tabsetId: tsId, label: label })
```
