#!/bin/bash
VERSION="$1"
if [ $# -eq 0 ]
  then
    echo "run with 'edge' or 'opera' as parameter"
    exit
fi

if [ "$1" = "edge" ]; then
  echo "simply use chrome build"
elif [ "$1" = "opera" ]; then
  manifest="manifest-opera.json"
  envfile=".env.opera"


  echo "using manifest src-bex/$manifest and $envfile"
  mv src-bex/manifest.json src-bex/manifest.tmp
  mv .env .env.tmp

  cp src-bex/$manifest src-bex/manifest.json
  cp $envfile .env

  quasar build -m bex -T chrome

  #echo "output folder dist/bex-$1"
  #mkdir "dist/bex-$1"
  #cp -R dist/bex-chrome/ "dist/bex-$1/"
  #
  #mv src-bex/manifest.tmp src-bex/manifest.json
  #mv .env.tmp .env




fi

echo "using manifest src-bex/$manifest and $envfile"
mv src-bex/manifest.json src-bex/manifest.tmp
mv .env .env.tmp

cp src-bex/$manifest src-bex/manifest.json
cp $envfile .env

quasar build -m bex -T chrome

#echo "output folder dist/bex-$1"
#mkdir "dist/bex-$1"
#cp -R dist/bex-chrome/ "dist/bex-$1/"
#
#mv src-bex/manifest.tmp src-bex/manifest.json
#mv .env.tmp .env
