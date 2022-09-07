## Use Cases

### Currently open tabs

#### Displaying currently open tabs

##### current mode ("Browser")

When in 'current' mode, the browser's window's open tabs are displayed, grouped by

- pinned tabs
- tabs in chrome groups
- the rest of the tabs (unpinned and ungrouped)

Duplicates (tabs of the same tabset with the same url) are highlighted.

##### non-current mode (tabset selected)

When in non-current mode (i.e. displaying a tabset), the browser's window's open tabs are displayed, grouped by

- unsaved tabs (which have been opened (and maybe closed again) since the tabset was saved last time.
- pinned tabs
- tabs in chrome groups
- the rest of the tabs (unpinned and ungrouped)

Duplicates (tabs of the same tabset with the same url) are highlighted.

The unsaved tabs can have a

- green border: when opened after last save of tabset
- red border: they have been closed in the meantime

#### Closing browser tabs

##### current mode ("Browser")

When closing a browser's tab, this is reflected in the 'current' tabset immediately.

##### non-current mode

Todo

#### Creating a new tabset

##### current mode ("Browser")

###### 'New Tabset...' button

A dialog is displayed where the user can enter the new tabset name and decide whether to close the
currently open tabs.

## Glossar

'current' mode

non-current mode
