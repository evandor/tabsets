import {defineStore} from 'pinia';
import _ from 'lodash'
import {computed, ref, watch} from "vue";
import {Space} from "src/models/Space";
import {useTabsStore} from "stores/tabsStore";


export const useSpacesStore = defineStore('spaces', () => {

  const spaces = ref<Map<string, Space>>(new Map<string, Space>())
  const space = ref(null as unknown as Space)

  const currentFromLocalStorage = localStorage.getItem("currentSpace")

  watch(
    space,
    (spaceVal: Space) => {
      console.log("watched", spaceVal)
      if (spaceVal && spaceVal['id']) {
        localStorage.setItem("currentSpace", spaceVal['id'])
      } else {
        localStorage.removeItem("currentSpace")
      }
      useTabsStore().currentTabsetId = null as unknown as string
    }, {deep: true}
  )

  const nameExists = computed(() => {
    return (searchName: string) => {
      const spaceArray = [...spaces.value.values()]
      return _.find(spaceArray, s => s.label === searchName?.trim())
    }
  })

  function initialize() {
    //console.log("initializing spacesStore")
  }

  function addSpace(key: string, label: string): Space {
    console.log("adding space", key, label)
    const newSpace = new Space(key, label)
    spaces.value.set(key, newSpace)
    return newSpace
  }

  function putSpace(s: Space) {
    console.log("putting space", s.id, s)
    spaces.value.set(s.id, s)
    if (s.id === currentFromLocalStorage ) {
      console.log("setting current space to ", s)
      space.value = s
    }
  }

  function setSpace(spaceId: string) {
    console.log("setting space to ", spaceId)
    space.value = null as unknown as Space
    const theSpace: Space | undefined = spaces.value.get(spaceId)
    if (theSpace) {
      space.value = theSpace
    }
  }

  return {spaces, space, nameExists, initialize, addSpace, putSpace, setSpace}
})
