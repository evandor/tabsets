import { Tabset } from 'src/tabsets/models/Tabset'

export class SaveOrReplaceResult {
  constructor(
    public replaced: boolean,
    public tabset: Tabset,
    public merged: boolean,
  ) {}
}
