
export class DerivedFrom {
  constructor(
    public ident: string,
    public xpath: string,

  ) {
  }
}


export class Field {
  constructor(
    public ident: string,
    public hint: string,
    public type: string,
    public required: boolean,
    public value: string,

    public derivedFrom: DerivedFrom
  ) {
  }
}

export class Rendering {
  constructor(
    public tag: string = "div",
    public props: object = {},
    public child: string | undefined = undefined,
    public children: Rendering[] = []

  ) {
  }
}

export class EntityDefinition {
  constructor(
    public name: string,
    public type: string,
    public icon: string = "tab",
    public version: string,
    public active: boolean,
    public fields: Field[],
    public render: Rendering
  ) {
  }

}
