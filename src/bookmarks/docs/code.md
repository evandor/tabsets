# Code Overview

## Stores

The features store (stores/featuresStore.ts) keeps track of the features states. The store uses the configured
persistence to store the feature states permanently.

## Persistence

There's an interface "FeaturesPersistence"


```typescript
<!-- @include: ../../../src/features/persistence/FeaturesPersistence.ts -->
```

with two implementations, using the local storage or the browsers indexedDB respectively
