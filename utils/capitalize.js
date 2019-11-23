const capitalize = s => {
  if (typeof s !== "string") {
    throw new TypeError("non string passed to capitalize " + typeof s);
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export default capitalize;
