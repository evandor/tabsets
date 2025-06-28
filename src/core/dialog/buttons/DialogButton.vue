<template>
  <q-btn
    :type="props.type"
    class="cursor-pointer"
    :outline="!defaultAction"
    padding="xs lg"
    :disable="props.disable"
    @click="emits('wasClicked')"
    align="around"
    size="sm"
    data-testid="addTabsetSubmitBtn"
    :color="props.color"
    :text-color="props.textColor"
    :label="props.label"
    v-close-popup />
</template>

<script lang="ts" setup>
const emits = defineEmits(['wasClicked'])

type Props = {
  label: string
  color?: string
  textColor?: string | undefined
  type?: string
  disable?: boolean
  defaultAction?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  type: 'button',
  disable: false,
  defaultAction: false,
})
</script>
