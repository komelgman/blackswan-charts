/** Records the Canvas subset used by our renderers, without rasterizing or loading fonts.
 * Unsupported methods deliberately fail rather than silently accepting missing coverage.
 */
export class RecordingPath {
  readonly commands: { op: string; args: number[] }[] = [];
  moveTo(...args: [number, number]) { this.commands.push({ op: 'moveTo', args }); }
  lineTo(...args: [number, number]) { this.commands.push({ op: 'lineTo', args }); }
  quadraticCurveTo(...args: [number, number, number, number]) { this.commands.push({ op: 'quadraticCurveTo', args }); }
  bezierCurveTo(...args: [number, number, number, number, number, number]) { this.commands.push({ op: 'bezierCurveTo', args }); }
  arc(...args: number[]) { this.commands.push({ op: 'arc', args }); }
  rect(...args: [number, number, number, number]) { this.commands.push({ op: 'rect', args }); }
  closePath() { this.commands.push({ op: 'closePath', args: [] }); }
}

type PaintState = {
  strokeStyle: string; fillStyle: string; lineWidth: number; lineCap: string;
  font: string; textAlign: string; textBaseline: string; dash: number[];
  transform: number[]; clip: RecordingPath['commands'][];
};
export type Paint = PaintState & {
  op: 'stroke' | 'fill' | 'text' | 'clear';
  path?: RecordingPath['commands']; text?: string; x?: number; y?: number;
};

export class RecordingCanvas {
  readonly canvas = { width: 0, height: 0 };
  readonly paints: Paint[] = [];
  strokeStyle = '#000';
  fillStyle = '#000';
  lineWidth = 1;
  lineCap = 'butt';
  font = '10px sans-serif';
  textAlign = 'start';
  textBaseline = 'alphabetic';
  private dash: number[] = [];
  private transform = [1, 0, 0, 1, 0, 0];
  private clips: RecordingPath['commands'][] = [];
  private stack: PaintState[] = [];
  private path = new RecordingPath();

  constructor(private readonly textWidth: (text: string, font: string) => number = text => text.length * 6) {}

  asContext(): CanvasRenderingContext2D { return this as unknown as CanvasRenderingContext2D; }
  private state(): PaintState {
    return structuredClone({
      strokeStyle: this.strokeStyle, fillStyle: this.fillStyle, lineWidth: this.lineWidth, lineCap: this.lineCap,
      font: this.font, textAlign: this.textAlign, textBaseline: this.textBaseline,
      dash: this.dash, transform: this.transform, clip: this.clips,
    });
  }
  save() { this.stack.push(this.state()); }
  restore() {
    const state = this.stack.pop();
    if (!state) return; // Canvas restore on an empty stack is a no-op.
    const { clip, ...rest } = state;
    Object.assign(this, rest);
    this.clips = clip;
  }
  setLineDash(dash: number[]) { this.dash = [...dash]; }
  resetTransform() { this.transform = [1, 0, 0, 1, 0, 0]; }
  scale(x: number, y: number) {
    this.transform[0] *= x; this.transform[1] *= x;
    this.transform[2] *= y; this.transform[3] *= y;
  }
  translate(x: number, y: number) {
    const [a, b, c, d] = this.transform;
    this.transform[4] += a * x + c * y;
    this.transform[5] += b * x + d * y;
  }
  beginPath() { this.path = new RecordingPath(); }
  moveTo(x: number, y: number) { this.path.moveTo(x, y); }
  lineTo(x: number, y: number) { this.path.lineTo(x, y); }
  rect(x: number, y: number, w: number, h: number) { this.path.rect(x, y, w, h); }
  clip(path = this.path) { this.clips.push(structuredClone(path.commands)); }
  stroke(path = this.path) { this.paints.push({ ...this.state(), op: 'stroke', path: structuredClone(path.commands) }); }
  fill(path = this.path) { this.paints.push({ ...this.state(), op: 'fill', path: structuredClone(path.commands) }); }
  fillText(text: string, x: number, y: number) { this.paints.push({ ...this.state(), op: 'text', text, x, y }); }
  clearRect() { this.paints.length = 0; }
  measureText(text: string) { return { width: this.textWidth(text, this.font) }; }
}
