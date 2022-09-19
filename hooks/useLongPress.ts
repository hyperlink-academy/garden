import { useRef } from "react";

export const useLongPress = (cb: () => void) => {
  let longPressTimer = useRef<number>();
  let start = () => {
    longPressTimer.current = window.setTimeout(() => {
      cb();
    }, 500);
  };
  let end = () => {
    window.clearTimeout(longPressTimer.current);
  };

  return {
    onMouseDown: start,
    onMouseUp: end,
    onTouchStart: start,
    onTouchEnd: end,
  };
};
