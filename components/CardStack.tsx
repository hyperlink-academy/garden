import type { NextPage } from "next";
import React, { useEffect, useRef, useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import { CardPreview } from "./CardPreview";
import { useSpring, animated } from "@react-spring/web";
import useMeasure from "react-use-measure";
import { usePrevious } from "hooks/utils";
import { useRouter } from "next/router";

export const CardStack = (props: { cards: string[] }) => {
  let [expandAll, setExpandAll] = useState(false);
  let [focusedCardIndex, setFocusedCardIndex] = useState(-1);

  // what do i need. If the value of the slider is =<10 units smaller than the index * 10, then change the max-h of that container.
  return (
    <div>
      <button onClick={() => setExpandAll((e) => !e)}>
        {expandAll ? "collapse" : "expand"}
      </button>
      <div className="">
        {props.cards.map((card, currentIndex) => (
          <Card
            last={currentIndex === props.cards.length - 1}
            key={card}
            entity={card}
            currentIndex={currentIndex}
            focused={currentIndex === focusedCardIndex}
            nextIndex={
              currentIndex === props.cards.length - 1 ? 0 : currentIndex + 1
            }
            onClick={(e) => {
              currentIndex === focusedCardIndex
                ? setFocusedCardIndex(-1)
                : setFocusedCardIndex(currentIndex);

              let element = e.currentTarget;
              setTimeout(
                // if parent is bottomed, do nothing. else:
                () => {
                  let offsetContainerTop =
                    element.offsetTop - element.scrollTop;
                  function getCardParent(
                    node: HTMLElement | null
                  ): HTMLElement | undefined {
                    if (!node) return undefined;
                    if (node.classList.contains("cardContent")) return node;
                    return getCardParent(node.parentElement);
                  }
                  let cardParent = getCardParent(element.parentElement);

                  if (!cardParent) return;

                  cardParent.scrollTo({
                    top: offsetContainerTop - 20,
                    behavior: "smooth",
                  });
                },
                410
              );
            }}
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
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  focused?: boolean;
  last: boolean;
}) => {
  const [ref, data] = useMeasure();

  const CardHeightAnim = useSpring({
    maxHeight: props.focused ? 480 : 40,
  });

  let { query: q } = useRouter();

  // console.log(props.active === true ? "height %:" + heightPercent : null)
  return (
    // if card is focused, then increase the height
    <animated.div
      onClick={(e) => {
        props.onClick(e);
        // console.log(data);
      }}
      ref={ref}
      style={
        props.focused
          ? {
              overflow: "hidden",
              ...CardHeightAnim,
            }
          : props.last
          ? {
              overflow: "hidden",
              height: "auto",
              maxHeight: "480px",
            }
          : {
              overflow: "hidden",
              ...CardHeightAnim,
            }
      }
      className={`cardWrapper -mr-4`}
    >
      <div className="mb-4">
        <CardPreview
          entityID={props.entity}
          size={"big"}
          href={`/s/${q.studio}/s/${q.space}/c/${props.entity}`}
        />
      </div>
    </animated.div>
  );
};
