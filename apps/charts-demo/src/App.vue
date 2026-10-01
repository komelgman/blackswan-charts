<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { examples, historyExample, repositoryUrl } from '@demo/gallery/examples';
import ExampleView from '@demo/gallery/ExampleView.vue';
import ChartThumbnail from '@demo/gallery/ChartThumbnail.vue';
import '@demo/gallery/gallery.css';
const route = ref(location.hash.slice(1));
const category = ref('All examples');
const query = ref('');
const version = ref(0);
const current = computed(() => [...examples, historyExample].find((example) => route.value === `/examples/${example.id}`));
const invalidRoute = computed(() => route.value !== '' && route.value !== '/' && !current.value);
const filtered = computed(() =>
  examples.filter(
    (example) =>
      (category.value === 'All examples' || example.category === category.value) &&
      `${example.title} ${example.description} ${example.tags.join(' ')}`.toLowerCase().includes(query.value.toLowerCase()),
  ),
);
const onRoute = () => {
  route.value = location.hash.slice(1);
  version.value = 0;
  window.scrollTo(0, 0);
};
onMounted(() => window.addEventListener('hashchange', onRoute));
onUnmounted(() => window.removeEventListener('hashchange', onRoute));
watch(
  current,
  (value) => {
    document.title = `${value?.title ?? 'Gallery'} · Blackswan Charts`;
  },
  { immediate: true },
);
</script>

<template>
  <div class="site-shell">
    <header class="site-header">
      <a class="brand" href="#/" aria-label="Blackswan gallery"
        ><svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M5 24c12 4 20-2 17-9-1-3-6-4-4-8 1-2 4-2 7-1l-3 3c-3-1-3 1-1 2 8 5 5 16-7 17Z" fill="currentColor" /></svg
        >BLACKSWAN<span>CHARTS</span></a
      >
      <a :href="repositoryUrl" class="header-link" target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a>
    </header>
    <main>
      <template v-if="current">
        <a class="back-link" href="#/">← All examples</a>
        <header class="detail-heading">
          <div>
            <span class="eyebrow">{{ current.category }} / {{ current.id }}</span>
            <h1>{{ current.title }}</h1>
            <p>{{ current.description }}</p>
          </div>
          <div class="tag-list">
            <span v-for="tag in current.tags" :key="tag">{{ tag }}</span>
          </div>
        </header>
        <ExampleView :key="current.id + version" :example="current" @reset="version++" />
        <nav class="more-examples" aria-label="More examples">
          <span class="eyebrow">KEEP EXPLORING</span>
          <a
            v-for="example in examples.filter((item) => item.id !== current?.id).slice(0, 3)"
            :key="example.id"
            :href="`#/examples/${example.id}`"
            >{{ example.title }} <span>↗</span></a
          >
        </nav>
      </template>
      <div v-else-if="invalidRoute" class="empty-state">
        <h1>Example not found.</h1>
        <a href="#/">Return to the gallery →</a>
      </div>
      <template v-else>
        <section class="gallery-intro">
          <div>
            <span class="eyebrow">THE EXAMPLE COLLECTION / 01—07</span>
            <h1>Charts with<br /><em>room to explore.</em></h1>
          </div>
          <div class="intro-aside">
            <span class="intro-rule" />
            <p>A canvas for market data.<br />Explore scales, drawing tools and connected views. Open an example. Make a move.</p>
            <a href="#/examples/candles">Start with price & volume <span>↗</span></a>
          </div>
        </section>
        <div class="gallery-controls">
          <div class="category-list" aria-label="Categories">
            <button
              v-for="name in ['All examples', 'Market', 'Composition', 'Interaction']"
              :key="name"
              :class="{ active: category === name }"
              :aria-pressed="category === name"
              @click="category = name"
            >
              {{ name }}
            </button>
          </div>
          <label class="search-field"
            ><span>⌕</span><input v-model="query" type="search" placeholder="Find an example" aria-label="Find an example"
          /></label>
        </div>
        <div class="collection-meta">
          <span>{{ filtered.length }} EXAMPLES</span><span>LIVE CHARTS · SOURCE INCLUDED</span>
        </div>
        <section class="example-grid" aria-label="Chart examples">
          <a v-for="example in filtered" :key="example.id" class="example-card" :href="`#/examples/${example.id}`">
            <div class="card-preview">
              <span class="card-number">{{ String(examples.indexOf(example) + 1).padStart(2, '0') }}</span>
              <ChartThumbnail :kind="example.id" /><span class="preview-open">Explore ↗</span>
            </div>
            <div class="card-caption">
              <span class="eyebrow">{{ example.category }}</span>
              <h2>{{ example.title }}<span>↗</span></h2>
              <p>{{ example.description }}</p>
            </div>
          </a>
        </section>
        <div v-if="!filtered.length" class="empty-state">
          <h2>No examples found.</h2>
          <button
            @click="
              query = '';
              category = 'All examples';
            "
          >
            Clear filters
          </button>
        </div>
        <aside class="gallery-footnote">
          <span>BUILT TO BE EXPLORED</span>
          <p>Every example uses reproducible, synthetic data. No account, connection or market feed required.</p>
        </aside>
      </template>
    </main>
    <footer class="site-footer">
      <span>BLACKSWAN CHARTS</span><span>Data. Geometry. Possibility.</span><a href="#/">Back to collection ↑</a>
    </footer>
  </div>
</template>
