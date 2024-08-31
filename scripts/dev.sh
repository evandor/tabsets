#!/bin/bash
VERSION="$1"
if [ $# -eq 0 ]
  then
    echo "run with 'chrome', 'firfox', 'edge' or 'opera' as parameter"
    exit
fi

if [ "$1" = "chrome" ]; then
  manifest="manifest.json"
elif [ "$1" = "firefox" ]; then
  manifest="manifest-firefox.json"
elif [ "$1" = "edge" ]; then
  manifest="manifest-edge.json"
elif [ "$1" = "opera" ]; then
  manifest="manifest-opera.json"
fi

mv src-bex/manifest.json src-bex/manifest.tmp
cp src-bex/$manifest src-bex/manifest.json
quasar dev -m bex
mv src-bex/manifest.tmp src-bex/manifest.json
