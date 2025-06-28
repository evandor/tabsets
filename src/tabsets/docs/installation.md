# General

This (git) submodule is meant to be used in a quasar application like
tabsets.net.

## Installation

In tabsets.net, for example, this submodule is added like this:

```
git submodule add -b main https://github.com/evandor/submodule-tabsets.git src/tabsets
```

## Branches

### main

the default branch, used e.g. in tabsets-pro

### localstorage

a branch without firebase, to be used in local-only environments like bookmrkx
and tabsets
