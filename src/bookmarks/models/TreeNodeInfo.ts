import { TreeNode } from 'src/bookmarks/models/Tree'

export class TreeNodeInfo {
  constructor(
    public treeNode: TreeNode | undefined = undefined,
    public folderCount: number,
    public leafCount: number,
  ) {}
}
