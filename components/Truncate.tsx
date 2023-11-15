import { useEffect, useRef, useState } from "react";

export function Truncate(props: {
  children: React.ReactNode;
  className?: string;
}) {
  let ref = useRef<HTMLDivElement>(null);
  let [scrollLeft, setScrollLeft] = useState(0);
  let [scrollWidth, setScrollWidth] = useState(0);
  let [clientWidth, setClientWidth] = useState(0);
  useEffect(() => {
    let element = ref.current;
    if (!element) return;
    setScrollLeft(element.scrollLeft);
    setScrollWidth(element.scrollWidth);
    setClientWidth(element.clientWidth);
    let onScroll = () => {
      setScrollLeft(element?.scrollLeft || 0);
      setScrollWidth(element?.scrollWidth || 0);
      setClientWidth(element?.clientWidth || 0);
    };
    element.addEventListener("scroll", onScroll);
    return () => element?.removeEventListener("scroll", onScroll);
  }, [props.children]);
  return (
    <div className={`${props.className} relative`}>
      <div
        ref={ref}
        className={`no-scrollbar overflow-x-auto whitespace-nowrap`}
      >
        {props.children}
      </div>
      {scrollLeft > 0 && (
        <div className="absolute bottom-0.5 left-0 bg-inherit pr-0.5">…</div>
      )}
      {scrollWidth > clientWidth &&
        scrollLeft + clientWidth < scrollWidth - 5 && (
          <div className="absolute bottom-0.5 right-0 bg-inherit pl-0.5">…</div>
        )}
    </div>
  );
}
