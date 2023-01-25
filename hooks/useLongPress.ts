import { useRef } from "react";

export const useLongPress = (cb: () => void) => {
  let longPressTimer = useRef<number>();
  let isLongPress = useRef(false);
  let start = (e: PointerEvent) => {
    // e.preventDefault()

    isLongPress.current = false;
    longPressTimer.current = window.setTimeout(() => {
      isLongPress.current = true;
      cb();
    }, 500);
  };
  let end = () => {
    window.clearTimeout(longPressTimer.current);
  };
  let click = (e: PointerEvent) => {
    if(isLongPress.current) e.preventDefault()
  }

  return {
    isLongPress: isLongPress.current,
    handlers: {
      onMouseDown: start,
      onMouseUp: end,
      onTouchStart: start,
      onTouchEnd: end,
      onClickCapture: click,
    },
  };
};
