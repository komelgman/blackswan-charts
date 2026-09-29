import type { Line, Price, UTCTimestamp } from '@/model/chart/types';
import type { DrawingBehavior } from '@/model/chart/drawing/DrawingBehavior';
import { moveLine } from '@/model/chart/drawing/line-behaviors';

/** Two parallel boundaries in the drawing scale. Offset is in transformed price units. */
export type Channel = Line & { offset: number };

export function channelBoundary(channel: Channel): Line {
  const [x0, y0, x1, y1] = channel.def;
  const { func } = channel.scale;
  return {
    ...channel,
    def: [x0, func.revert(func.translate(y0) + channel.offset), x1, func.revert(func.translate(y1) + channel.offset)],
  };
}

export function linePriceAt(line: Line, x: UTCTimestamp): Price {
  const [x0, y0, x1, y1] = line.def;
  const { func } = line.scale;
  const t = x0 === x1 ? 0.5 : (x - x0) / (x1 - x0);
  return func.revert(func.translate(y0) + (func.translate(y1) - func.translate(y0)) * t);
}

export const moveChannel: DrawingBehavior<Channel> = (data, projection, event, handle) => {
  const { priceAxis, timeAxis } = projection;
  const { func } = data.scale;
  if (handle === 'channelWidth') {
    const x = ((data.def[0] + data.def[2]) / 2) as UTCTimestamp;
    const y = linePriceAt(channelBoundary(data), x);
    const movedY = priceAxis.revert(priceAxis.translate(y) - event.dy);
    return { offset: data.offset + func.translate(movedY) - func.translate(y) };
  }
  if (handle !== undefined) return moveLine(data, projection, event, handle);

  // Pick the grabbed boundary in screen space; mixed scales must keep either edge under the pointer.
  const x = timeAxis.revert(event.x + event.dx);
  const y = event.y + event.dy;
  const upper = channelBoundary(data);
  const onUpper =
    Math.abs(priceAxis.translate(linePriceAt(upper, x)) - y) < Math.abs(priceAxis.translate(linePriceAt(data, x)) - y);
  const moved = moveLine(onUpper ? upper : data, projection, event);
  if (!moved?.def) return undefined;
  const [x0, y0, x1, y1] = moved.def as Line['def'];
  const offset = onUpper ? data.offset : 0;
  return { def: [x0, func.revert(func.translate(y0) - offset), x1, func.revert(func.translate(y1) - offset)] };
};
