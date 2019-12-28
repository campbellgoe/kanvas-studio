const selectFrom = (object, selectors) => {
  return selectors.reduce((acc, val) => ({ ...acc, [val]: object[val] }), {});
};
export default selectFrom;
