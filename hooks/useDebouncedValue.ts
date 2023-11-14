import { useEffect, useRef, useState } from "react";

// this function is currently very optimized for the dragging in a sorted
// list use case!
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const lastUpdate = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdate.current;

    // If the time since the last update is greater than the delay, update immediately.
    if (timeSinceLastUpdate > delay && value !== null) {
      setDebouncedValue(value);
      lastUpdate.current = now;
    } else {
      // Otherwise, set up a timeout to update the value after the remaining delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
        lastUpdate.current = Date.now();
      }, delay - timeSinceLastUpdate);

      // Clear the timeout if the value or delay changes
      return () => {
        clearTimeout(handler);
      };
    }
  }, [value, delay]);

  return debouncedValue;
}
