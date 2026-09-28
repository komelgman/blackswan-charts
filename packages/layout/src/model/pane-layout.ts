import type { PaneDescriptor, PaneSize } from './types';

// All lengths use the caller's coordinate system; DOM measurement belongs to the adapter.
interface PaneInfo {
  paneDesc: PaneDescriptor<unknown>;
  min: number;
  max: number;
  targetSize: number;
  retrievedSize: number;
}

interface InitialParamsForVisiblePanes {
  suPanes: PaneInfo[];
  suMin: number;
  suMax: number;
  snuPanes: PaneInfo[];
  snuRetrieved: number;
  snuMin: number;
  snuMax: number;
  availableSize: number;
  bordersSize: number;
}

interface Layout {
  minSize: number | undefined;
  maxSize: number | undefined;
}

export function layoutPanes(items: PaneDescriptor<unknown>[], availableSize: number, bordersSize: number = 0): Layout {

  const {
    suPanes,
    suMin,
    suMax,
    snuPanes,
    snuRetrieved,
    snuMin,
    snuMax,
  } = getInitialParamsForVisiblePanes(items, availableSize, bordersSize);
  const layout: Layout = { minSize: undefined, maxSize: undefined };
  if (suPanes.length + snuPanes.length === 0) return layout;

  const targetSize = availableSize - bordersSize;
  if ((suMin + snuMin) > targetSize) {
    throw new Error('No enough space for panes');
  }

  if ((suMax + snuMax) < targetSize) {
    throw new Error('Maximum panes size less than available size');
  }

  let snuSize = resize(snuPanes, snuRetrieved, snuRetrieved);
  if (snuSize + suMin > targetSize) {
    snuSize = resize(snuPanes, snuRetrieved, targetSize - suMin);
  }

  if (snuSize + suMax < targetSize) {
    snuSize = resize(snuPanes, snuRetrieved, targetSize - suMax);
  }

  const suRetrieved = targetSize - snuSize;
  for (const pane of suPanes) {
    pane.retrievedSize = suRetrieved / suPanes.length;
  }

  resize(suPanes, suRetrieved, suRetrieved);

  // update layout min|max size options
  const minimumSize = snuMin + suMin;
  if (minimumSize > 0) {
    layout.minSize = (minimumSize + bordersSize);
  } else {
    layout.minSize = undefined;
  }

  const maximumSize = snuMax + suMax;
  if (maximumSize > 0 && maximumSize < Number.MAX_VALUE) {
    layout.maxSize = (maximumSize + bordersSize);
  } else {
    layout.maxSize = undefined;
  }

  // fix inaccuracy and apply size
  let computedSize = 0;
  const panes = [...suPanes, ...snuPanes];
  for (const info of panes) {
    computedSize += info.targetSize;
  }

  let fix = targetSize - computedSize;
  for (const info of panes) {
    let size = info.targetSize;

    if ((size + fix) >= info.min && (size + fix) <= info.max) {
      size += fix;
      fix = 0;
    }

    info.paneDesc.size = size;
  }
  return layout;
}

function resize(paneInfos: PaneInfo[], retrievedSize: number, targetSize: number) {
  const scale = retrievedSize === 0 ? 0 : targetSize / retrievedSize;
  let sizeThatShouldBeDistributed: number = 0;
  let panesAvailableForStretch = paneInfos.length;
  let panesAvailableForShrink = paneInfos.length;

  // scale elements size to screen size
  for (const info of paneInfos) {
    let size = info.retrievedSize * scale;

    if (size > info.max) {
      sizeThatShouldBeDistributed += size - info.max;
      size = info.max;
    }

    if (size < info.min) {
      sizeThatShouldBeDistributed -= info.min - size;
      size = info.min;
    }

    if (size === info.max) {
      panesAvailableForStretch -= 1;
    }

    if (size === info.min) {
      panesAvailableForShrink -= 1;
    }

    info.targetSize = size;
  }

  // stretch/shrink not distributed space
  const eps = 0.00001;

  // shrink
  let circleBreaker = 100;
  while ((sizeThatShouldBeDistributed + eps) < 0 && panesAvailableForShrink > 0) {
    const dSize = -sizeThatShouldBeDistributed / panesAvailableForShrink;

    for (const info of paneInfos) {
      if (info.min === info.targetSize) {
        continue;
      }

      let size = info.targetSize - dSize;
      if (size <= info.min) {
        size = info.min;
        panesAvailableForShrink -= 1;
      }

      sizeThatShouldBeDistributed += info.targetSize - size;
      info.targetSize = size;
    }

    circleBreaker -= 1;
    if (circleBreaker === 0) {
      throw new Error('shrink infinite loop');
    }
  }

  // stretch
  circleBreaker = 100;
  while ((sizeThatShouldBeDistributed - eps) > 0 && panesAvailableForStretch > 0) {
    const dSize = sizeThatShouldBeDistributed / panesAvailableForStretch;

    for (const info of paneInfos) {
      if (info.max === info.targetSize) {
        continue;
      }

      let size = info.targetSize + dSize;
      if (size >= info.max) {
        size = info.max;
        panesAvailableForStretch -= 1;
      }

      sizeThatShouldBeDistributed -= size - info.targetSize;
      info.targetSize = size;
    }

    circleBreaker -= 1;
    if (circleBreaker === 0) {
      throw new Error('stretch infinite loop');
    }
  }

  let result = 0;
  for (const info of paneInfos) {
    result += info.targetSize;
  }

  return result;
}

