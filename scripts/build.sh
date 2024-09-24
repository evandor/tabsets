#!/bin/bash
VERSION="$1"
if [ $# -eq 0 ]
  then
    echo "run with 'chrome', 'firefox', 'edge' or 'opera' as parameter"
    exit
fi

if [ "$1" = "chrome" ]; then
  manifest="manifest-chrome.json"
  envfile=".dev"
elif [ "$1" = "firefox" ]; then
  manifest="manifest-firefox.json"
  envfile=".dev"
elif [ "$1" = "edge" ]; then
  manifest="manifest-edge.json"
  envfile=".edge.env"
elif [ "$1" = "opera" ]; then
  manifest="manifest-opera.json"
  envfile=".opera.dev"
fi

echo "using manifest src-bex/$manifest and $envfile"
mv src-bex/manifest.json src-bex/manifest.tmp
mv .env .env.tmp

cp src-bex/$manifest src-bex/manifest.json
cp $envfile .env

quasar build -m bex

echo "output folder dist/bex-$1"
cp -R dist/bex/ "dist/bex-$1/"

mv src-bex/manifest.tmp src-bex/manifest.json
mv .env.tmp .env
