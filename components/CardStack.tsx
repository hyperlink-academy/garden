import type { NextPage } from "next";
import React, { useEffect, useRef, useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import { CardPreview } from "./CardPreview";
import { useSpring, animated } from "@react-spring/web";
import useMeasure from "react-use-measure";
import { usePrevious } from "hooks/utils";
import { useRouter } from "next/router";
import { Add, AddTiny } from "./Icons";
import {
  ButtonLink,
  ButtonPrimary,
  ButtonSecondary,
  ButtonTertiary,
} from "./Buttons";

export const CardStack = (props: { cards: string[] }) => {
  let [expandAll, setExpandAll] = useState(false);
  let [focusedCardIndex, setFocusedCardIndex] = useState(-1);

  // what do i need. If the value of the slider is =<10 units smaller than the index * 10, then change the max-h of that container.
  return (
    <div className="relative flex gap-2 w-full">
      <div className="grow">
        <div
          className={`
          cardStackNewCard 
          w-full h-12 
          grid grid-cols-[auto_max-content] gap-2 
          border  border-accent-blue rounded-lg 
          text-accent-blue font-bold
          hover:bg-bg-blue hover:border-2 
          ${
            expandAll || props.cards.length === 0
              ? "items-center justify-center mb-4"
              : "pt-1 pl-4 pr-3 -mb-4 hover:pl-[15px] hover:pr-[11px] hover:pt-[3px]"
          }`}
        >
          Add Card!{" "}
          <div className="h-6 pt-1">
            <AddTiny />
          </div>
        </div>
        {props.cards.map((card, currentIndex) => (
          <Card
            key={card}
            entity={card}
            last={currentIndex === props.cards.length - 1}
            focused={currentIndex === focusedCardIndex}
            expandAll={expandAll}
            onClick={(e) => {
              setFocusedCardIndex(currentIndex);

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
      {props.cards.length === 0 ? null : (
        <div className="relative flex flex-col w-8">
          <div className="sticky top-0 -8 z-20 mb-14 mt-1 rotate-90">
            <ButtonLink
              content={expandAll ? "collapse" : "expand"}
              onClick={() => setExpandAll((e) => !e)}
            />
          </div>
          <div className="grow" />
        </div>
      )}
    </div>
  );
};

const Card = (props: {
  entity: string;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  focused?: boolean;
  last: boolean;
  expandAll: boolean;
}) => {
  const [ref, data] = useMeasure();

  const CardHeightAnim = useSpring({
    maxHeight: props.focused ? 480 : 48,
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
        props.expandAll
          ? {}
          : props.focused && !props.last
          ? {
              overflow: "hidden",
              marginBottom: "-12px",
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
              marginBottom: "-12px",
              ...CardHeightAnim,
            }
      }
      className={`cardWrapper -mr-4`}
    >
      <div className="mb-4">
        <Careview
          entityID={props.entity}
          size={"big"}
          href={`/s/${q.studio}/s/${q.space}/c/${props.entity}`}
        />
      </div>
    </animated.div>
  );
};