function getInitialParamsForVisiblePanes(
  items: PaneDescriptor<unknown>[], availableSize: number, bordersSize: number,
): InitialParamsForVisiblePanes {
  const currentVisibleItems = items.filter(item => item.visible !== false);
  const size = availableSize - bordersSize;
  const suPanes: PaneInfo[] = [];
  const snuPanes: PaneInfo[] = [];

  let snuRetrieved = 0;
  let suMin = 0;
  let snuMin = 0;
  let suMax = 0;
  let snuMax = 0;

  for (let i = 0; i < currentVisibleItems?.length || 0; i += 1) {
    const paneDesc = currentVisibleItems[i];

    if (paneDesc.minSize === undefined) {
      paneDesc.minSize = 1;
    }

    if (paneDesc.maxSize === undefined) {
      paneDesc.maxSize = Number.MAX_VALUE;
    }

    if (paneDesc.preferredSize) {
      const retrievedSize = size * paneDesc.preferredSize;
      snuRetrieved += retrievedSize;
      snuMin += paneDesc.minSize;
      snuMax = paneDesc.maxSize === Number.MAX_VALUE ? Number.MAX_VALUE : snuMax + paneDesc.maxSize;

      snuPanes.push({
        paneDesc,
        min: paneDesc.minSize,
        max: paneDesc.maxSize,
        retrievedSize,
        targetSize: retrievedSize,
      });
    } else {
      suMin += paneDesc.minSize;
      suMax = paneDesc.maxSize === Number.MAX_VALUE ? Number.MAX_VALUE : suMax + paneDesc.maxSize;

      suPanes.push({
        paneDesc,
        min: paneDesc.minSize,
        max: paneDesc.maxSize,
        retrievedSize: 0,
        targetSize: 0,
      });
    }
  }

  return {
    suPanes,
    suMax,
    suMin,
    snuPanes,
    snuRetrieved,
    snuMax,
    snuMin,
    availableSize,
    bordersSize,
  };
}

export function resizePanes(
  items: PaneDescriptor<unknown>[], index: number, dsize: number, availableSize: number, bordersSize: number = 0,
): { initial: PaneSize[]; changed: PaneSize[]; constrained: boolean } {
  items = items.filter(item => item.visible !== false);
  const sizes = (): PaneSize[] => items.map(v => {
    if (v.size === undefined) throw new Error('Lay out panes before resizing');
    return { preferred: v.preferredSize, current: v.size };
  });
  const initialSizes = sizes();
  const deltaSign = Math.sign(dsize);
  let constrained = false;
  let deltaSize = Math.abs(dsize);
  let steps = 0;

  while (deltaSize > 0) {
    if (++steps > items.length * 2 + 1) throw new Error('Pane resize made no progress');
    const decPaneIndex: number | undefined = getDecPaneIndex(deltaSign, index, items);
    const incPaneIndex: number | undefined = getIncPaneIndex(deltaSign, index, items);

    if (decPaneIndex === undefined || incPaneIndex === undefined) {
      constrained = true;
      break;
    }

    const decItem: PaneDescriptor<unknown> = items[decPaneIndex];
    const incItem: PaneDescriptor<unknown> = items[incPaneIndex];
    if (decItem.size === undefined || incItem.size === undefined
        || decItem.minSize === undefined || incItem.maxSize === undefined) {
      throw new Error('oops');
    }

    const shrinkCapacity = decItem.size - decItem.minSize;
    const growCapacity = incItem.maxSize - incItem.size;
    const applied = Math.min(deltaSize, shrinkCapacity, growCapacity);
    // Assign the exact boundary when saturated; subtracting rounded deltas can
    // leave an unconsumable residual and repeatedly choose the same pane.
    decItem.size = applied === shrinkCapacity ? decItem.minSize : decItem.size - applied;
    incItem.size = applied === growCapacity ? incItem.maxSize : incItem.size + applied;
    decItem.preferredSize = decItem.size / (availableSize - bordersSize);
    incItem.preferredSize = incItem.size / (availableSize - bordersSize);
    deltaSize -= applied;
  }

  const changedSizes = sizes();

  return { initial: initialSizes, changed: changedSizes, constrained };
}

function getDecPaneIndex(sign: number, index: number, items: PaneDescriptor<unknown>[]): number | undefined {
  const change = sign > 0 ? 1 : -1;
  let dec: number | undefined = index;
  if (change < 0) {
    dec += change;
  }

  while (dec >= 0 && dec < items.length) {
    const info = items[dec];
    if (info.minSize !== info.size) {
      return dec;
    }
    dec += change;
  }

  return undefined;
}

function getIncPaneIndex(sign: number, index: number, items: PaneDescriptor<unknown>[]): number | undefined {
  const change = sign < 0 ? 1 : -1;
  let inc: number | undefined = index;
  if (change < 0) {
    inc += change;
  }

  while (inc >= 0 && inc < items.length) {
    const info = items[inc];
    if (info.maxSize !== info.size) {
      return inc;
    }
    inc += change;
  }

  return undefined;
}
