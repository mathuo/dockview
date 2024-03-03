<script setup>
import TestComponent from './testComponent.vue';
</script>

<template>
  <div class="about">
    <h1>This is a test page</h1>
    <TestComponent/>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
