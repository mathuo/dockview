<template>
  <dockview-vue
    class="dockview-theme-dark"
    :columnDefs="columnDefs"
    :rowData="rowData"
  >
  </dockview-vue>
</template>

<script>
import "dockview-core/dist/styles/dockview.css";
import { DockviewVue } from 'dockview-vue';

export default {
  name: "App",
  components: {
    DockviewVue,
  },
  setup() {
    return {
      columnDefs: [
        { headerName: "Make", field: "make" },
        { headerName: "Model", field: "model" },
        { headerName: "Price", field: "price" },
      ],
      rowData: [
        { make: "Toyota", model: "Celica", price: 35000 },
        { make: "Ford", model: "Mondeo", price: 32000 },
        { make: "Porsche", model: "Boxster", price: 72000 },
      ],
    };
  },
};
</script>
