
<script>
import { defineComponent } from 'vue'
import DockviewVue from './dockviewVue';

import "dockview-core/dist/styles/dockview.css";

export default defineComponent({
  // type inference enabled
  props: {
    name: String,
    msg: { type: String, required: true }
  },
  data() {
    return {
      count: 1
    }
  },
  components: {
    "dockview-vue": DockviewVue
  },
  methods: {
    onApiReady: (params) => {
      console.log('api ready',params)
    }
  },
  mounted() {
    this.name // type: string | undefined
    this.msg // type: string
    this.count // type: number
  }
})
</script>

<template>
  <div>hello world</div>
  <dockview-vue
    style="width:100%; height:100%"
    @on-ready="onApiReady"
  />
</template>

