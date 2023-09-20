import { useEffect, useRef, useState } from "react";

export function useIntersectionObserver<T extends HTMLElement>(
  options: {
    threshold?: number;
    root?: HTMLElement | null;
    rootMargin?: string;
  } = {}
) {
  const { threshold = 1, root = null, rootMargin = "0%" } = options;
  const ref = useRef<T>(null);
  let intersectingRef = useRef<null | boolean>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref?.current;

    if (!node || typeof IntersectionObserver !== "function") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        intersectingRef.current = entry.isIntersecting;
        setIsVisible(entry.isIntersecting);
      },
      { threshold, root, rootMargin }
    );

    observer.observe(node);

    return () => {
      setIsVisible(false);
      observer.disconnect();
    };
  }, [threshold, root, rootMargin]);

  return [ref, isVisible, intersectingRef] as const;
}
