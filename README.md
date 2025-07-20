# Tabsets Extension

Browser Extension to manage tabsets and bookmarks

# Developer Documentation

https://evandor.github.io/tabsets/

# User Documentation

https://docs.tabsets.net

## Quick setup

```bash
git clone --recurse-submodules -j8 https://github.com/evandor/tabsets.git
yarn install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

### Lint the files

```bash
yarn lint
# or
npm run lint
```

### Format the files

```bash
yarn format
# or
npm run format
```

### Build the app for production

```bash
quasar build
```

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).

### check dependencies

[main branch](https://npmgraph.js.org/?q=https%3A%2F%2Fraw.githubusercontent.com%2Fevandor%2Ftabsets%2Frefs%2Fheads%2Fmain%2Fpackage.json)

### debugging (not yet working)

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9229 --user-data-dir=/Users/carstengraef/projects/debug/chrome-profile

## Styling and Colors

### Using HSL Colors

HSL (Hue, Saturation, Lightness) is a color model used in the project for defining colors. The format is:

```css
hsl(hue, saturation%, lightness%)
```

Where:
- **Hue**: A degree on the color wheel (from 0 to 360) - 0 (or 360) is red, 120 is green, 240 is blue
- **Saturation**: A percentage value (0% to 100%) - 0% is a shade of gray, 100% is the full color
- **Lightness**: A percentage value (0% to 100%) - 0% is black, 100% is white, 50% is the "normal" color

Examples:
- Black: `hsl(0, 0%, 0%)`
- White: `hsl(0, 0%, 100%)`
- Red: `hsl(0, 100%, 50%)`
- Green: `hsl(120, 100%, 50%)`
- Blue: `hsl(240, 100%, 50%)`

To use HSL colors in the project:

1. In SCSS files (like quasar.variables.scss):
   ```scss
   $color-name: hsl(hue, saturation%, lightness%);
   ```

2. In Vue components (inline styles):
   ```javascript
   const colorStyle = 'color: hsl(' + hue + ', ' + saturation + '%, ' + lightness + '%)';
   ```
