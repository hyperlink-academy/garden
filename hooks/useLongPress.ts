import { useRef, useEffect } from "react";

export const useLongPress = (cb: () => void, cancel?: boolean) => {
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
  let click = (e: React.MouseEvent | React.PointerEvent) => {
    if (isLongPress.current) e.preventDefault();
  };

  useEffect(() => {
    if (cancel) {
      end();
    }
  }, [cancel]);

  return {
    isLongPress: isLongPress,
    handlers: {
      onMouseDown: start,
      onMouseUp: end,
      onTouchStart: start,
      onTouchEnd: end,
      onClickCapture: click,
    },
  };
};
