import { dragContext } from '@he-tree/vue'
import _ from 'lodash'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { Space } from 'src/spaces/models/Space'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { DeleteTabsetFolderCommand } from 'src/tabsets/commands/DeleteTabsetFolderCommand'
import { SelectTabsetCommand } from 'src/tabsets/commands/SelectTabsetCommand'
import { Tabset, TabsetStatus, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useRouter } from 'vue-router'

export type NodeTreeObject = {
  text: string
  id: string
  tsId: string
  level: number
  path: string
  url: string
  children: NodeTreeObject[]
  type: TabsetType
}

export function useTabsetsFunctions() {
  const router = useRouter()

  const ondrop2 = (evt: any) => {
    const dragged = dragContext?.dragNode?.data
    const draggedTo = dragContext.targetInfo?.parent?.data
    console.log('dragged: ', dragged)
    // console.log("over2: ", dragContext?.dragNode?.dragNode)
    console.log('over', draggedTo)
    // console.log("===>", dragContext.targetInfo)
    if (dragged && draggedTo) {
      console.log(
        `moving ${dragged.text} (${dragged.id}, root=${dragged.id === dragged.tsId}) to ${draggedTo.text} (${draggedTo.id}) root=${draggedTo.id === draggedTo.tsId}`,
      )

      if (dragged.id === dragged.tsId && draggedTo.id === draggedTo.tsId) {
        // two roots
        console.log('dragging root to root')
        const beingDraggedTs: Tabset | undefined = useTabsetsStore().getTabset(dragged.id)
        const beingDraggedToTs: Tabset | undefined = useTabsetsStore().getTabset(draggedTo.id)
        if (beingDraggedTs && beingDraggedToTs) {
          beingDraggedTs.folderActive = undefined
          beingDraggedTs.folderParent = beingDraggedToTs.id
          beingDraggedToTs.folders.push(beingDraggedTs)
          useTabsetsStore().saveTabset(beingDraggedToTs)
          useTabsetsStore().deleteTabset(beingDraggedTs.id)
        }
      } else if (dragged.id !== dragged.tsId && draggedTo.id === draggedTo.tsId) {
        // dragging non-root to root
        console.log('dragging non-root to root, no-op')
      } else if (dragged.id !== dragged.tsId && draggedTo.id !== draggedTo.tsId) {
        // dragging non-root to non-root
        console.log('dragging non-root to non-root')
        const draggedTabset: Tabset | undefined = useTabsetsStore().getTabset(dragged.tsId)
        const draggedToTabset: Tabset | undefined = useTabsetsStore().getTabset(draggedTo.tsId)
        if (draggedTabset && draggedToTabset) {
          const beingDraggedFolder: Tabset | undefined = useTabsetsStore().getActiveFolder(draggedTabset, dragged.id)
          const beingDraggedToFolder: Tabset | undefined = useTabsetsStore().getActiveFolder(
            draggedToTabset,
            draggedTo.id,
          )
          if (beingDraggedFolder && beingDraggedToFolder) {
            console.log(
              `moving ${beingDraggedFolder.name} (${beingDraggedFolder.id}) to ${beingDraggedToFolder.name} (${beingDraggedToFolder.id})`,
            )

            beingDraggedFolder.folderActive = undefined
            beingDraggedFolder.folderParent = beingDraggedToFolder.id
            beingDraggedToFolder.folders.push(beingDraggedFolder)
            useTabsetsStore().saveTabset(draggedToTabset)
            useCommandExecutor().execute(new DeleteTabsetFolderCommand(draggedTabset, beingDraggedFolder))
          }
        }
      } else if (dragged.id === dragged.tsId && draggedTo.id !== draggedTo.tsId) {
        const draggedTs: Tabset | undefined = useTabsetsStore().getTabset(dragged.id)
        const draggedToTabset: Tabset | undefined = useTabsetsStore().getTabset(draggedTo.tsId)
        if (draggedTs && draggedToTabset) {
          const draggedToFolder: Tabset | undefined = useTabsetsStore().getActiveFolder(draggedToTabset, draggedTo.id)
          if (draggedToFolder) {
            draggedTs.folderActive = undefined
            draggedTs.folderParent = draggedToFolder.id
            draggedToFolder.folders.push(draggedTs)
            useTabsetsStore().saveTabset(draggedToTabset)
            useTabsetsStore().deleteTabset(draggedTs.id)
          }
        }
      } else {
        console.log('not handled yet')
      }
    } else if (dragged) {
      if (dragged.id !== dragged.tsId) {
        // dragging non-root to root
        console.log('dragging non-root to root II', dragged.id, dragged.tsId)
        const tabset: Tabset | undefined = useTabsetsStore().getTabset(dragged.tsId)
        console.log('got tabset', tabset)
        if (tabset) {
          const beingDraggedTs: Tabset | undefined = useTabsetsStore().getActiveFolder(tabset, dragged.id)
          console.log('beingDraggedTs', beingDraggedTs)
          if (beingDraggedTs) {
            beingDraggedTs.folderActive = undefined
            beingDraggedTs.folderParent = undefined
            useTabsetService().saveTabset(beingDraggedTs)
            useCommandExecutor().execute(new DeleteTabsetFolderCommand(tabset, beingDraggedTs))
          }
        }
      }
    } else {
      console.log('not handled yet II')
    }
  }

  function treeNodeFromNote(n: Tabset, rootId: string = n.id, path = '', level = 0): NodeTreeObject {
    var path = n.name + '|' + path
    return {
      text: n.name,
      id: n.id,
      tsId: rootId,
      level,
      path,
      url: chrome && chrome.runtime ? chrome.runtime.getURL(`/www/index.html#/mainpanel/notes/${n.id}`) : n.id,
      children: _.map(n.folders, (f: Tabset) => {
        return treeNodeFromNote(f, rootId, path, level + 1)
      }),
      type: n.type,
    }
  }

  const removeNonMatches = (treeData: NodeTreeObject[], filter: string): NodeTreeObject[] => {
    const res: NodeTreeObject[] = []
    for (const node of treeData) {
      if (node.children.length > 0) {
        const children: NodeTreeObject[] = []
        for (const child of node.children) {
          const res: NodeTreeObject[] = removeNonMatches([child], filter)
          if (res.length > 0) {
            children.push(...res)
          }
        }
        node.children = children
      }
      if (node.text.toLowerCase().indexOf(filter.toLowerCase()) >= 0 || node.children.length > 0) {
        res.push(node)
      }
    }
    return res
  }

  const handleTreeClick = (node: NodeTreeObject, path: string) => {
    useCommandExecutor()
      .execute(new SelectTabsetCommand(node.tsId, node.id))
      .then((res: ExecutionResult<Tabset | undefined>) => {
        useTabsetService().handleHeadRequests(useTabsetsStore().getTabset(node.tsId)!, node.id)
        return res
      })
      .then((res: ExecutionResult<Tabset | undefined>) => {
        if (res.result) {
          router.push(path)
        }
      })
  }

  const openIndicatorIcon = (stat: any) => {
    if (stat.children && stat.children.length === 0) {
      return ''
    }
    return stat.open ? 'keyboard_arrow_down' : 'chevron_right'
  }

  const getTreeData = (tabsets: Tabset[]): NodeTreeObject[] => {
    const useSpaces = useFeaturesStore().hasFeature(FeatureIdent.SPACES)
    const space = useSpacesStore().space
    return tabsets
      .filter((ts: Tabset) => ts.status !== TabsetStatus.ARCHIVED)
      .filter((ts: Tabset) => ts.type !== TabsetType.SPECIAL)
      .filter((ts: Tabset) => {
        if (useSpaces && space) {
          return ts.spaces.indexOf(space.id) >= 0
        } else if (useSpaces && !space) {
          return ts.spaces?.length === 0
        }
        return true
      })
      .map((f: Tabset) => {
        return treeNodeFromNote(f)
      })
      .sort((a, b) => a.text.localeCompare(b.text))
  }

  const getTabsetOrder = [
    function (o: Tabset) {
      return o.status === TabsetStatus.FAVORITE ? 0 : 1
    },
    function (o: Tabset) {
      return o.name?.toLowerCase()
    },
  ]

  const tabsetsForSpace = (currentSpace: Space) => {
    return _.sortBy(
      _.filter([...useTabsetsStore().tabsets.values()] as Tabset[], (ts: Tabset) => {
        if (currentSpace) {
          if (ts.spaces.indexOf(currentSpace.id) < 0) {
            return false
          }
        }
        return (
          ts.status !== TabsetStatus.DELETED && ts.status !== TabsetStatus.HIDDEN && ts.status !== TabsetStatus.ARCHIVED
        )
      }),
      getTabsetOrder,
      ['asc'],
    )
  }

  return {
    ondrop2,
    removeNonMatches,
    openIndicatorIcon,
    handleTreeClick,
    getTreeData,
    tabsetsForSpace,
  }
}
