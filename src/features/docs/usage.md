```vue
import {useFeaturesStore} from "src/features/stores/featuresStore";

<!-- (...) -->

<span v-if="useFeaturesStore().hasFeature(FeatureIdent.STANDALONE_APP)">
    <-- code to be used only if feature is active -->
  </span>
```

The enum FeatureIdent is provided by the hosting application (e.g. tabsets.net), defined
in src/models/FeatureIdent.ts:

```typescript
export enum FeatureIdent {
  STANDALONE_APP = 'STANDALONE_APP',
}
```

Also, in the hosting app, you have to define the "AppFeatures":

```typescript
export class AppFeatures {
  features: Feature[] = [
    new Feature(FeatureIdent.STANDALONE_APP, FeatureType.RECOMMENDED, 'Standalone App', 'o_open_in_new', ['bex']),
    //(...)
  ]
}
```

The Feature class is provided by the features submodule:

```typescript
<!-- @include: ../../../src/features/models/Feature.ts -->
```
