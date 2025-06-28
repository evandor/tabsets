```typescript
import WindowsMarkupTable from "src/windows/components/WindowsMarkupTable.vue";

<!-- (...) -->

<WindowsMarkupTable
  :rows="useWindowsStore().getWindowsForMarkupTable(additionalActions)"
  @was-clicked="e => additionalActionWasClicked(e)"
  @recalculate-windows="windowRows = calcWindowRows()"
  :key="randomKey"
/>
```

Additional Actions can be defined like an array of WindowActions:

```typescript
new WindowAction('o_bookmark_add', 'saveTabset', 'text-orange', 'Save as Tabset')
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
