export const enum ZoomType {
  IN = -0.01, OUT = 0.01,
}

/**
 * World coordinates: domain model values;
 * Scaled coordinates: coordinates which were translated by scale function;
 *
 * Screen coordinates is equal scaled * screen.size / (range.to - range.from);
 * Screen.size = canvas size in used dimension (width or height)
 */
export default interface ScalingFunction<T extends number> {
  translate(worldCoordinate: T): number;

  revert(virtualCoordinate: number): T;

  translateInRawArray(worldData: never[][], translatedDataIndexes: number[]): void;
}
