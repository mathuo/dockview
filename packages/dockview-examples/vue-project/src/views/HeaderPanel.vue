<script setup lang="ts">
import type { DockviewApi, DockviewPanelApi } from 'dockview-core';

const props = defineProps<{api: DockviewPanelApi, containerApi: DockviewApi, params:{ time:number}}>();

</script>

<template>
  <div style="width:100px;height:100%">
    <div>hi</div>
  </div>
</template>
