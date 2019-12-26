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
  polygon(...args: Array<number>) {
    if (args.length % 2 === 1)
      throw new Error(
        "Odd number of arguments. Only accepts sets of 2 arguments each representing x, y coordinates."
      );
    const [startX, startY] = args.slice(0, 2);
    const points = args.slice(2);
    const ctx = this.ctx;
    const nPoints = points.length;
    ctx.moveTo(startX, startY);
    for (let i = 0; i < nPoints; i += 2) {
      const x = points[i];
      const y = points[i + 1];
      ctx.lineTo(x, y);
    }
  }
  supperfluousCrosshair(pointer: any, size: number) {
    const ctx = this.ctx;
    const draw = this;
    const { x, y, isDown } = pointer;
    ctx.beginPath();
    ctx.globalCompositeOperation = "xor";
    ctx.fillStyle = isDown ? "red" : "black";
    ctx.lineWidth = 2;
    const dm = isDown ? 0 : 1;
    //draw.circle(pointer.x, pointer.y, 5);
    //left
    draw.polygon(x - size / 2 - dm, y - 2, x - size / 2 - dm, y + 2, x - dm, y);
    //top
    draw.polygon(x - 2, y - size / 2 - dm, x + 2, y - size / 2 - dm, x, y - dm);
    //right
    draw.polygon(x + size / 2 + dm, y - 2, x + size / 2 + dm, y + 2, x + dm, y);
    //bottom
    draw.polygon(x - 2, y + size / 2 + dm, x + 2, y + size / 2 + dm, x, y + dm);
    ctx.fill();
    ctx.closePath();
    ctx.globalCompositeOperation = "source-over";
  }
}
export default Drawer;
