<script lang="tsx">
import { SimpleMenuItemModel } from '@/components/context-menu/ContextMenuOptions';
import { VNode } from 'vue';
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

@Options({
  components: {},
})
export default class SimpleMenuItem extends Vue {
  @Prop()
  private model!: SimpleMenuItemModel;

  private onKeyPress(e: KeyboardEvent): void {
    if (e.code === 'Enter' || e.code === 'Space') {
      if ((e.target as any).click !== undefined) {
        (e.target as any).click();
      }
    }
  }

  private renderIcon(): VNode | null {
    return null;
  }

  render(): VNode {
    return (
      <li
        tabindex="0"
        class="simple-menu-item"
        style={this.model.style}
        onClick={() => this.model.onclick()}
        onKeypress={this.onKeyPress}
      >
        {this.renderIcon()}
        {this.model.title}
      </li>
    );
  }
}
</script>

<style lang="scss">
.simple-menu-item {
  display: block;
  cursor: pointer;
  padding: 5px;
  list-style-type: none;
  white-space: nowrap;
  outline: none;

  &:hover {
    background-color: var(--menu-background-color-on-hover);
  }

  &:focus {
    background-color: var(--menu-background-color-on-hover);
  }
}
</style>
