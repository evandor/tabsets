if [ -z "$1" ]
  then echo "please call with version tag like 'tagRelease.sh v0.5.8'"
fi

git submodule foreach git tag -m "new release" $1
git tag -a $1 -m "new release"
git submodule foreach git push origin --tags
git push origin --tags

# https://skysail-dk.sentry.io/releases/?environment=DEV&environment=prod&environment=production&project=4507939968974928&statsPeriod=14d
#curl -sL https://sentry.io/get-cli/ | bash

# Setup configuration values
#SENTRY_AUTH_TOKEN=
#SENTRY_ORG=skysail-dk
#SENTRY_PROJECT=tabsets
#VERSION=`sentry-cli releases propose-version`

# Workflow to create releases
#echo $SENTRY_PROJECT
#sentry-cli releases new "$VERSION"
#sentry-cli releases set-commits "$VERSION" --auto
#sentry-cli releases finalize "$VERSION"
