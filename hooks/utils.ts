import { useRouter } from "next/router";
import { useEffect, useRef } from "react";

export function usePrevious<T>(value: T) {
  const ref = useRef<T>();
  useEffect(() => void (ref.current = value), [value]);
  return ref.current;
}

let scrollPositions: { [key: string]: number } = {};
export function usePreserveScroll<T extends HTMLElement>() {
  let ref = useRef<T | null>(null);
  let router = useRouter();
  useEffect(() => {
    if (!ref.current) return;

    window.requestAnimationFrame(() => {
      ref.current?.scrollTo({ top: scrollPositions[router.asPath] || 0 });
    });

    const listener = () => {
      if (!ref.current?.scrollTop) return;
      scrollPositions[router.asPath] = ref.current.scrollTop;
    };

    ref.current.addEventListener("scroll", listener);
    return () => ref.current?.removeEventListener("scroll", listener);
  }, [router.asPath, ref.current]);
  return { ref };
}
