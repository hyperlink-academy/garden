import { Disclosure } from "@headlessui/react";
import useMeasure from "react-use-measure";
import { animated, useSpring } from "@react-spring/web";
import { usePrevious } from "hooks/utils";

export const Drawer: React.FC<{
  open: boolean;
  bump?: number;
  skipAnimation?: boolean;
}> = (props) => {
  const [ref, { height: viewHeight }] = useMeasure();
  const previousState = usePrevious(props.open);
  const { height, arrowHeight } = useSpring({
    config: { mass: 0.1, tension: 500, friction: 25 },
    immediate: props.skipAnimation,
    from: { height: 0, opacity: 0, arrowHeight: 0 },
    to: {
      arrowHeight: props.open ? 100 : 0,
      height: props.open ? viewHeight : 0,
    },
  });
  let bump = props.bump || 0;

  return (
    <animated.div
      style={{
        height: props.open && previousState === props.open ? "auto" : height,
        overflow: "hidden",
      }}
      className="-mx-4"
    >
      <Disclosure.Panel static>
        <div
          className="bg-bg-drawer"
          ref={ref}
          style={{
            boxShadow:
              "rgb(0 0 0 / 25%) 0px -4px 4px -4px inset, rgb(0 0 0 / 25%) 0px 6px 6px -6px inset",
          }}
        >
          <div
            style={{
              height: "48px",
              marginBottom: "-32px",
              filter: "drop-shadow(rgba(0, 0, 0, 0.25) 0px 1px 2px)",
              clipPath:
                "polygon(0 0, 0 100%, 34px 100%,  50px 100%, 66px 100%, 100% 100%, 100% 0)",
              overflow: "hidden",
            }}
          >
            <animated.div
              className="bg-background mb-2"
              style={{
                width: "100%",
                height: "16px",
                clipPath:
                  props.open && previousState === props.open
                    ? `polygon(0 0,
                    0 100%,
                    ${bump + 34}px 100%,
                    ${bump + 50}px 0,
                    ${bump + 66}px 100%,
                    100% 100%,
                    100% 0)`
                    : arrowHeight.to(
                        (h) =>
                          `polygon(0 0,
                          0 ${h}%,
                          ${bump + 34}px ${h}%,
                          ${bump + 50}px 0,
                          ${bump + 66}px ${h}%,
                          100% ${h}%,
                          100% 0)`
                      ),
              }}
            />
          </div>
          <div className="pb-4 pt-6 px-4">{props.children}</div>
        </div>
      </Disclosure.Panel>
    </animated.div>
  );
};
