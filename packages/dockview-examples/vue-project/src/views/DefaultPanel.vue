<script setup lang="ts">
import type { DockviewApi, DockviewPanelApi } from 'dockview-core';
import { ref, watch } from 'vue';

const props = defineProps<{api: DockviewPanelApi, containerApi: DockviewApi, params:{ time:number}}>();

console.log(props.api, props.containerApi, props.params);

const params = ref(props.params)

watch(() => props.params,(a,b) => {
  console.log("watch",a,b);
  params.value = b
})




</script>

<template>
  <main>
    <div>hi</div>
    <div>{{ params.time }}</div>
  </main>
</template>
