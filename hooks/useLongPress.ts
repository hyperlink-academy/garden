import { useRef } from "react";

export const useLongPress = (cb: () => void) => {
  let longPressTimer = useRef<number>();
  let isLongPress = useRef(false);
  let start = () => {
    isLongPress.current = false;
    longPressTimer.current = window.setTimeout(() => {
      isLongPress.current = true;
      cb();
    }, 500);
  };
  let end = () => {
    window.clearTimeout(longPressTimer.current);
  };

  return {
    isLongPress: isLongPress.current,
    handlers: {
      onMouseDown: start,
      onMouseUp: end,
      onTouchStart: start,
      onTouchEnd: end,
    },
  };
};
