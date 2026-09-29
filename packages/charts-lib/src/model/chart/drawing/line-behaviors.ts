import type { HLine, VLine, Line } from '@/model/chart/types';
import type { DrawingBehavior } from '@/model/chart/drawing/DrawingBehavior';

export const moveHLine: DrawingBehavior<HLine> = (data, { priceAxis }, e, handle) => {
  if (handle !== undefined && handle !== 'center') return undefined;
  return { def: priceAxis.revert(priceAxis.translate(data.def) - e.dy) };
};

export const moveVLine: DrawingBehavior<VLine> = (data, { timeAxis }, e, handle) => {
  if (handle !== undefined && handle !== 'center') return undefined;
  return { def: timeAxis.revert(timeAxis.translate(data.def) - e.dx) };
};

export const moveLine: DrawingBehavior<Line> = (data, { timeAxis, priceAxis }, e, handle) => {
  let update: ReturnType<DrawingBehavior<Line>>;
  if (handle === undefined) {
    const lineScale = data.scale.func;
    const [x0, y0, x1, y1] = data.def;
    // Drag events carry previous-minus-current deltas. Evaluate the grabbed
    // point BEFORE moving horizontally, then shift it by the screen delta.
    // This preserves the line's slope in its own scale and the grab offset.
    const previousX = timeAxis.revert(e.x + e.dx);
    const anchor =
      x0 === x1
        ? priceAxis.revert(e.y + e.dy)
        : lineScale.revert(
            lineScale.translate(y0) + ((lineScale.translate(y1) - lineScale.translate(y0)) * (previousX - x0)) / (x1 - x0),
          );
    const shiftedAnchor = priceAxis.revert(priceAxis.translate(anchor) - e.dy);
    const delta = lineScale.translate(shiftedAnchor) - lineScale.translate(anchor);
    const ny0 = lineScale.revert(lineScale.translate(y0) + delta);
    const ny1 = lineScale.revert(lineScale.translate(y1) + delta);

    const nx0 = timeAxis.revert(timeAxis.translate(x0) - e.dx);
    const nx1 = timeAxis.revert(timeAxis.translate(x1) - e.dx);
    update = { def: [nx0, ny0, nx1, ny1] };
  }

  if (handle === 'lineStart') {
    const [x0, y0, x1, y1] = data.def;
    const nx0 = timeAxis.revert(timeAxis.translate(x0) - e.dx);
    const ny0 = priceAxis.revert(priceAxis.translate(y0) - e.dy);
    update = { def: [nx0, ny0, x1, y1] };
  }

  if (handle === 'lineEnd') {
    const [x0, y0, x1, y1] = data.def;
    const nx1 = timeAxis.revert(timeAxis.translate(x1) - e.dx);
    const ny1 = priceAxis.revert(priceAxis.translate(y1) - e.dy);
    update = { def: [x0, y0, nx1, ny1] };
  }

  return update;
};
