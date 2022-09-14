import { useState } from "react";
import { CardPreview } from "./CardPreview";
import { useSpring, animated } from "@react-spring/web";
import { useRouter } from "next/router";
import { AddTiny } from "./Icons";
import { ReferenceAttributes } from "data/Attributes";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import useMeasure from "react-use-measure";

export type StackData = {
  parent: string;
  attribute: keyof ReferenceAttributes;
  positionKey: string;
  backlink?: boolean;
};

export const CardStack = (props: { cards: string[] } & StackData) => {
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
          border border-dashed border-grey-80 hover:border-accent-blue rounded-lg 
          text-grey-55 hover:text-accent-blue font-bold
          ${
            expandAll || props.cards.length === 0
              ? "items-center justify-center mb-4"
              : "pt-1 pl-4 pr-3 -mb-4"
          }`}
        >
          Add Card
          <div className="h-6 pt-1">
            <AddTiny />
          </div>
        </div>
        <SortableContext items={props.cards}>
          {props.cards.map((card, currentIndex) => (
            <Card
              expandAll={expandAll}
              parent={props.parent}
              attribute={props.attribute}
              backlink={props.backlink}
              positionKey={props.positionKey}
              last={currentIndex === props.cards.length - 1}
              key={card}
              entity={card}
              currentIndex={currentIndex}
              focused={expandAll || currentIndex === focusedCardIndex}
              nextIndex={
                currentIndex === props.cards.length - 1 ? 0 : currentIndex + 1
              }
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
        </SortableContext>
      </div>
      {props.cards.length === 0 ? (
        <div className="w-4 sm:w-6" />
      ) : (
        <div className="relative flex flex-col w-4 sm:w-6">
          <div className="sticky top-0 -8 z-20 mb-14 mt-2 rotate-90">
            <button
              onClick={() => {
                setExpandAll((e) => !e);
                setFocusedCardIndex(-1);
              }}
              className="font-bold text-grey-55 hover:text-accent-blue text-sm"
            >
              {expandAll ? "collapse" : "expand"}
            </button>
          </div>
          <div className="grow" />
        </div>
      )}
    </div>
  );
};

const Card = (
  props: {
    entity: string;
    currentIndex: number;
    nextIndex?: number;
    onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
    focused?: boolean;
    expandAll: boolean;
    last: boolean;
  } & StackData
) => {
  let [ref, { height }] = useMeasure();
  const CardHeightAnim = useSpring({
    maxHeight: props.focused ? (props.expandAll ? height : 480) : 48,
  });

  let data = {
    entityID: props.entity,
    parent: props.parent,
    attribute: props.attribute,
    positionKey: props.positionKey,
  };
  let { query: q } = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transition,
    transform,
    isDragging,
  } = useSortable({
    id: props.entity,
    data,
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };

  // console.log(props.active === true ? "height %:" + heightPercent : null)
  return (
    // if card is focused, then increase the height

    <div style={style}>
      <animated.div
        onClick={(e) => {
          props.onClick(e);
          // console.log(data);
        }}
        ref={setNodeRef}
        style={
          !props.last
            ? {
                overflow: "hidden",
                marginBottom: props.focused ? "12px" : "-12px",
                ...CardHeightAnim,
              }
            : {
                overflow: "hidden",
                height: "auto",
              }
        }
        className={`cardWrapper -mr-4`}
      >
        <div ref={ref} className="">
          <CardPreview
            dragHandleProps={{ listeners, attributes }}
            entityID={props.entity}
            size={"big"}
            href={`/s/${q.studio}/s/${q.space}/c/${props.entity}`}
          />
        </div>
      </animated.div>
    </div>
  );
};
