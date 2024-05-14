# Tabsets Extension

Browser Extension to manage tabsets and bookmarks

## Checkout

```
git clone https://github.com/evandor/tabsets.git
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
git submodule add -b chrome-extension https://github.com/evandor/submodule-bookmarks.git src/bookmarks
git submodule add -b main https://github.com/evandor/submodule-windows.git src/windows
git submodule add -b main https://github.com/evandor/submodule-suggestions.git src/suggestions
git submodule add -b main https://github.com/evandor/submodule-thumbnails.git src/thumbnails
git submodule add -b main https://github.com/evandor/submodule-content.git src/content
git submodule add -b main https://github.com/evandor/submodule-features.git src/features
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
