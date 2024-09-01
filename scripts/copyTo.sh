#!/bin/bash
VERSION="$1"
if [ $# -eq 0 ]
  then
    echo "run with foldername"
    exit
fi

cp -r dist/bex "dist/$1"

exit 0
