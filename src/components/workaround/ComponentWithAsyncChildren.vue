<template>
  <component :is="component" v-bind="props"/>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, watch } from 'vue';
import type AsyncMountOptions from './AsyncMountOptions';

interface Props {
  options: AsyncMountOptions;
}

const { options } = defineProps<Props>();
const modules = import.meta.glob('@/components/**/*.vue');
const component = ref<any>(null);
const props = ref<any>(null);

watch(options, () => {
  component.value = defineAsyncComponent(modules[`/src/components/${options.component}.vue`]);
  props.value = options.props;
}, { immediate: true });
</script>
