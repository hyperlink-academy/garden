import { useContext, useState } from "react";
import { CardPreview } from "./CardPreview";
import { useSpring, animated } from "@react-spring/web";
import { useRouter } from "next/router";
import { AddTiny, DeckSmall, Card as CardIcon, Member } from "./Icons";
import { ReferenceAttributes } from "data/Attributes";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import useMeasure from "react-use-measure";
import {
  ReplicacheContext,
  scanIndex,
  useIndex,
  useMutations,
} from "hooks/useReplicache";
import { FindOrCreate } from "./FindOrCreateEntity";
import { ulid } from "src/ulid";
import { sortByPosition } from "src/position_helpers";
import { Fact } from "data/Facts";
import { generateKeyBetween } from "src/fractional-indexing";

export type StackData = {
  parent: string;
  attribute: keyof ReferenceAttributes;
  positionKey: string;
  backlink?: boolean;
};

export const CardStack = (props: { cards: string[] } & StackData) => {
  let [expandAll, setExpandAll] = useState(false);
  let [focusedCardIndex, setFocusedCardIndex] = useState(-1);

  return (
    <div className="relative flex gap-2 w-full">
      <div className="grow">
        <AddCard
          expanded={expandAll || props.cards.length === 0}
          parent={props.parent}
          attribute={props.attribute}
          backlink={props.backlink}
          positionKey={props.positionKey}
        />
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
    backlink: props.backlink,
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

const AddCard = (props: { expanded: boolean } & StackData) => {
  let [open, setOpen] = useState(false);
  let titles = useIndex
    .aev(open ? "card/title" : null)
    .filter((f) => !!f.value);
  let members = useIndex.aev("member/name");
  const decks = useIndex.aev(open ? "deck" : null);
  let items = titles
    .map((t) => {
      return {
        entity: t.entity,
        display: t.value,
        icon: !!decks.find((d) => t.entity === d.entity) ? (
          <DeckSmall />
        ) : (
          <CardIcon />
        ),
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
    .filter(
      (f) =>
        props.attribute !== "deck/contains" ||
        !props.backlink ||
        !!decks.find((d) => f.entity === d.entity)
    );
  const alreadyIn = useIndex.vae(props.parent, props.attribute);
  const alreadyInEAV = useIndex.eav(props.parent, props.attribute);

  let rep = useContext(ReplicacheContext);
  let { authorized, mutate } = useMutations();
  if (!authorized) return null;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`
          cardStackNewCard 
          w-full h-12 
          grid grid-cols-[auto_max-content] gap-2 
          border border-dashed border-grey-80 hover:border-accent-blue rounded-lg 
          text-grey-55 hover:text-accent-blue font-bold
          ${
            props.expanded
              ? "items-center justify-center mb-4"
              : "pt-1 pl-4 pr-3 -mb-4"
          }`}
      >
        Add Card
        <div className="h-6 pt-1">
          <AddTiny />
        </div>
      </button>
      <FindOrCreate
        allowBlank={true}
        onClose={() => setOpen(false)}
        //START OF ON SELECT LOGIC
        onSelect={async (d) => {
          if (!rep?.rep) return;
          // if youre adding to a backlink section, then the entity is a string
          // if youre creating a new deck
          if (props.backlink) {
            let entity: string;

            if (d.type === "create") {
              entity = ulid();
              if (props.attribute === "deck/contains") {
                let decks = await rep.rep.query(async (tx) => {
                  let results = await tx
                    .scan({
                      indexName: "aev",
                      prefix: `deck-`,
                    })
                    .values()
                    .toArray();
                  return results as Fact<"deck">[];
                });

                let decksLastPosition = decks.sort(sortByPosition("aev"))[
                  decks.length - 1
                ]?.positions.aev;
                mutate("addDeck", {
                  newEntity: entity,
                  newHomeEntity: ulid(),
                  name: "",
                  position: generateKeyBetween(decksLastPosition || null, null),
                });
              }
              if (d.name) {
                await mutate("createCard", {
                  entityID: entity,
                  title: d.name,
                });
              }
            } else {
              entity = d.entity;
            }

            let cards = await rep.rep.query((tx) => {
              return scanIndex(tx).eav(entity, props.attribute);
            });
            if (props.attribute !== "deck/contains") {
              let existingSections = await rep.rep.query((tx) =>
                scanIndex(tx).eav(entity, "card/section")
              );
              if (
                !existingSections.find(
                  (f) => f.value === props.attribute.slice(8)
                )
              ) {
                await mutate("addSection", {
                  newSectionEntity: ulid(),
                  sectionName: props.attribute.slice(8),
                  type: "reference",
                  cardEntity: entity,
                  positions: "",
                });
              }
            }
            let lastPosition = cards.sort(sortByPosition("eav"))[
              cards.length - 1
            ]?.positions.eav;
            await mutate("addCardToSection", {
              cardEntity: props.parent,
              parent: entity,
              section: props.attribute,
              positions: {
                eav: generateKeyBetween(lastPosition || null, null),
              },
            });
            return;
          }

          let cards = await rep.rep.query((tx) => {
            return scanIndex(tx).eav(props.parent, props.attribute);
          });
          let lastPosition = cards.sort(sortByPosition("eav"))[cards.length - 1]
            ?.positions.eav;

          let entity;
          if (d.type === "create") {
            entity = ulid();
            if (d.name) {
              await mutate("createCard", {
                entityID: entity,
                title: d.name,
              });
            }
          } else {
            entity = d.entity;
          }
          await mutate("addCardToSection", {
            cardEntity: entity,
            parent: props.parent,
            section: props.attribute,
            positions: {
              eav: generateKeyBetween(lastPosition || null, null),
            },
          });
        }}
        // END OF ONSELECT LOGIC
        selected={
          props.backlink
            ? alreadyIn.map((d) => d.entity)
            : alreadyInEAV?.map((d) => d.value.value) || []
        }
        open={open}
        items={items}
      />
    </>
  );
};
