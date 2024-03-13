"use client";

import { useSpring, animated } from "@react-spring/web";
import { useState } from "react";

export default function Sidebar(props: { children: React.ReactNode }) {
  let [open, setOpen] = useState(true);
  let spring = useSpring({
    width: open ? 256 : 16,
    config: { duration: 200 },
  });
  return (
    <animated.div
      style={spring}
      className="lightBorder flex w-64 shrink-0 flex-col overflow-hidden bg-white "
    >
      <div className="w-64">
        <div className="h-full w-full overflow-x-hidden  py-3 ">
          <button onClick={() => setOpen(!open)}>toggle</button>
          {props.children}
        </div>
      </div>
    </animated.div>
  );
}
