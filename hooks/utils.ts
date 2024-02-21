import { useEffect, useRef, useState } from "react";
import useWindowDimensions from "./useWindowDimensions";
import { uuidToBase62 } from "src/uuidHelpers";

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

export function useDebouncedEffect(cb: () => void, delay: number, deps: any[]) {
  let timeout = useRef<number | null>(null);
  useEffect(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    timeout.current = window.setTimeout(cb, delay);
  }, [cb, delay, ...deps]);
}

export function spacePath({
  studio,
  id,
  display_name,
}: {
  studio: string | undefined;
  id: string;
  display_name: string | null;
}) {
  return `/s/${encodeURIComponent(studio || "")}/s/${uuidToBase62(
    id
  )}/${encodeURIComponent(display_name || "")}`;
}

export function useIsElementOrChildFocused() {
  let ref = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      if (
        ref.current &&
        (ref.current === event.target ||
          ref.current.contains(event.target as Node))
      ) {
        setIsFocused(true);
      }
    };

    const handleFocusOut = (event: FocusEvent) => {
      // Delay checking for activeElement until after the blur event has been processed.
      setTimeout(() => {
        if (
          ref.current &&
          document.hasFocus() &&
          !ref.current.contains(document.activeElement)
        ) {
          setIsFocused(false);
        }
      }, 0);
    };

    // Listen for focusin and focusout to track focus within children elements as well
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, [ref]);

  return [isFocused, ref] as const;
}

export function useIsMobile() {
  const { width } = useWindowDimensions();
  return width < 640 || width === 0;
}
export const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
};
