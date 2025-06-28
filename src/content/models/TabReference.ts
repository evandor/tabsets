export enum TabReferenceType {
  RSS = 'RSS',
  OPEN_GRAPH = 'OPEN_GRAPH',
  OPEN_SEARCH = 'OPEN_SEARCH',
  META_DATA = 'META_DATA',
  LINKING_DATA = 'LINKING_DATA',
  READING_MODE = 'READING_MODE',
  ANCHOR = 'ANCHOR',
  PARENT_CHAIN = 'PARENT_CHAIN',
  SOURCE = 'SOURCE',
  DOCUMENTATION = 'DOCUMENTATION',
}

export type TabReferenceStatus = 'NEW' | 'IGNORED' | 'APPLIED'

export class TabReference {
  constructor(
    public id: string,
    public type: TabReferenceType,
    public title: string,
    public data: object[] = [],
    public href?: string,
    public status: TabReferenceStatus = 'NEW',
  ) {}
}
