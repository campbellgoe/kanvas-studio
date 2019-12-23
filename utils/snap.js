function snap(num, granularity = 1) {
  if (granularity === 0) {
    return num;
  }
  return Math.round(num / granularity) * granularity;
}
export const snapAll = (toSnap, granularity) => {
  return toSnap.map(x => snap(x, granularity));
};
export default snap;
