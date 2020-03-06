import { useState, useEffect } from "react";
function useOnScreen(
  ref,
  { rootMargin = "0px", ...opts } = {},
  defaultIsIntersecting,
  onlyIsIntersecting
) {
  // State and setter for storing whether element is visible
  const [isIntersecting, setIntersecting] = useState(defaultIsIntersecting);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Update our state when observer callback fires
        setIntersecting(onlyIsIntersecting ? entry.isIntersecting : entry);
      },
      {
        rootMargin,
        ...opts
      }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => {
      observer.unobserve(ref.current);
    };
  }, []); // Empty array ensures that effect is only run on mount and unmount

  return isIntersecting;
}
export default useOnScreen;
