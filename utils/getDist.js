//slightly more efficient to compare non square rooted values (micro-optimization)
export const distanceSquared = ({ x: ax, y: ay }, { x: bx, y: by }) => {
  const a = ax - bx;
  const b = ay - by;
  return a ** 2 + b ** 2;
};
//more easy to reason about (micro-optimizations are evil)
export const distance = (a, b) => distanceSquared(a, b) ** 0.5;

export default distance;
