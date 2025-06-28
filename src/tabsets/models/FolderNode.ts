export interface FolderNodeVisitor {
  visitFolder(folder: FolderNode): void
}

export class FolderNode {
  constructor(
    public name: string,
    public id: string,
    public children: FolderNode[] = [],
  ) {}

  accept(visitor: FolderNodeVisitor): void {
    visitor.visitFolder(this)

    for (const child of this.children) {
      child.accept(visitor)
    }
  }
}
