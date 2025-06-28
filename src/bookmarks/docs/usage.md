```vue
  import {useFeaturesStore} from "src/features/stores/featuresStore";

  <!-- (...) -->

  <span v-if="useFeaturesStore().hasFeature(FeatureIdent.STANDALONE_APP)">
    <-- code to be used only if feature is active -->
  </span>
```

The enum FeatureIdent is provided by the hosting application (e.g. tabsets.net)

```typescript
export enum FeatureIdent {
    STANDALONE_APP = "STANDALONE_APP"
}
```

Also, in the hosting app, you have to define the "AppFeatures":

```typescript
export class AppFeatures {
  features: Feature[] = [
    new Feature(FeatureIdent.STANDALONE_APP, FeatureType.RECOMMENDED, 'Standalone App', 'o_open_in_new', ['bex'])
    //(...)
    ]
}
```

The Feature class is provided by the features submodule:

```typescript
export class Feature {

  public activateCommands: Array<Command<any>> = []
  public deactivateCommands: Array<Command<any>> = []

  constructor(
    public ident: string,
    public type: string,
    public name: string,
    public icon: string,
    public useIn: string[],
    public requires: string[] = []
  ) {
    this.activateCommands = [new ActivateFeatureCommand(this)]
    this.deactivateCommands = [new DeactivateFeatureCommand(this)]
  }

  setActivateCommands(cmds: Array<Command<any>>): Feature {
    this.activateCommands = cmds.concat(this.activateCommands)
    return this
  }

  setDeactivateCommands(cmds: Array<Command<any>>): Feature {
    this.deactivateCommands = cmds.concat(this.deactivateCommands)
    return this
  }
}
```

