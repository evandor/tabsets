# Tabsets Extension - Concepts

Development Concepts

# Listeners

## Browser Listeners

Many browser events will trigger code execution in tabsets:

### tabs.onUpdate

Implemented in 

- BrowserListeners
- <del>SidePanelOpenTabsListViewer</del>
- tabsStore2
- windowsStore

#### BrowserListeners

<<< ../src/app/listeners/BrowserListeners.ts#snippet

#### WindowsStore

<<< ../src/windows/stores/windowsStore.ts#snippet

### tabs.onActive

Implemented in

- BrowserListeners
- tabsStore

#### BrowserListeners

<<< ../src/app/listeners/BrowserListeners.ts#snippet2

#### tabsStore 

todo
