<script lang="ts">
import { defineAsyncComponent, h, toRaw } from 'vue';
import type { VNode } from 'vue';
import { Options, Vue } from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import type AsyncMountOptions from './AsyncMountOptions';

@Options({
  components: { },
})
export default class ComponentWithAsyncChildren extends Vue {
  // it works from component testing
  // in case when we didn't use playwright component testing we can use dynamic import
  private modules = toRaw(import.meta.glob('@/components/**/*.vue'));

  @Prop()
  private options!: AsyncMountOptions;
  private component: any;
  private props: any;

  created(): void {
    this.importComponent();
  }

  @Watch('options')
  private importComponent(): void {
    if (this.options === undefined) {
      return;
    }

    console.log('modules', this.modules);
    // @ts-ignore
    this.component = defineAsyncComponent(this.modules[`/src/components/${this.options.component}.vue`]);
    this.props = this.options.props;
  }

  render(): VNode {
    const { component, props } = this;
    return h(component, props);
  }
}
</script>
