import { SortableContext } from "@dnd-kit/sortable";
import { ReferenceAttributes, ShortCodes } from "data/Attributes";
import { Fact } from "data/Facts";
import {
  ReplicacheContext,
  scanIndex,
  useIndex,
  useMutations,
} from "hooks/useReplicache";
import { useRouter } from "next/router";
import { useState, useContext } from "react";
import { generateKeyBetween } from "src/fractional-indexing";
import { sortByPosition } from "src/position_helpers";
import { ulid } from "src/ulid";
import { FindOrCreate } from "./FindOrCreateEntity";
import { Add, Card, DeckSmall, Member } from "./Icons";
import { SortableSmallCard } from "./SmallCard";

// Currently this is rendered inside a DnD Context and used in a couple
// different places.
export const SmallCardList = (props: {
  cards: Fact<keyof ReferenceAttributes>[];
  deck: string;
  addCard?: () => {};
  attribute: keyof ReferenceAttributes;
  horizontal?: boolean;
  positionKey: string;
  backlink?: boolean;
}) => {
  let { studio, space } = useRouter().query;
  let { authorized, mutate } = useMutations();
  let items = props.cards.sort(sortByPosition(props.positionKey));
  let itemsCount = items ? items.length : 0;

  return (
    <SortableContext items={items}>
      <style jsx>{`
        @media (max-width: 360px) {
          .smallCardList {
            place-content: space-between;
            gap: 1rem 0rem;
          }
        }
      `}</style>
      <div
        className={`smallCardList flex w-full gap-4 ${
          props.horizontal ? "py-2" : "flex-wrap"
        }`}
      >
        {items.map((c, index) => {
          let entity = props.backlink ? c.entity : c.value.value;
          let attribute = ShortCodes[props.attribute]
            ? ShortCodes[props.attribute]
            : props.attribute.slice(8);

          return (
            <SortableSmallCard
              parent={props.deck}
              positionKey={props.positionKey}
              section={props.attribute}
              index={index}
              onDelete={
                !authorized
                  ? undefined
                  : () => {
                      mutate("removeCardFromSection", {
                        id: c.id,
                      });
                    }
              }
              draggable={authorized}
              key={c.id}
              href={`/s/${studio}/s/${space}/c/${props.deck}/${
                props.backlink ? "b" : "a"
              }/${attribute}/${entity}`}
              entityID={entity}
              id={c.id}
            />
          );
        })}
        <AddToSection
          attribute={props.attribute}
          entity={props.deck}
          backlink={props.backlink}
        />
      </div>
    </SortableContext>
  );
};
const AddToSection = (props: {
  entity: string;
  backlink?: boolean;
  attribute: keyof ReferenceAttributes;
}) => {
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
          <Card />
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
  const alreadyIn = useIndex.vae(props.entity, props.attribute);
  const alreadyInEAV = useIndex.eav(props.entity, props.attribute);

  let rep = useContext(ReplicacheContext);
  let { authorized, mutate } = useMutations();
  if (!authorized) return null;
  return (
    <>
      {/* height and width of this add card button should match the height and width of the small card (SmallCard.tsx) */}
      <button
        className={`
        AddCardToBacklinkButton
        h-24 w-[151px] 
        text-grey-55 hover:text-accent-blue
        border border-dashed border-grey-55 rounded-lg hover:border-accent-blue 
        grid place-items-center`}
        onClick={() => setOpen(true)}
      >
        <Add />
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
              cardEntity: props.entity,
              parent: entity,
              section: props.attribute,
              positions: {
                eav: generateKeyBetween(lastPosition || null, null),
              },
            });
          } else {
            let cards = await rep.rep.query((tx) => {
              return scanIndex(tx).eav(props.entity, props.attribute);
            });
            let lastPosition = cards.sort(sortByPosition("eav"))[
              cards.length - 1
            ]?.positions.eav;

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
              parent: props.entity,
              section: props.attribute,
              positions: {
                eav: generateKeyBetween(lastPosition || null, null),
              },
            });
          }
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
