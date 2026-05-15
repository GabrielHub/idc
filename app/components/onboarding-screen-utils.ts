import { useEffect, useState } from "react";

export function useResponsiveColumnCount(forWidth: (width: number) => number): number {
  const [count, setCount] = useState(() =>
    forWidth(typeof window === "undefined" ? 1920 : window.innerWidth),
  );
  useEffect(() => {
    function update() {
      setCount(forWidth(window.innerWidth));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [forWidth]);
  return count;
}
