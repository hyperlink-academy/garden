import { ReplicacheContext, useIndex } from "hooks/useReplicache";
import { Disclosure } from "@headlessui/react";
import useMeasure from "react-use-measure";
import { SmallCard } from "components/SmallCard";
import { animated, useSpring } from "react-spring";
import { usePrevious } from "hooks/utils";
import {
  closestCenter,
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ReferenceAttributes } from "data/Attributes";
import { Fact } from "data/Facts";
import { SortableContext } from "@dnd-kit/sortable";
import { useContext, useEffect, useState } from "react";
import { FindOrCreateCard } from "./FindOrCreateEntity";
import { ButtonLink, ButtonSecondary } from "./Buttons";
import { Card } from "./Icons";
import { generateKeyBetween } from "src/fractional-indexing";
import { sortByPosition } from "src/position_helpers";
import { ulid } from "src/ulid";
import { useRouter } from "next/router";

export const DeckList = () => {
  let decks = useIndex.aev("deck").sort(sortByPosition("aev"));
  let rep = useContext(ReplicacheContext);
  let [newDeckName, setNewDeckName] = useState("");
  let [toggleAll, setToggleAll] = useState<boolean | undefined>(undefined);
  return (
    <div>
      <div className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between">
          <div className="flex">
            <input
              className="mr-2"
              value={newDeckName}
              placeholder="new deck"
              onChange={(e) => setNewDeckName(e.currentTarget.value)}
            />
            <ButtonSecondary
              content="create"
              onClick={() => {
                let entity = ulid();
                rep?.rep.mutate.addDeck({
                  newEntity: entity,
                  name: newDeckName,
                  position: generateKeyBetween(
                    decks[decks.length]?.positions.aev || null,
                    null
                  ),
                });
              }}
            />
          </div>
          <div className="self-left sm:self-center py-2">
            <ButtonLink
              onClick={() => setToggleAll(!toggleAll)}
              content="toggle all"
            />
          </div>
        </div>
      </div>
      {decks.map((d) => (
        <Deck entity={d.entity} toggleAll={toggleAll} key={d.entity} />
      ))}
    </div>
  );
};

let openStates: { [key: string]: boolean | undefined } = {};

const Deck = (props: { entity: string; toggleAll: boolean | undefined }) => {
  let title = useIndex.eav(props.entity, "card/title");
  let rep = useContext(ReplicacheContext);
  let description = useIndex.eav(props.entity, "card/content");
  let cards = useIndex.eav(props.entity, "deck/contains");
  let lastCard = cards?.sort(sortByPosition("eav"))[cards.length - 1];
  let [findOpen, setFindOpen] = useState(false);
  let [drawerOpen, setDrawerOpen] = useState(openStates[props.entity]);
  useEffect(() => {
    openStates[props.entity] = drawerOpen;
  }, [drawerOpen]);
  useEffect(() => {
    if (props.toggleAll !== undefined) setDrawerOpen(props.toggleAll);
  }, [props.toggleAll]);

  return (
    <div className="pb-4">
      <Disclosure>
        <div className="pb-2" onClick={() => setDrawerOpen(!drawerOpen)}>
          <h3 className="text-grey-35 text-xl">{title?.value}</h3>
          {description?.value}
        </div>
        <Drawer open={!!drawerOpen}>
          <ButtonSecondary
            onClick={() => setFindOpen(true)}
            icon={<Card />}
            content="Add cards"
          />
          <FindOrCreateCard
            allowBlank={true}
            onSelect={async (e) => {
              let position = generateKeyBetween(
                lastCard?.positions["eav"] || null,
                null
              );
              if (e.type === "create") {
                let newEntity = ulid();
                await rep?.rep.mutate.createCard({
                  entityID: newEntity,
                  title: e.name,
                });
                await rep?.rep.mutate.addCardToSection({
                  cardEntity: newEntity,
                  parent: props.entity,
                  positions: { eav: position },
                  section: "deck/contains",
                });
                return;
              }
              rep?.rep.mutate.addCardToSection({
                cardEntity: e.entity,
                parent: props.entity,
                positions: { eav: position },
                section: "deck/contains",
              });
            }}
            open={findOpen}
            onClose={() => setFindOpen(false)}
            selected={cards?.map((c) => c.value.value) || []}
          />
          <SmallCardList
            attribute="deck/contains"
            positionKey="eav"
            deck={props.entity}
            cards={cards || []}
          />
        </Drawer>
      </Disclosure>
    </div>
  );
};

export const Drawer: React.FC<{ open: boolean }> = (props) => {
  const [ref, { height: viewHeight }] = useMeasure();
  const previousState = usePrevious(props.open);
  const { height, arrowHeight } = useSpring({
    config: { mass: 0.1, tension: 500, friction: 25 },
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
                "polygon(0 0, 0 100% , 20px 100% ,  36px 100%, 52px 100%, 100% 100%, 100% 0)",
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
                    ? `polygon(0 0, 0 100% , 20px 100% ,  36px 0, 52px 100%, 100% 100%, 100% 0)`
                    : arrowHeight.to(
                        (h) =>
                          `polygon(0 0, 0 ${h}% , 20px ${h}% ,  36px 0, 52px ${h}%, 100% ${h}%, 100% 0)`
                      ),
              }}
            />
          </div>
          <div className="pb-4 pt-8 px-4">{props.children}</div>
        </div>
      </Disclosure.Panel>
    </animated.div>
  );
};

export const SmallCardList = (props: {
  cards: Fact<keyof ReferenceAttributes>[];
  deck: string;
  attribute: keyof ReferenceAttributes;
  positionKey: string;
}) => {
  let { studio, space } = useRouter().query;
  const mouseSensor = useSensor(MouseSensor, {});
  const touchSensor = useSensor(TouchSensor, {});
  const sensors = useSensors(mouseSensor, touchSensor);
  let rep = useContext(ReplicacheContext);
  let [dragging, setDraggging] = useState<string | null>(null);
  let items = props.cards.sort(sortByPosition(props.positionKey));

  return (
    <DndContext
      collisionDetection={closestCenter}
      sensors={sensors}
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
            attribute: props.attribute,
            index: currentIndex < index ? index : index - 1,
          });
        }
      }}
    >
      <SortableContext items={items.map((item) => item.id)}>
        <div className="flex flex-wrap gap-8 pt-8 pb-6">
          {items.map((c) => (
            <SmallCard
              onDelete={() => {
                rep?.rep.mutate.removeCardFromSection({
                  id: c.id,
                });
              }}
              draggable={true}
              key={c.id}
              href={`/s/${studio}/s/${space}/c/${c.value.value}`}
              entityID={c.value.value}
              id={c.id}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
