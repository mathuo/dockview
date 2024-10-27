
<script setup lang="ts">
import type { VNodeType } from './types';
const props = defineProps<{
  items: VNodeType[]
}>();
</script>

<template>
 <Teleport v-for="item in props.items" :key="item.key" :to="item.target">
  <component :is="item.component" :=item.props></component>
 </Teleport>
</template>
