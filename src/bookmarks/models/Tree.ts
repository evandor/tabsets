export class TreeNode {
  public header = 'node'

  constructor(
    public id: string,
    public title: string,
    public label: string,
    public url: string | undefined,
    public icon: string,
    public children: TreeNode[],
    public level: number = 0,
    public subFoldersCount = 0,
    public subNodesCount = 0,
  ) {}

  public getHeader() {
    return this.level > 0 ? (this.children.length > 0 ? 'node' : 'leaf') : 'root'
  }
}

TreeNode.prototype.toString = function treeNodeToString() {
  return `TreeNode: {title=${this.title}, url=${this.url}, #children=${this.children.length}, #folders=${this.subFoldersCount}, #nodes=${this.subNodesCount}}`
}
