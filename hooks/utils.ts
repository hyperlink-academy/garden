import { useRouter } from "next/router";
import { useEffect, useRef } from "react";

export function usePrevious<T>(value: T) {
  const ref = useRef<T>();
  useEffect(() => void (ref.current = value), [value]);
  return ref.current;
}

let scrollPositions: { [key: string]: number } = {};
export function usePreserveScroll<T extends HTMLElement>(key: string | null) {
  let ref = useRef<T | null>(null);
  useEffect(() => {
    if (!ref.current || !key) return;

    window.requestAnimationFrame(() => {
      ref.current?.scrollTo({ top: scrollPositions[key] || 0 });
    });

    const listener = () => {
      if (!ref.current?.scrollTop) return;
      scrollPositions[key] = ref.current.scrollTop;
    };

    ref.current.addEventListener("scroll", listener);
    return () => ref.current?.removeEventListener("scroll", listener);
  }, [key, ref.current]);
  return { ref };
}

export function spacePath(
  studio: string | string[] | undefined,
  space: string | string[] | undefined
) {
  return `/s/${encodeURIComponent(studio as string)}/s/${encodeURIComponent(
    space as string
  )}`;
}
