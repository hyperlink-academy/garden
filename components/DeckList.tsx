import { ReplicacheContext, useIndex } from "hooks/useReplicache";
import { Disclosure } from "@headlessui/react";
import useMeasure from "react-use-measure";
import { SmallCard } from "components/SmallCard";
import { animated, useSpring } from "react-spring";
import { usePrevious } from "hooks/utils";
import { DndContext, useDroppable } from "@dnd-kit/core";
import { Attribute, ReferenceAttributes } from "data/Attributes";
import { Fact } from "data/Facts";
import { SortableContext } from "@dnd-kit/sortable";
import { useContext, useState } from "react";

export const DeckList = () => {
  let decks = useIndex.aev("deck");
  return (
    <div>
      <button>CreateNewDeck</button>
      {decks.map((d) => (
        <Deck entity={d.entity} key={d.entity} />
      ))}
    </div>
  );
};

const Deck = (props: { entity: string }) => {
  let title = useIndex.eav(props.entity, "card/title");
  let description = useIndex.eav(props.entity, "card/content");
  let cards = useIndex.eav(props.entity, "deck/contains");

  return (
    <div>
      <Disclosure>
        {({ open }) => {
          return (
            <>
              <Disclosure.Button as="div">
                <h3 className="text-grey-35 text-xl">{title?.value}</h3>
                {description?.value}
              </Disclosure.Button>
              <Drawer open={open}>
                <SmallCardList
                  positionKey="eav"
                  deck={props.entity}
                  cards={cards || []}
                />
              </Drawer>
            </>
          );
        }}
      </Disclosure>
    </div>
  );
};

export const Drawer: React.FC<{ open: boolean }> = (props) => {
  const [ref, { height: viewHeight }] = useMeasure();
  const previousState = usePrevious(props.open);
  const { height, arrowHeight } = useSpring({
    from: { height: 0, opacity: 0, arrowHeight: 0 },
    to: {
      arrowHeight: props.open ? 100 : 0,
      height: props.open ? viewHeight : 0,
    },
  });
  return (
    <animated.div
      style={{
        height: props.open && previousState === props.open ? "auto" : height,
        overflow: "hidden",
      }}
    >
      <Disclosure.Panel static>
        <div
          className="bg-bg-drawer"
          ref={ref}
          style={{
            boxShadow:
              "inset 0px -4px 3px -3px rgba(0, 0, 0, 0.25), inset 0px 9px 6px -6px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div
            style={{
              height: "64px",
              marginBottom: "-32px",
              filter:
                "drop-shadow(0 -1px 3px rgb(0, 0, 0, 0.25)) drop-shadow(0 3px 6px rgb(0, 0, 0, 0.25))",
              clipPath:
                "polygon(0 0, 0 100% , 20px 100% ,  36px 100%, 52px 100%, 100% 100%, 100% 0)",
              overflow: "hidden",
            }}
          >
            <animated.div
              className="bg-background mb-2"
              style={{
                width: "100%",
                height: "16px",
                clipPath: arrowHeight.to(
                  (h) =>
                    `polygon(0 0, 0 ${h}% , 20px ${h}% ,  36px 0, 52px ${h}%, 100% ${h}%, 100% 0)`
                ),
              }}
            />
          </div>
          <div className="pb-4">{props.children}</div>
        </div>
      </Disclosure.Panel>
    </animated.div>
  );
};

export const SmallCardList = (props: {
  cards: Fact<keyof ReferenceAttributes>[];
  deck: string;
  positionKey: string;
}) => {
  let rep = useContext(ReplicacheContext);
  let [dragging, setDraggging] = useState<string | null>(null);
  let { setNodeRef } = useDroppable({
    id: props.deck,
  });
  let items = props.cards.sort(sortByPosition(props.positionKey));
  return (
    <DndContext
      onDragStart={({ active }) => {
        setDraggging(active.id);
      }}
      onDragEnd={({ over }) => {
        setDraggging(null);
        if (over) {
          if (!dragging) return;
          let index = items.findIndex((f) => f.id === over.id);
          let currentIndex = items.findIndex((f) => f.id === dragging);
          if (index === -1) return;
          rep?.rep.mutate.moveCard({
            factID: dragging,
            positionKey: props.positionKey,
            parent: props.deck,
            attribute: "deck/contains",
            index: currentIndex < index ? index : index - 1,
          });
        }
      }}
    >
      <SortableContext items={items.map((item) => item.id)}>
        <div className="flex flex-wrap gap-8 p-8" ref={setNodeRef}>
          {items.map((c) => (
            <SmallCard
              draggable={true}
              key={c.id}
              href=""
              entityID={c.value.value}
              id={c.id}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export const sortByPosition =
  (key: string) =>
  (
    a: Pick<Fact<keyof Attribute>, "positions" | "id">,
    b: Pick<Fact<keyof Attribute>, "positions" | "id">
  ) => {
    let aPosition = a.positions[key],
      bPosition = b.positions[key];
    if (!aPosition) {
      if (bPosition) return -1;
      return a.id > b.id ? 1 : -1;
    }
    if (!bPosition) return -1;
    if (aPosition === bPosition) return a.id > b.id ? 1 : -1;
    return aPosition > bPosition ? 1 : -1;
  };
