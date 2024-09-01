#!/bin/bash
VERSION="$1"
if [ $# -eq 0 ]
  then
    echo "run with 'chrome', 'firfox', 'edge' or 'opera' as parameter"
    exit
fi

if [ "$1" = "chrome" ]; then
  manifest="manifest-chrome.json"
elif [ "$1" = "firefox" ]; then
  manifest="manifest-firefox.json"
elif [ "$1" = "edge" ]; then
  manifest="manifest-edge.json"
elif [ "$1" = "opera" ]; then
  manifest="manifest-opera.json"
fi

echo "using manifest src-bex/$manifest and .dev.env"
mv src-bex/manifest.json src-bex/manifest.tmp
mv .env .env.tmp

cp src-bex/$manifest src-bex/manifest.json
cp .dev.env .env

quasar build -m bex

echo "output folder dist/bex-$1"
cp -R dist/bex/ "dist/bex-$1/"

mv src-bex/manifest.tmp src-bex/manifest.json
mv .env.tmp .env
