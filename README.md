# Tabsets Extension

Browser Extension to manage tabsets:

# Features

* Turn your open tabs into a tabset
* Re-open your tabsets or tabs whenever you need them
* Edit tabsets
* Search for keywords in your tabsets
* Drag & drop tabs into tabsets
* Export and Import Tabsets Data
* Search in Tabs (experimental)
* Keep pinned and grouped tabsets (experimental)
* Thumbnails Preview (experimental)
* Dark Mode (experimental)
* All data remains on your computer - no backend communication whatsoever
* Open source

There will be a pro tabsets extension with some advanced features as well.

## Install the dependencies
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

### chrome extension link

You can try the current version directly at

https://chrome.google.com/webstore/detail/tabsets-extension/afkknkdbgondbbfjehipnjmojndnjhjg

### current versions:

#### vue --version

@vue/cli 5.0.8

#### quasar --version

@quasar/app-vite 1.6.2

## quasar info

Operating System - Darwin(22.6.0) - darwin/arm64
NodeJs - 16.20.1

Global packages
NPM - 8.19.4
yarn - 1.22.19
@quasar/cli - undefined
@quasar/icongenie - Not installed
cordova - 11.1.0

Important local packages
quasar - 2.12.7 -- Build high-performance VueJS user interfaces (SPA, PWA, SSR, Mobile and Desktop) in record time
@quasar/app-vite - 1.6.2 -- Quasar Framework App CLI with Vite
@quasar/extras - 1.16.7 -- Quasar Framework fonts, icons and animations
eslint-plugin-quasar - Not installed
vue - 3.3.4 -- The progressive JavaScript framework for building modern web UI.
vue-router - 4.2.5
pinia - 2.1.6 -- Intuitive, type safe and flexible Store for Vue
vuex - Not installed
vite - 2.9.16 -- Native-ESM powered web dev build tool
eslint - Not installed
electron - 26.2.4 -- Build cross platform desktop apps with JavaScript, HTML, and CSS
electron-packager - 17.1.2 -- Customize and package your Electron app with OS-specific bundles (.app, .exe, etc.) via JS or CLI
electron-builder - Not installed
register-service-worker - 1.7.2 -- Script for registering service worker, with hooks
@capacitor/core - Not installed
@capacitor/cli - Not installed
@capacitor/android - Not installed
@capacitor/ios - Not installed

Quasar App Extensions
@quasar/quasar-app-extension-testing-unit-vitest - 0.4.0 -- A Quasar App Extension for running tests with Vitest

## Safari

check out branch "safari-extension"

xcrun safari-web-extension-converter --project-location ./dist/Safari --app-name Tabsets ./dist/bex
