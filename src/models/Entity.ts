import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";

export class Entity {

  public description: string = ''
  public schema: string = ''
  public items: object[] = []

  constructor(
    public id: string,
    public name: string
  ) {
    this.name = name.replaceAll(STRIP_CHARS_IN_USER_INPUT, '')
  }

}
