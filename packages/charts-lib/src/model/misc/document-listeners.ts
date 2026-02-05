export type EventRemover = any;

export function onDocument(event: string, cb: any, useCapture?: boolean): any {
  document.documentElement.addEventListener(event, cb, { passive: true, capture: useCapture });

  let remover: EventRemover = () => {
    document.documentElement.removeEventListener(event, cb, useCapture);
    remover = null;
    return remover;
  };

  return remover;
}

export function onceDocument(event: string, cb: any, useCapture?: boolean): any {
  let remover: EventRemover = null;

  const wrapper = (e: Event) => {
    if (cb(e)) {
      if (remover != null) {
        return remover();
      }
    }

    return undefined;
  };

  document.documentElement.addEventListener(event, wrapper, useCapture);
  remover = () => {
    document.documentElement.removeEventListener(event, wrapper, useCapture);
    remover = null;
    return remover;
  };

  return remover;
}
