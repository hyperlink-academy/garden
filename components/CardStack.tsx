import type { NextPage } from "next";
import { useEffect, useRef, useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import { CardPreview } from "./CardPreview";
import { useSpring, animated } from "@react-spring/web";
import useMeasure from "react-use-measure";
import { usePrevious } from "hooks/utils";
import { useRouter } from "next/router";

export const CardStack = (props: { cards: string[] }) => {
  let [sliderPosition, setSliderPosition] = useState(-1);
  let [expanded, setExpanded] = useState(false);

  // what do i need. If the value of the slider is =<10 units smaller than the index * 10, then change the max-h of that container.
  return (
    <div>
      <button onClick={() => setExpanded((e) => !e)}>
        {expanded ? "collapse" : "expand"}
      </button>
      <div className="">
        {props.cards.map((card, currentIndex) => (
          <Card
            last={currentIndex === props.cards.length - 1}
            key={card}
            entity={card}
            currentIndex={currentIndex}
            nextIndex={currentIndex + 1}
            sliderPosition={sliderPosition}
            onClick={() => {
              setSliderPosition(currentIndex);
            }}
            active={
              expanded ||
              (sliderPosition - currentIndex < 1 &&
                sliderPosition - currentIndex >= 0)
            }
            next={
              currentIndex - sliderPosition < 1 &&
              currentIndex - sliderPosition > 0
            }
          />
        ))}
      </div>
    </div>
  );
};

const Card = (props: {
  entity: string;
  currentIndex: number;
  nextIndex?: number;
  sliderPosition: number;
  onClick: () => void;
  active?: boolean;
  last: boolean;
  next?: boolean;
}) => {
  const [ref, { height: viewHeight }] = useMeasure();
  const { height } = useSpring({
    from: { height: 32 },
    to: {
      height: props.active ? viewHeight : 32,
    },
  });

  let { query: q } = useRouter();
  // console.log(props.active === true ? "height %:" + heightPercent : null)
  return (
    // if card is focused, then increase the height
    <animated.div
      onClick={() => props.onClick()}
      style={{
        height: props.active || props.last ? "auto" : height,
        overflow: "hidden",
        marginBottom: props.active || props.last ? "16px" : "0",
      }}
      className={`cardWrapper`}
    >
      <div ref={ref}>
        <CardPreview
          entityID={props.entity}
          size={"big"}
          href={`/s/${q.studio}/s/${q.space}/c/${props.entity}`}
        />
      </div>
    </animated.div>
  );
};
