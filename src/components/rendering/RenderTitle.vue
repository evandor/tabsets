<template>
  <render />
</template>
<script lang="ts" setup>
import {h, RendererElement, RendererNode, VNode} from 'vue';
import {Rendering} from "src/models/EntityDefinition";
import _ from "lodash"

const props = defineProps({
  data: {type: Object, required: true},
  definition: {type: Object, default: {"tag": "div", "props": {}, "child": "name"}}
})

function renderInternal(tag: string, properties: object, child: string | undefined, children: Rendering[]): VNode<RendererNode, RendererElement, {}> {
  if (child) {
    console.log("rendering child ", child, props.data)
    return h(tag,properties,props.data.data[child as keyof object]);
  } else {
    const subs = _.map(children, c => {
      return renderInternal(c.tag, c.props, c.child, c.children)
    })
    console.log("subs", subs)
    return h(tag,properties,subs);
  }
}

const render = () => {
  console.log("hier, render", props.data)
  console.log("hier2, render", props.definition)

  const rendering: Rendering = props.definition as unknown as Rendering
  return renderInternal(rendering.tag, rendering.props, rendering.child , rendering.children)

  //return h('div',props.data.data.note)
};

// const jsxNode = () => {
//   return <div> text </div>;
// };
</script>
