import { describe, expect, it, vi } from 'vitest';
import PanesSizeChanged from '@/model/chart/incidents/PanesSizeChanged';
import type { PaneDescriptor, PaneSize } from '@blackswan/layout/model';
import type { PanesSizeChangedEvent } from '@blackswan/layout/model';

describe('PanesSizeChanged', () => {
  it('applies and inverses sizes', () => {
    const panes: PaneDescriptor<unknown>[] = [
      { id: 'pane-1', model: {}, size: 0, preferredSize: 0, visible: true },
      { id: 'pane-2', model: {}, size: 0, preferredSize: 0, visible: true },
    ];

    const invalidate = vi.fn();
    const multipane = { visibleItems: panes, invalidate };

    const initial: PaneSize[] = [
      { preferred: 0.6, current: 60 },
      { preferred: 0.4, current: 40 },
    ];
    const changed: PaneSize[] = [
      { preferred: 0.7, current: 70 },
      { preferred: 0.3, current: 30 },
    ];

    const event: PanesSizeChangedEvent = { source: multipane, initial, changed };
    const incident = new PanesSizeChanged({ event });

    incident.apply();

    expect(panes[0].preferredSize).toBe(0.7);
    expect(panes[0].size).toBe(70);
    expect(panes[1].preferredSize).toBe(0.3);
    expect(panes[1].size).toBe(30);
    expect(invalidate).toHaveBeenCalledTimes(1);

    incident.inverse();

    expect(panes[0].preferredSize).toBe(0.6);
    expect(panes[0].size).toBe(60);
    expect(panes[1].preferredSize).toBe(0.4);
    expect(panes[1].size).toBe(40);
    expect(invalidate).toHaveBeenCalledTimes(2);
  });

  it('merges subsequent changes', () => {
    const panes: PaneDescriptor<unknown>[] = [
      { id: 'pane-1', model: {}, size: 0, preferredSize: 0, visible: true },
      { id: 'pane-2', model: {}, size: 0, preferredSize: 0, visible: true },
    ];

    const multipane = { visibleItems: panes, invalidate: vi.fn() };

    const initial: PaneSize[] = [
      { preferred: 0.6, current: 60 },
      { preferred: 0.4, current: 40 },
    ];
    const changed: PaneSize[] = [
      { preferred: 0.7, current: 70 },
      { preferred: 0.3, current: 30 },
    ];
    const nextChanged: PaneSize[] = [
      { preferred: 0.8, current: 80 },
      { preferred: 0.2, current: 20 },
    ];

    const event: PanesSizeChangedEvent = { source: multipane, initial, changed };
    const nextEvent: PanesSizeChangedEvent = { source: multipane, initial, changed: nextChanged };

    const incident = new PanesSizeChanged({ event });
    const nextIncident = new PanesSizeChanged({ event: nextEvent });

    expect(incident.mergeWith(nextIncident)).toBe(true);
    expect(event.changed).toEqual(nextChanged);
  });
});
