import Store from '@/store';

// https://next.vuex.vuejs.org/guide/typescript-support.html#typing-usestore-composition-function

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $store: Store;
  }
}
