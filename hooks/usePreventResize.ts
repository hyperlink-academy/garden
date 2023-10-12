import { useLayoutEffect } from "react";
import { isIOS } from "@react-aria/utils";

// Adapted from https://github.com/adobe/react-spectrum/blob/main/packages/%40react-aria/overlays/src/usePreventScroll.ts

// @ts-ignore
const visualViewport = typeof document !== "undefined" && window.visualViewport;

let preventResizeCount = 0;
let restore: () => void;
export function usePreventResize() {
  useLayoutEffect(() => {
    preventResizeCount++;
    if (preventResizeCount === 1) {
      if (isIOS()) {
        restore = preventResize();
      } else restore = () => {};
    }

    return () => {
      preventResizeCount--;
      if (preventResizeCount === 0) {
        restore();
      }
    };
  }, []);
}

const preventResize = () => {
  let onFocus = (e: FocusEvent) => {
    let target = e.target as HTMLElement;
    if (willOpenKeyboard(target)) {
      // Transform also needs to be applied in the focus event in cases where focus moves
      // other than tapping on an input directly, e.g. the next/previous buttons in the
      // software keyboard. In these cases, it seems applying the transform in the focus event
      // is good enough, whereas when tapping an input, it must be done before the focus event. 🤷‍♂️
      target.style.transform = "translateY(-2000px)";
      requestAnimationFrame(() => {
        target.style.transform = "";

        // This will have prevented the browser from scrolling the focused element into view,
        // so we need to do this ourselves in a way that doesn't cause the whole page to scroll.
        if (visualViewport) {
          if (visualViewport.height < window.innerHeight) {
            // If the keyboard is already visible, do this after one additional frame
            // to wait for the transform to be removed.
            requestAnimationFrame(() => {
              scrollIntoView(target);
            });
          } else {
            // Otherwise, wait for the visual viewport to resize before scrolling so we can
            // measure the correct position to scroll to.
            visualViewport.addEventListener(
              "resize",
              () => scrollIntoView(target),
              { once: true }
            );
          }
        }
      });
    }
  };
  let onTouchEnd = (e: TouchEvent) => {
    let target = e.target as HTMLElement;

    // Apply this change if we're not already focused on the target element
    if (willOpenKeyboard(target)) {
      e.preventDefault();

      // Apply a transform to trick Safari into thinking the input is at the top of the page
      // so it doesn't try to scroll it into view. When tapping on an input, this needs to
      // be done before the "focus" event, so we have to focus the element ourselves.
      target.style.transform = "translateY(-2000px)";
      target.focus();
      requestAnimationFrame(() => {
        target.style.transform = "";
      });
    }
  };
  document.addEventListener("touchend", onTouchEnd, {
    passive: false,
    capture: true,
  });
  document.addEventListener("focus", onFocus, true);
  return () => {
    document.removeEventListener("touchend", onTouchEnd);
    document.removeEventListener("focus", onFocus);
  };
};

function scrollIntoView(target: Element | null) {
  let root = document.scrollingElement || document.documentElement;
  while (target && target !== root) {
    // Find the parent scrollable element and adjust the scroll position if the target is not already in view.
    let scrollable = getScrollParent(target);
    if (
      scrollable !== document.documentElement &&
      scrollable !== document.body &&
      scrollable !== target
    ) {
      let scrollableTop = scrollable.getBoundingClientRect().top;
      let targetTop = target.getBoundingClientRect().top;
      if (targetTop > scrollableTop + target.clientHeight) {
        scrollable.scrollTop += targetTop - scrollableTop;
      }
    }

    target = scrollable.parentElement;
  }
}

export function getScrollParent(node: Element): Element {
  if (isScrollable(node)) {
    node = node.parentElement as Element;
  }

  while (node && !isScrollable(node)) {
    node = node.parentElement as Element;
  }

  return node || document.scrollingElement || document.documentElement;
}

export function isScrollable(node: Element): boolean {
  let style = window.getComputedStyle(node);
  return /(auto|scroll)/.test(
    style.overflow + style.overflowX + style.overflowY
  );
}

// HTML input types that do not cause the software keyboard to appear.
const nonTextInputTypes = new Set([
  "checkbox",
  "radio",
  "range",
  "color",
  "file",
  "image",
  "button",
  "submit",
  "reset",
]);
function willOpenKeyboard(target: Element) {
  return (
    (target instanceof HTMLInputElement &&
      !nonTextInputTypes.has(target.type)) ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}
