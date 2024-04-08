import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";


export class Api {

  public description: string = ''
  public schema: string = ''
  public endpoints: object[] = []
  public setup: object = {}
  public results: object[] = []

  constructor(
    public id: string,
    public name: string
  ) {
    this.name = name.replaceAll(STRIP_CHARS_IN_USER_INPUT, '')
  }

}
