
export class TreeNode {

  header: string;

  constructor(public id: string, public title: string, public label: string, public icon: string, public children: TreeNode[]) {
    this.header = children.length > 0 ? 'node' : 'leaf'

  }


}
