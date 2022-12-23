<script lang="tsx">
import CheckboxMenuItem from '@/components/context-menu/CheckboxMenuItem.vue';
import type { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import SimpleMenuItem from '@/components/context-menu/SimpleMenuItem.vue';
import type { EventRemover } from '@/misc/document-listeners';
import { onceDocument } from '@/misc/document-listeners';
import makeFont from '@/misc/make-font';
import type { ChartStyle } from '@/model/ChartStyle';
import type { Point } from '@/model/type-defs';
import type { CSSProperties, VNode } from 'vue';
import { reactive } from 'vue';
import { Options, Vue } from 'vue-class-component';
import { Inject } from 'vue-property-decorator';

const HIDDEN_POS: Point = { x: -10000, y: 0 };

@Options({
  components: { simpleItem: SimpleMenuItem, checkboxItem: CheckboxMenuItem },
})
export default class ContextMenu extends Vue {
  private position: Point = HIDDEN_POS;
  private items: MenuItem[] = reactive([]);
  private visible: boolean = false;
  private removeHideListener!: EventRemover;

  @Inject()
  private chartStyle!: ChartStyle;

  unmounted(): void {
    if (typeof this.removeHideListener === 'function') {
      this.removeHideListener();
    }
  }

  public show(event: MouseEvent, items: MenuItem[]): void {
    // console.debug('context menu show');

    this.items.splice(0, this.items.length, ...items);
    this.removeHideListener = onceDocument('mousedown', this.hide);
    this.visible = true;

    this.$nextTick(() => {
      this.position = this.calcPosition(event);
    });
  }

  private calcPosition(event: MouseEvent): Point {
    // console.debug('context menu calcPosition');

    const width = this.$el.clientWidth;
    const height = this.$el.clientHeight;
    const result: Point = {
      x: event.pageX,
      y: event.pageY,
    };

    if (height + result.y >= window.innerHeight + window.scrollY) {
      const targetTop = result.y - height;

      if (targetTop > window.scrollY) {
        result.y = targetTop;
      }
    }

    if (width + result.x >= window.innerWidth + window.scrollX) {
      const targetWidth = result.x - width;

      if (targetWidth > window.scrollX) {
        result.x = targetWidth;
      }
    }

    return result;
  }

  public hide(): void {
    this.visible = false;
    this.position = HIDDEN_POS;

    if (typeof this.removeHideListener === 'function') {
      this.removeHideListener();
    }
  }

  private get style(): CSSProperties {
    return {
      font: makeFont(this.chartStyle.text),
      color: this.chartStyle.text.color,
      display: this.visible ? 'block' : 'none',
      paddingLeft: '26px',
      top: `${this.position.y}px`,
      left: `${this.position.x}px`,
    };
  }

  renderItems(): VNode[] {
    return this.items.map((item) => {
      switch (item.type) {
        case 'item':
          return <simple-item model={item}/>;
        case 'checkbox':
          return <checkbox-item model={item}/>;
        default:
          return <span>error</span>;
      }
    });
  }

  render(): any {
    // console.debug('context menu render');

    return (
      <div class="context-menu" style={this.style}>
        <ul>
          {this.renderItems()}
        </ul>
      </div>
    );
  }
}
</script>

<style scoped lang="scss">
$background-color: var(--menu-background-color);

.context-menu {
  position: fixed;
  z-index: 999;
  outline: none;
  box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
  padding: 4px;
  min-width: 178px;

  background: $background-color;
}
</style>
