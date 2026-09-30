<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { ChartWidget } from 'blackswan-charts';
import type { Example } from '@demo/gallery/examples';
import sceneCode from '@demo/gallery/scene?raw';
import dataCode from '@demo/gallery/data?raw';
const props = defineProps<{ example: Example }>();
const emit = defineEmits<{ reset: [] }>();
const scene = props.example.create();
const tab = ref('Example');
const copied = ref(false);
const revision = ref(0);
const code = computed(() => (tab.value === 'Example' ? props.example.code : tab.value === 'Setup' ? sceneCode : dataCode));
const canUndo = computed(() => {
  void revision.value;
  return scene.chart.isCanUndo;
});
const canRedo = computed(() => {
  void revision.value;
  return scene.chart.isCanRedo;
});
async function refresh() {
  await nextTick();
  revision.value++;
}
// Track sources again after JSON restore; also catch drags released outside the chart.
watch(
  () => scene.chart.panes.map((pane) => pane.model.dataSource),
  (sources, _previous, onCleanup) => {
    const listener = () => {
      void refresh();
    };
    sources.forEach((source) => source.addChangeEventListener(listener));
    onCleanup(() => sources.forEach((source) => source.removeChangeEventListener(listener)));
  },
  { immediate: true },
);
async function run(action: () => void) {
  action();
  await nextTick();
  revision.value++;
}
async function copy() {
  try {
    await navigator.clipboard.writeText(code.value);
    copied.value = true;
  } catch {
    copied.value = false;
  }
}
onMounted(() => scene.start?.());
onUnmounted(() => {
  scene.dispose?.();
  scene.chart.panes.forEach((pane) => pane.model.priceReference.stop());
});
</script>

<template>
  <section class="example-stage" aria-label="Interactive chart example">
    <div class="stage-toolbar">
      <span class="live-badge"><i /> INTERACTIVE EXAMPLE</span>
      <div class="stage-actions">
        <button v-for="action in scene.actions" :key="action.label" @click="run(action.run)">{{ action.label }}</button>
        <span class="toolbar-divider" />
        <button :disabled="!canUndo" @click="run(() => scene.chart.undo())">Undo</button>
        <button :disabled="!canRedo" @click="run(() => scene.chart.redo())">Redo</button>
        <button @click="emit('reset')">Reset ↺</button>
      </div>
    </div>
    <div class="chart-host" @mouseup.capture="refresh" @wheel.passive="refresh" @keydown.capture="refresh">
      <ChartWidget :chart="scene.chart" />
    </div>
    <p v-if="scene.status" class="stage-note"><output data-testid="stream-status" aria-live="off">{{ scene.status }}</output></p>
    <p class="stage-note"><span>TRY IT</span> {{ scene.note }}</p>
  </section>
  <section class="source-section" aria-label="Example source code">
    <div class="source-intro">
      <span class="eyebrow">BEHIND THE CHART</span>
      <h2>Make it yours.</h2>
      <p>The code running above. The setup and fixed sample data are included.</p>
      <p class="source-hint">
        Render the returned chart with <code>&lt;ChartWidget :chart="scene.chart" /&gt;</code> in a sized container.
      </p>
      <p v-if="scene.start || scene.dispose" class="source-hint">
        Call <code>scene.start?.()</code> on mount and <code>scene.dispose?.()</code> on unmount.
      </p>
    </div>
    <div class="code-panel">
      <div class="code-toolbar">
        <div role="tablist" aria-label="Source files">
          <button
            v-for="name in ['Example', 'Setup', 'Data']"
            :key="name"
            role="tab"
            :aria-selected="tab === name"
            @click="
              tab = name;
              copied = false;
            "
          >
            {{ name }}
          </button>
        </div>
        <button @click="copy">{{ copied ? 'Copied ✓' : 'Copy code' }}</button>
      </div>
      <pre role="tabpanel" :aria-label="tab + ' source'" tabindex="0"><code>{{ code }}</code></pre>
    </div>
  </section>
</template>
