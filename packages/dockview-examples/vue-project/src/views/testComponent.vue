
<script>
import { defineComponent,ref } from 'vue'
// import DockviewVue from '../dockview-vue/dockviewVue';
import {DockviewVue} from 'dockview-vue';
import DefaultPanel from "./DefaultPanel.vue";
import AnotherPanel from "./AnotherPanel.vue"
import HeaderPanel from './HeaderPanel.vue';

// import {AgGridVue} from "ag-grid-vue3"


import "dockview-core/dist/styles/dockview.css";


export default defineComponent({
  // type inference enabled
  props: {
    // name: String,
    // msg: { type: String, required: true }
  },
  // data() {
  //   return {
  //     // valueA: "something"
  //   }
  // },
  components: {
    "dockview-vue": DockviewVue
  },
  methods: {
    onReady: (params) => {
      console.log('api ready',params);

      const panel1 = params.api.addPanel({
        id:'panel_1',
        component:"default"
      });

      setInterval(() => {
        panel1.api.updateParameters({time: Date.now()});
      }, 5000)

      params.api.addPanel({
        id:'panel_2',
        component:"default"
      });
    }
  },
  setup(props,ctx) {

    return {
      components: {default:DefaultPanel, another:AnotherPanel},
      headerPanel:HeaderPanel
    }
  },
})
</script>

<template>
  <div>hello world</div>
  <div>{{ valueA }}</div>
  <dockview-vue
    style="width:100%; height:100%"
    class="dockview-theme-abyss"
    :components="components"
    :rightHeaderActionsComponent="headerPanel"
    @ready="onReady"
  />
</template>

