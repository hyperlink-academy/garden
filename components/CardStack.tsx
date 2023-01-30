import React, { useContext, useState } from "react";
import { CardPreview } from "./CardPreview";
import { useSpring, animated } from "@react-spring/web";
import { AddTiny, CardSmall as CardIcon, Member } from "./Icons";
import { ReferenceAttributes } from "data/Attributes";
import { SortableContext } from "@dnd-kit/sortable";
import useMeasure from "react-use-measure";
import {
  ReplicacheContext,
  ReplicacheMutators,
  scanIndex,
  useIndex,
  useMutations,
} from "hooks/useReplicache";
import { FindOrCreate } from "./FindOrCreateEntity";
import { ulid } from "src/ulid";
import { sortByPosition } from "src/position_helpers";
import { Fact } from "data/Facts";
import { generateKeyBetween } from "src/fractional-indexing";
import { useSortableCard } from "./DragContext";
import { useLongPress } from "hooks/useLongPress";
import { Replicache } from "replicache";

export type StackData = {
  parent: string;
  attribute: keyof ReferenceAttributes;
  positionKey: string;
};

export const CardStack = (
  props: { cards: Fact<keyof ReferenceAttributes>[] } & StackData
) => {
  let [expandAll, setExpandAll] = useState(false);
  let [focusedCardId, setFocusedCardIndex] = useState<null | string>(null);

  return (
    <div className="relative gap-4 w-full flex">
      <div className="relative grow">
        {
          <AddCard
            expanded={expandAll || props.cards.length === 0}
            parent={props.parent}
            attribute={props.attribute}
            positionKey={props.positionKey}
          />
        }
        <SortableContext items={props.cards.map((c) => c.id)}>
          {props.cards.map((card, currentIndex) => (
            <Card
              factID={card.id}
              expandAll={expandAll}
              parent={props.parent}
              attribute={props.attribute}
              positionKey={props.positionKey}
              last={currentIndex === props.cards.length - 1}
              key={card.id}
              entity={card.value.value}
              currentIndex={currentIndex}
              focused={expandAll || card.id === focusedCardId}
              nextIndex={
                currentIndex === props.cards.length - 1 ? 0 : currentIndex + 1
              }
              onClick={(e) => {
                setFocusedCardIndex(card.id);
                console.log(focusedCardId);
                let element = e.currentTarget;
                //Commented out for now because it messes w/ scroll state when
                //following links!
                // setTimeout(
                //   // if parent is bottomed, do nothing. else:
                //   () => {
                //     let offsetContainerTop =
                //       element.offsetTop - element.scrollTop;
                //     function getCardParent(
                //       node: HTMLElement | null
                //     ): HTMLElement | undefined {
                //       if (!node) return undefined;
                //       if (node.classList.contains("cardContent")) return node;
                //       return getCardParent(node.parentElement);
                //     }
                //     let cardParent = getCardParent(element.parentElement);
                //
                //     if (!cardParent) return;
                //
                //     cardParent.scrollTo({
                //       top: offsetContainerTop - 20,
                //       behavior: "smooth",
                //     });
                //   },
                //   410
                // );
              }}
            />
          ))}
        </SortableContext>
        {props.cards.length === 0 ? (
          ""
        ) : (
          <AddCard
            expanded={expandAll || props.cards.length === 0}
            end
            parent={props.parent}
            attribute={props.attribute}
            positionKey={props.positionKey}
          />
        )}
      </div>
      {props.cards.length === 0 ? null : (
        <div className="cardStackCollapseExpand relative shrink-0 w-4">
          <div className="sticky top-0 z-20 mt-2 mb-12 pt-3 whitespace-nowrap rotate-90">
            <button
              onClick={() => {
                setExpandAll((e) => !e);
                setFocusedCardIndex(null);
              }}
              className="font-bold text-grey-55 hover:text-accent-blue text-sm relative -top-2"
            >
              {expandAll ? "collapse" : "expand"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Card = (
  props: {
    entity: string;
    currentIndex: number;
    factID: string;
    nextIndex?: number;
    onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
    focused?: boolean;
    expandAll: boolean;
    last: boolean;
  } & StackData
) => {
  let [ref, { height }] = useMeasure();

  let data = {
    entityID: props.entity,
    factID: props.factID,
    parent: props.parent,
    attribute: props.attribute,
    positionKey: props.positionKey,
  };
  let { mutate } = useMutations();
  const {
    attributes,
    listeners,
    setNodeRef,
    transition,
    transform,
    isDragging,
  } = useSortableCard({
    id: props.factID,
    data,
  });

  let focused = props.focused && !isDragging;
  // console.log(focused);
  const CardHeightAnim = useSpring({
    config: { mass: 0.1, tension: 500, friction: 25 },
    maxHeight: focused ? height : 52,
    marginBottom: focused ? 12 : -12,
  });

  const style = {
    zIndex: !isDragging ? undefined : 256,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };

  return (
    // if card is focused, then increase the height

    <div style={style} className="relative">
      <animated.div
        onClick={(e) => {
          props.onClick(e);
        }}
        ref={setNodeRef}
        className={`-mr-4`}
        style={
          !props.last
            ? {
                overflow: "hidden",
                ...CardHeightAnim,
              }
            : {
                overflow: "hidden",
                ...CardHeightAnim,
                // maxHeight: 128,
                // maxHeight: height,
              }
        }
      >
        <div ref={ref} className="w-full">
          <CardPreview
            factID={props.factID}
            dragHandleProps={{ listeners, attributes }}
            onDelete={() => {
              mutate("retractFact", { id: props.factID });
            }}
            entityID={props.entity}
            size={"big"}
          />
        </div>
      </animated.div>
    </div>
  );
};

const AddCard = (props: { expanded: boolean; end?: boolean } & StackData) => {
  let [open, setOpen] = useState(false);
  let titles = useIndex
    .aev(open ? "card/title" : null)
    .filter((f) => !!f.value);
  let members = useIndex.aev("member/name");
  let { handlers, isLongPress } = useLongPress(async () => {
    if (!rep?.rep) return;
    let entity = ulid();
    create(entity, props, rep.rep, mutate);
  });
  let items = titles
    .map((t) => {
      return {
        entity: t.entity,
        display: t.value,
        icon: <CardIcon />,
      };
    })
    .concat(
      members.map((m) => {
        return {
          entity: m.entity,
          display: m.value,
          icon: <Member />,
        };
      })
    )
    .filter((f) => props.attribute !== "deck/contains");
  const alreadyInEAV = useIndex.eav(props.parent, props.attribute);

  let rep = useContext(ReplicacheContext);
  let { authorized, mutate, memberEntity, action } = useMutations();
  if (!authorized) return null;
  return (
    <>
      <button
        {...handlers}
        onClick={() => !isLongPress.current && setOpen(true)}
        className={`
          cardStackNewCard 
          w-full h-12 
          grid grid-cols-[auto_max-content] 
          border border-dashed border-grey-80 hover:border-accent-blue rounded-lg 
          text-grey-55 hover:text-accent-blue font-bold
          justify-end

          ${
            !props.end
              ? props.expanded
                ? "gap-2 items-center justify-center mb-4"
                : "pt-2 pl-4 pr-3 -mb-2"
              : props.expanded
              ? "gap-2 items-center justify-center mt-4"
              : "mt-3 pt-3 pl-4 pr-3"
          }
          `}
      >
        {props.expanded ? "Attach Card" : ""}
        <div className="h-6 pt-1">
          <AddTiny />
        </div>
      </button>
      <FindOrCreate
        allowBlank={true}
        onClose={() => setOpen(false)}
        //START OF ON SELECT LOGIC
        onSelect={async (cards) => {
          if (!rep?.rep || !memberEntity) return;
          // if youre adding to a backlink section, then the entity is a string
          // if youre creating a new deck

          action.start();

          for (let d of cards) {
            let entity: string;
            if (d.type === "existing") entity = d.entity;
            else {
              entity = ulid();
              await mutate("createCard", {
                entityID: entity,
                title: d.name,
                memberEntity,
              });
            }
            create(entity, props, rep.rep, mutate);
          }

          action.end();
        }}
        // END OF ONSELECT LOGIC
        selected={alreadyInEAV?.map((d) => d.value.value) || []}
        open={open}
        items={items}
      />
    </>
  );
};

const create = async (
  entity: string,
  props: StackData & { end?: boolean | undefined },
  rep: Replicache<ReplicacheMutators>,
  mutate: ReturnType<typeof useMutations>["mutate"]
) => {
  let position;
  let positionKey = "eav";

  let siblings =
    (await rep.query((tx) => {
      return scanIndex(tx).eav(props.parent, props.attribute);
    })) || [];

  if (props.end) {
    let lastPosition = siblings.sort(sortByPosition(positionKey))[
      siblings.length - 1
    ]?.positions[positionKey];
    position = generateKeyBetween(lastPosition || null, null);
  } else {
    let firstPosition = siblings.sort(sortByPosition(positionKey))[0]
      ?.positions[positionKey];
    position = generateKeyBetween(null, firstPosition || null);
  }

  await mutate("addCardToSection", {
    cardEntity: entity,
    parent: props.parent,
    section: props.attribute,
    positions: {
      eav: position,
    },
  });
};
