let ctx: OffscreenCanvasRenderingContext2D;
self.onmessage = (e) => {
  const {
    canvas,
    width,
    height,
    dpr,
    inverted,
    labels,
    labelColor,
    labelFont,
    xPos,
  } = e.data;
  if (canvas) {
    ctx = canvas.getContext('2d');
    self.postMessage({ type: 'RENDER_INITIALIZED' });
    return;
  }

  if (!ctx) {
    self.postMessage({ type: 'RENDER_SKIPPED' });
    return;
  }

  ctx.canvas.width = Math.floor(width * dpr);
  ctx.canvas.height = Math.floor(height * dpr);

  ctx.resetTransform();
  ctx.scale(dpr, dpr);
  ctx.save();

  if (inverted < 0) {
    ctx.translate(0, height);
  }

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'end';
  ctx.fillStyle = labelColor;
  ctx.font = labelFont;

  for (const [yPos, label] of labels) {
    ctx.fillText(label, xPos, inverted * yPos);
  }

  ctx.restore();

  self.postMessage({ type: 'RENDER_COMPLETE' });
};
