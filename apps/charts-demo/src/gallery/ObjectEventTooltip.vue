<script setup lang="ts">
import type { ObjectEventDetails } from '@demo/gallery/types';

defineProps<{ event?: ObjectEventDetails }>();
</script>

<template>
  <aside
    v-if="event"
    class="object-event-tooltip"
    role="status"
    aria-live="polite"
    data-testid="object-event-tooltip"
    :style="{ '--event-x': `${event.x + 14}px`, '--event-y': `${event.y + 14}px` }"
  >
    <header><strong>{{ event.drawingType }}</strong><span>{{ event.event }}</span></header>
    <dl>
      <dt>Source</dt><dd>{{ event.sourceId }}</dd>
      <dt>Object</dt><dd>{{ event.drawingId }}</dd>
      <template v-if="event.handle">
        <dt>Handle</dt><dd>{{ event.handle }}</dd>
      </template>
    </dl>
  </aside>
</template>

<style scoped>
.object-event-tooltip {
  position: absolute;
  z-index: 3;
  left: clamp(8px, var(--event-x), calc(100% - 208px));
  top: clamp(8px, var(--event-y), calc(100% - 160px));
  box-sizing: border-box;
  width: 200px;
  max-width: calc(100% - 16px);
  padding: 12px 14px;
  border: 1px solid #415358;
  border-radius: 4px;
  background: #17272c;
  color: #f1f3ec;
  box-shadow: 0 8px 24px #0003;
  pointer-events: none;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.5;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #415358;
}
header span {
  color: #e2b77c;
  font-family: monospace;
}
dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 12px;
  margin: 8px 0 0;
}
dt { color: #9aafb4; }
dd {
  margin: 0;
  overflow-wrap: anywhere;
  font-family: monospace;
}
</style>
