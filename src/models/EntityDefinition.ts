export class EntityDefinition {
  constructor(
    public name: string,
    public type: string,
    public icon: string = "tab",
    public version: string,
    public active: boolean) {
  }

}
