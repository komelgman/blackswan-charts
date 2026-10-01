<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import ChartEmbed from '@demo/gallery/ChartEmbed.vue';
import ObjectEventChart from '@demo/gallery/ObjectEventChart.vue';
import integrationCode from '@demo/gallery/ChartEmbed.vue?raw';
import eventsIntegrationCode from '@demo/gallery/ObjectEventChart.vue?raw';
import tooltipCode from '@demo/gallery/ObjectEventTooltip.vue?raw';
import typesCode from '@demo/gallery/types?raw';
import { gallerySourceUrl, type Example } from '@demo/gallery/examples';
import sceneCode from '@demo/gallery/scene?raw';
import dataCode from '@demo/gallery/data?raw';
const props = defineProps<{ example: Example }>();
const emit = defineEmits<{ reset: [] }>();
const scene = props.example.create();
const createsChartDirectly = props.example.id === 'basic' || props.example.id === 'percentage';
type SourceTab = 'Example' | 'Vue' | 'Setup' | 'Data' | 'Tooltip' | 'Types';
const tab = ref<SourceTab>('Example');
const tabs = computed<SourceTab[]>(() => {
  if (createsChartDirectly) return ['Example', 'Vue', 'Data', 'Types'];
  return props.example.id === 'events'
    ? ['Example', 'Vue', 'Tooltip', 'Setup', 'Data', 'Types']
    : ['Example', 'Vue', 'Setup', 'Data', 'Types'];
});
const copied = ref(false);
const revision = ref(0);
const code = computed(() => ({
  Example: props.example.code,
  Vue: props.example.id === 'events' ? eventsIntegrationCode : integrationCode,
  Setup: sceneCode, Data: dataCode, Tooltip: tooltipCode, Types: typesCode,
})[tab.value]);
const exampleSourceUrl = `${gallerySourceUrl}/examples/${props.example.id}.ts`;
const sourceUrl = computed(() => {
  if (tab.value === 'Example') return exampleSourceUrl;
  if (tab.value === 'Vue') return `${gallerySourceUrl}/${props.example.id === 'events' ? 'ObjectEventChart' : 'ChartEmbed'}.vue`;
  if (tab.value === 'Tooltip') return `${gallerySourceUrl}/ObjectEventTooltip.vue`;
  if (tab.value === 'Types') return `${gallerySourceUrl}/types.ts`;
  return `${gallerySourceUrl}/${tab.value === 'Setup' ? 'scene' : 'data'}.ts`;
});
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
      <ObjectEventChart v-if="example.id === 'events'" :scene="scene" />
      <ChartEmbed v-else :scene="scene" />
    </div>
    <ul v-if="scene.legend" class="chart-legend" aria-label="Chart series">
      <li v-for="item in scene.legend" :key="item.label">
        <i :style="{ borderColor: item.color, borderTopStyle: item.dashed ? 'dashed' : 'solid' }" aria-hidden="true" />
        {{ item.label }}
      </li>
    </ul>
    <p v-if="scene.status" class="stage-note"><output data-testid="scene-status" aria-live="off">{{ scene.status }}</output></p>
    <p class="stage-note"><span>TRY IT</span> {{ scene.note }}</p>
  </section>
  <section class="source-section" aria-label="Example source code">
    <div class="source-intro">
      <span class="eyebrow">BEHIND THE CHART</span>
      <h2>Make it yours.</h2>
      <p>
        {{ example.learning }}
      </p>
      <a class="source-link" :href="exampleSourceUrl" target="_blank" rel="noopener noreferrer">
        View example on GitHub <span aria-hidden="true">↗</span>
      </a>
      <p class="source-hint">
        Create the scene once in Vue setup. Render <code>&lt;ChartWidget :chart="scene.chart" /&gt;</code>
        inside a container with an explicit height. The Vue tab shows the component used above.
      </p>
      <p class="source-hint">
        {{ createsChartDirectly ? 'This example creates the chart directly.' : 'Setup contains the shared chart and pane creation.' }}
        Chart appearance comes from the theme. Plot colors and drawing styles are currently required by the API.
      </p>
    </div>
    <div class="code-panel">
      <div class="code-toolbar">
        <div role="tablist" aria-label="Source files">
          <button
            v-for="name in tabs"
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
        <div class="code-actions">
          <a :href="sourceUrl" :aria-label="`Open ${tab} source on GitHub`" target="_blank" rel="noopener noreferrer">
            GitHub <span aria-hidden="true">↗</span>
          </a>
          <button @click="copy">{{ copied ? 'Copied ✓' : 'Copy code' }}</button>
        </div>
      </div>
      <pre role="tabpanel" :aria-label="tab + ' source'" tabindex="0"><code>{{ code }}</code></pre>
    </div>
  </section>
</template>
