import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";

export class Field {

  constructor(
    public id: string,
    public name: string,
    public type: string,
    public label: string,
    public value: string | number | undefined = undefined,
    public info: string | undefined = undefined,
    public reference: string | undefined = undefined,
    public substitution: string | undefined = undefined
  ) {

  }
}

export class Entity {

  public description: string = ''
  public schema: string = ''
  public items: object[] = []
  public fields: Field[] = []
  public labelField: string | undefined = undefined
  public source: string | undefined
  public jsonPath: string | undefined

  constructor(
    public id: string,
    public name: string
  ) {
    this.name = name.replaceAll(STRIP_CHARS_IN_USER_INPUT, '')
  }

}
