// @flow

class Drawer {
  ctx: CanvasRenderingContext2D;
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }
  line(xStart: number, yStart: number, xEnd: number, yEnd: number) {
    const ctx = this.ctx;
    ctx.moveTo(xStart, yStart);
    ctx.lineTo(xEnd, yEnd);
  }
  //sx, sy = start x, y.
  //ex, ey = end x, y.
  //cellSize is distance between lines
  //grid will automatically fill the area given by sx,sy,ex,ey with gridlines of cellSize apart.
  grid(sx: number, sy: number, ex: number, ey: number, cellSize: number) {
    const ctx = this.ctx;
    const width = ex - sx;
    const height = ey - sy;
    const xLines = width / cellSize;
    const yLines = height / cellSize;
    ctx.beginPath();
    for (let ix = 0; ix < xLines; ix++) {
      const x = sx + ix * cellSize;
      this.line(x, sy, x, ey);
    }
    for (let iy = 0; iy < yLines; iy++) {
      const y = sy + iy * cellSize;
      this.line(sx, y, ex, y);
    }
    ctx.stroke();
    ctx.closePath();
  }
  circle(x: number, y: number, radius: number) {
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
  }
  cross(x: number, y: number, size: number) {
    this.line(x, y - size, x, y + size);
    this.line(x - size, y, x + size, y);
  }
}
export default Drawer;
