<script setup lang="ts">
defineProps<{ kind: string }>();
const base = import.meta.env.BASE_URL;
</script>

<template>
  <img
    :src="`${base}gallery/${kind}.png`"
    class="chart-thumbnail"
    width="740"
    height="440"
    alt=""
    loading="lazy"
    decoding="async"
  />
</template>
