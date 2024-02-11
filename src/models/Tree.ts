export class TreeNode {

  header: string;

  constructor(
    public id: string,
    public title: string,
    public label: string,
    public url: string | undefined,
    public icon: string,
    public children: TreeNode[],
    public subFoldersCount = 0,
    public subNodesCount = 0) {
    // this.header = children.length > 0 ? 'node' : 'leaf'
    this.header = !url ? 'node' : 'leaf'

  }


}
