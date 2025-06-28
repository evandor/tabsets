export class TabsetForSpace {
  constructor(
    public identifier: string,
    public tabsets: string[],
  ) {}
}

export class SpaceToTabsetsMap {
  data: TabsetForSpace[] = []

  get(spaceId: string | undefined): string[] {
    const space = spaceId ? spaceId : 'nospace'
    const l = this.data.filter((t: TabsetForSpace) => t.identifier === space)
    return l.length > 0 ? l[0]!.tabsets : []
  }

  set(spaceId: string | undefined, list: string[]) {
    const space = spaceId ? spaceId : 'nospace'
    let l = this.data.filter((t: TabsetForSpace) => t.identifier === space)
    if (l.length > 0) {
      l[0] = new TabsetForSpace(space, list)
    } else {
      this.data.push(new TabsetForSpace(space, list))
    }
  }
}
