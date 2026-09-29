/// <reference types="vite/client" />

// Fallback for TypeScript tools without Vue SFC support. vue-tsc resolves the
// actual component types and remains the authoritative component type check.
declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent;
  export default component;
}
