export class Annotation {
  constructor(
    public id: string,
    public selection: any,
    public text: string | undefined,
    public rect: object,
    public viewport: object,
    public title: string,
    public comment: string | undefined = undefined,
    public color: string = 'grey',
  ) {}
}
