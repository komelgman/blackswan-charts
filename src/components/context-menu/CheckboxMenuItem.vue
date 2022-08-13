<script lang="tsx">
import { Options, Vue } from 'vue-class-component';
import { VNode } from 'vue';
import { Prop } from 'vue-property-decorator';
import { CheckboxMenuItemModel } from '@/components/context-menu/ContextMenuOptions';

@Options({
  components: { },
})
export default class CheckboxMenuItem extends Vue {
  @Prop()
  private model!: CheckboxMenuItemModel;

  private onKeyPress(e: KeyboardEvent): void {
    if (e.code === 'Enter' || e.code === 'Space') {
      if ((e.target as any).click !== undefined) {
        (e.target as any).click();
      }
    }
  }

  render(): VNode {
    return (
      <li
        tabindex="0"
        class="checkbox-menu-item"
        style={this.model.style}
        onMousedown={() => this.model.onclick()}
        onKeypress={this.onKeyPress}
      >
          {this.model.checked ? <span class="tickmark">&#x2714;</span> : null}
          {this.model.title}
      </li>
    );
  }
}
</script>

<style lang="scss" scoped>
.checkbox-menu-item {
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

.tickmark {
  position: absolute;
  left: 5px;
  display: block;
  width: 21px;
  height: 21px;
  text-align: center;
}
</style>
