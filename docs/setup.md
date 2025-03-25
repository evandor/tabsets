# Tabsets Extension

Browser Extension to manage tabsets and bookmarks

## Checkout

```
git clone --recurse-submodules -j8 https://github.com/evandor/tabsets.git
```

Change into the tabsets directory and checkout the branch for your browser

```
git checkout chrome-extension
```

```
git checkout firefox-extension
```

```
git checkout edge-extension
```

## Install the dependencies

make sure you added the submodules: in the root folder, run

```
git submodule add -b main https://github.com/evandor/submodule-bookmarks.git src/bookmarks
git submodule add -b main https://github.com/evandor/submodule-core.git src/core
git submodule add -b main https://github.com/evandor/submodule-content.git src/content
git submodule add -b localstorage https://github.com/evandor/submodule-features.git src/features
git submodule add -b localstorage https://github.com/evandor/submodule-notes.git src/notes
git submodule add -b localstorage https://github.com/evandor/submodule-tabsets.git src/tabsets
git submodule add -b main https://github.com/evandor/submodule-opentabs.git src/opentabs
git submodule add -b main https://github.com/evandor/submodule-requests.git src/requests
git submodule add -b main https://github.com/evandor/submodule-search.git src/search
git submodule add -b localstorage https://github.com/evandor/submodule-snapshots.git src/snapshots
git submodule add -b localstorage https://github.com/evandor/submodule-spaces.git src/spaces
git submodule add -b main https://github.com/evandor/submodule-suggestions.git src/suggestions
git submodule add -b localstorage https://github.com/evandor/submodule-tabsets.git src/tabsets
git submodule add -b localstorage https://github.com/evandor/submodule-thumbnails.git src/thumbnails
git submodule add -b main https://github.com/evandor/submodule-ui.git src/ui
git submodule add -b main https://github.com/evandor/submodule-windows.git src/windows

```

if you run into problems (e.g. src/bookmarks already exists, but is empty), run this:

```
rm src/bookmarks
git rm --cached src/bookmarks
```

```bash
yarn install
```

or

```bash
npm install
```

### Start the app in development mode

```bash
quasar dev -m bex
```

and add to chrome as local extension:

see https://quasar.dev/quasar-cli-vite/developing-browser-extensions/build-commands#chrome

## Tabsets as Chrome Extension

You can try the current version directly at

https://chrome.google.com/webstore/detail/tabsets-extension/afkknkdbgondbbfjehipnjmojndnjhjg

## Tabsets as Edge Extension

You can try the current version directly at

https://microsoftedge.microsoft.com/addons/detail/tabsets/fpgjmlhdgphgoomhjncpldnhjhklplak

## Tabsets as Firefox Extension

You can try the current version directly at

https://addons.mozilla.org/de/firefox/addon/tabsets/

## Safari

check out branch "safari-extension" (work in progress)

xcrun safari-web-extension-converter --project-location ./dist/Safari --app-name Tabsets /Users/carstengraef/projects/github/tabsets/dist/bex
