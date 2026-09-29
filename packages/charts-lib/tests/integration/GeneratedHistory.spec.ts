import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createChartHarness } from '@tests/support/chartHarness';
import { assertModel, HistoryCommand, initialModel, type Action } from '@tests/support/historyModel';

const actions: Action[] = ['add', 'update', 'remove', 'addPane', 'removePane', 'toggle', 'swap',
  'invert', 'scale', 'priceRange', 'timeRange', 'undo', 'redo', 'clear', 'batch'];

describe('generated model-based history', () => {
  it('matches an independent state machine after each command', async () => {
    const generators = actions.map(action => fc.tuple(
      fc.integer({ min: 0, max: 2 }), fc.integer({ min: 0, max: 3 }), fc.integer({ min: -8, max: 8 }), fc.boolean(),
    ).map(([source, id, value, shared]) => new HistoryCommand(action, source, id, value, shared)));
    await fc.assert(fc.asyncProperty(fc.commands(generators, {
      maxCommands: Number(process.env.FC_COMMANDS ?? 50),
      size: 'max',
      ...(process.env.FC_REPLAY_PATH ? { replayPath: process.env.FC_REPLAY_PATH } : {}),
    }), async commands => {
      const real = createChartHarness({ render: false });
      try {
        real.addPane('main'); await real.settle(); real.chart.clearHistory();
        const model = initialModel();
        assertModel(model, real);
        await fc.asyncModelRun(() => ({ model, real }), commands);
      } finally { real.dispose(); }
    }), {
      numRuns: Number(process.env.FC_RUNS ?? 100), seed: Number(process.env.FC_SEED ?? 20260928),
      ...(process.env.FC_PATH ? { path: process.env.FC_PATH } : {}),
    });
  });

  const interactions: Action[] = ['add', 'update', 'remove', 'addPane', 'removePane', 'toggle', 'swap',
    'invert', 'scale', 'priceRange', 'timeRange', 'batch'];
  it.each(interactions.flatMap(a => interactions.map(b => [a, b])))('round trips %s followed by %s', async (a, b) => {
    const real = createChartHarness({ render: false });
    try {
      real.addPane('main'); await real.settle(); real.chart.clearHistory();
      const model = initialModel();
      for (const command of [
        new HistoryCommand('addPane', 1, 0, 0, false),
        new HistoryCommand('add', 0, 0, 1, true),
        new HistoryCommand('add', 1, 0, 2, true),
        new HistoryCommand('clear', 0, 0, 0, false),
      ]) await command.run(model, real);
      for (const [index, action] of [a, b].entries()) {
        const command = new HistoryCommand(action, action === 'addPane' ? 2 : 1, action === 'add' ? index + 1 : 0, index + 5, true);
        // A first removal can make a second operation inapplicable; the generator
        // uses the same domain preconditions rather than invoking invalid APIs.
        if (command.check(model)) await command.run(model, real);
      }
      while (model.past.length) await new HistoryCommand('undo', 0, 0, 0, false).run(model, real);
      while (model.future.length) await new HistoryCommand('redo', 0, 0, 0, false).run(model, real);
    } finally { real.dispose(); }
  });

  it.each([
    ['addPane', 'toggle', 'swap'], ['addPane', 'removePane', 'undo'],
    ['priceRange', 'invert', 'scale'], ['timeRange', 'priceRange', 'invert'],
  ] as Action[][])('checks an interaction round trip: %j', async (...sequence) => {
    const real = createChartHarness({ render: false });
    try {
      real.addPane('main'); await real.settle(); real.chart.clearHistory();
      const model = initialModel();
      for (const action of sequence) {
        const command = new HistoryCommand(action, action.includes('Pane') || action === 'toggle' || action === 'swap' ? 1 : 0, 0, 4, false);
        expect(command.check(model)).toBe(true);
        await command.run(model, real);
      }
      while (model.past.length) await new HistoryCommand('undo', 0, 0, 0, false).run(model, real);
      while (model.future.length) await new HistoryCommand('redo', 0, 0, 0, false).run(model, real);
    } finally { real.dispose(); }
  });
});
