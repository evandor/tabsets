if [ -z "$1" ]
  then echo "please call with version tag like 'tagRelease.sh v0.5.8'"
fi

git submodule foreach git tag -m "new release" $1
git tag -a $1 -m "new release"
git submodule foreach git push origin --tags
git push origin --tags
