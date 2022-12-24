import type { Directive, DirectiveBinding } from 'vue';
import type ContextMenu from '@/components/context-menu/ContextMenu.vue';
import type { ContextMenuOptionsProvider } from '@/components/context-menu/ContextMenuOptions';

type ContextMenuDirectiveEl = Element;
type ContextMenuDirectiveValue = { model: ContextMenuOptionsProvider, instance: ContextMenu };
type ContextMenuDirectiveBinding = DirectiveBinding<ContextMenuDirectiveValue>;

class ContextMenuDirective {
  private readonly handlers = new Map<ContextMenuDirectiveEl, EventListener>();

  private bind(el: ContextMenuDirectiveEl, binding: ContextMenuDirectiveBinding): void {
    const contextMenu = binding.value.instance;
    const handler = (event: Event): void => {
      if (!(event instanceof MouseEvent) || !(event.target instanceof Element)) {
        return;
      }

      const rect: DOMRect = event.target.getBoundingClientRect();

      event.preventDefault();
      if (contextMenu != null) {
        contextMenu.show(event, binding.value.model.contextmenu({
          x: event.pageX - rect.left,
          y: event.pageY - rect.top,
        }));
      }
    };

    el.addEventListener('contextmenu', handler);
    this.handlers.set(el, handler);
  }

  private rebind(el: ContextMenuDirectiveEl, binding: ContextMenuDirectiveBinding): void {
    this.unbind(el);
    this.bind(el, binding);
  }

  private unbind(el: ContextMenuDirectiveEl): void {
    if (this.handlers.has(el)) {
      const handler: EventListener = this.handlers.get(el) as EventListener;
      el.removeEventListener('contextmenu', handler);
      this.handlers.delete(el);
    }
  }

  build(): Directive<ContextMenuDirectiveEl, ContextMenuDirectiveValue> {
    return {
      deep: true,
      mounted: this.bind.bind(this),
      updated: this.rebind.bind(this),
      beforeUnmount: this.unbind.bind(this),
    };
  }
}

export default new ContextMenuDirective().build();
