<script setup lang="ts">
import { computed } from 'vue';
import { marketData } from '@demo/gallery/data';
defineProps<{ kind: string }>();
const bars = marketData().values.filter((_, i) => i % 3 === 0);
const y = (value: number) => 178 - (value - 90) * 2.1;
const trace = computed(() => bars.map((bar, i) => `${i * 8 + 22},${y(bar[3])}`).join(' '));
</script>
<template>
  <svg viewBox="0 0 370 220" class="chart-thumbnail" aria-hidden="true">
    <path d="M20 40H350M20 85H350M20 130H350M20 175H350M70 20V200M150 20V200M230 20V200M310 20V200" class="thumbnail-grid" />
    <g v-if="kind === 'scales'">
      <polyline :points="trace" fill="none" stroke="#68c5b3" stroke-width="2" />
      <path d="M24 173 Q165 143 337 48" fill="none" stroke="#e2b77c" stroke-width="2" stroke-dasharray="4 5" />
      <text x="277" y="184">+48.2%</text>
    </g>
    <g v-else>
      <g v-for="(bar, i) in bars" :key="i" :stroke="bar[3] >= bar[0] ? '#68c5b3' : '#d68078'">
        <path :d="`M${i * 8 + 22} ${y(bar[1])}V${y(bar[2])}`" />
        <path :d="`M${i * 8 + 22} ${y(bar[0])}V${y(bar[3])}`" stroke-width="4" />
        <path
          v-if="kind === 'candles' || kind === 'panes'"
          :d="`M${i * 8 + 22} 204v-${(bar[4] ?? 0) / 13}`"
          stroke-width="4"
          opacity=".35"
        />
      </g>
      <g v-if="['drawings', 'history', 'shared'].includes(kind)" stroke="#e2b77c">
        <path d="M20 112H350" stroke-width="1.5" :stroke-dasharray="kind === 'history' ? '5 4' : undefined" />
        <circle cx="183" cy="112" r="4" fill="#111c22" />
      </g>
      <g v-if="kind === 'channel'" stroke="#e2b77c" fill="#111c22">
        <path d="M53 165L303 85L303 45L53 125Z" fill="#e2b77c" fill-opacity=".07" stroke="none" />
        <path d="M53 165L303 85M53 125L303 45" stroke-width="1.5" />
        <circle cx="53" cy="165" r="3" />
        <circle cx="303" cy="85" r="3" />
        <circle cx="178" cy="85" r="3" />
      </g>
      <g v-if="kind === 'drawings'"><path d="M70 166L294 70M250 25V200" stroke="#8faee0" fill="none" /></g>
      <g v-if="kind === 'shared'">
        <path d="M20 180H350" stroke="#e2b77c" stroke-dasharray="3 3" />
        <path d="M183 126V167m-4-5 4 5 4-5" fill="none" stroke="#e2b77c" />
      </g>
      <g v-if="kind === 'history'">
        <path d="M275 166a18 18 0 1 0 0 24m0-24v12h-12" fill="none" stroke="#e2b77c" stroke-width="2" />
      </g>
    </g>
  </svg>
</template>
