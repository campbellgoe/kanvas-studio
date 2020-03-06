import { useState, useContext, useEffect } from "react";
import { ThemeContext } from "styled-components";
const mediaQueryBreakpoint = ({ size, type = "min-width" }) => {
  if (!size) throw new Error("Must specify a breakpoint value");
  return window.matchMedia(`only screen and (${type}: ${size})`);
};
const useBreakpoint = (
  { size, type = "min-width", defaultMatches = false },
  onChange = Function.prototype
) => {
  const { breakpoints: bps } = useContext(ThemeContext);
  size = bps[size] || size;
  //Using hook to determine breakpoint matches
  //matches if screen width is >= the given size
  const [isSizeBreakpoint, setIsSizeBreakpoint] = useState(defaultMatches);
  //set default in useEffect so no window undefined error
  useEffect(() => {
    setIsSizeBreakpoint(mediaQueryBreakpoint({ size, type }).matches);
  }, []);
  //TODO: make only on mount/unmount (e.g. (fn, []))
  //so it doesn't constant set and unset the breakpoint listener
  useEffect(() => {
    const handleBreakpointChange = evt => {
      //set on change
      setIsSizeBreakpoint(evt.matches);
      onChange(evt.matches);
    };

    const sizeBreakpoint = mediaQueryBreakpoint({ size, type });

    sizeBreakpoint.addListener(handleBreakpointChange);
    return () => {
      return sizeBreakpoint.removeListener(handleBreakpointChange);
    };
  });
  return isSizeBreakpoint;
};
export default useBreakpoint;
