
<script>
import { defineComponent,ref } from 'vue'
import DockviewVue from './dockviewVue';
import DefaultPanel from "./DefaultPanel.vue";
import AnotherPanel from "./AnotherPanel.vue";

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

      params.api.addPanel({
        id:'panel_1',
        component:"default"
      });
    }
  },
  setup(props,ctx) {

    return {
      components: {default:DefaultPanel, another:AnotherPanel},
    }
  },
})
</script>

<template>
  <div>hello world</div>
  <div>{{ valueA }}</div>
  <dockview-vue
    style="width:100%; height:100%"
    :components="components"
    @on-ready="onReady"
  />
</template>

