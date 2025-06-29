#!/bin/bash
VERSION="$1"
if [ $# -eq 0 ]
  then
    echo "run with 'chrome', 'firefox', 'edge' or 'opera' as parameter"
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

mv src-bex/manifest.json src-bex/manifest.tmp
echo "using manifest src-bex/$manifest"
cp src-bex/$manifest src-bex/manifest.json
quasar dev -m bex
#echo "output folder dist/bex-$1"

# does not seem to be executed..., commenting out
#cp -r dist/bex "dist/bex-$1"
#mv src-bex/manifest.tmp src-bex/manifest.json

exit 0
