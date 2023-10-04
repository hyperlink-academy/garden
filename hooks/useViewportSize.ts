import { useEffect, useState } from "react";

interface ViewportSize {
  width: number;
  height: number;
}

// @ts-ignore
let visualViewport =
  typeof document !== "undefined" ? window.visualViewport : null;

export function useViewportSize(): ViewportSize {
  let [size, setSize] = useState(() => getViewportSize());

  useEffect(() => {
    // Use visualViewport api to track available height even on iOS virtual keyboard opening
    let onResize = () => {
      setSize((size) => {
        let newSize = getViewportSize();
        if (newSize.width === size.width && newSize.height === size.height) {
          return size;
        }
        return newSize;
      });
    };

    if (!visualViewport) {
      window.addEventListener("resize", onResize);
    } else {
      visualViewport.addEventListener("resize", onResize);
    }

    return () => {
      if (!visualViewport) {
        window.removeEventListener("resize", onResize);
      } else {
        visualViewport.removeEventListener("resize", onResize);
      }
    };
  }, []);

  return size;
}

function getViewportSize(): ViewportSize {
  if (typeof window === "undefined") return { width: 0, height: 0 };
  return {
    width: visualViewport?.width || window?.innerWidth,
    height: visualViewport?.height || window?.innerHeight,
  };
}
