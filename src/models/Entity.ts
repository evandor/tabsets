import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";

export class Field {

  constructor(
    public id: string,
    public name: string,
    public type: string,
    public label: string,
    public info: string | undefined,
    public reference: string | undefined
  ) {

  }
}

export class Entity {

  public description: string = ''
  public schema: string = ''
  public items: object[] = []
  public fields: Field[] = []

  constructor(
    public id: string,
    public name: string
  ) {
    this.name = name.replaceAll(STRIP_CHARS_IN_USER_INPUT, '')
  }

}
