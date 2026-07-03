<script setup lang="ts">
import type { VueMountEntry } from './utils';

/**
 * Renders every registered component into its target element via `<Teleport>`.
 *
 * Hosts (`dockview.vue`, `splitview.vue`, ...) render this component as a child
 * so each teleported panel stays a true descendant in the Vue component tree.
 * That ancestry is what makes `<keep-alive>` (`onActivated`/`onDeactivated`),
 * `provide`/`inject`, `<Suspense>` and error boundaries work for panels, while
 * dockview keeps full control of where the DOM physically lives (including
 * across popout windows).
 */
defineProps<{ entries: VueMountEntry[] }>();
</script>

<template>
    <template v-for="entry in entries" :key="entry.id">
        <Teleport :to="entry.target">
            <component :is="entry.component" v-bind="entry.props.value" />
        </Teleport>
    </template>
</template>
