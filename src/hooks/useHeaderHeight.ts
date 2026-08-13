import { useEffect, useState } from "react";

/** Tracks the rendered height of the sticky site header so other sticky
 *  elements can pin exactly below it across breakpoints. */
export function useHeaderHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = document.querySelector("header.sticky-header") as HTMLElement | null;
    if (!el) return;

    const update = () => setHeight(el.offsetHeight);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return height;
}
