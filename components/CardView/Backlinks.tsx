import { ButtonSecondary } from "components/Buttons";
import { FindOrCreate } from "components/FindOrCreateEntity";
import { DeckSmall } from "components/Icons";
import { SmallCardList } from "components/SmallCardList";
import { ReferenceAttributes } from "data/Attributes";
import { Fact } from "data/Facts";
import {
  ReplicacheContext,
  scanIndex,
  useIndex,
  useMutations,
} from "hooks/useReplicache";
import { useContext, useMemo, useState } from "react";
import { generateKeyBetween } from "src/fractional-indexing";
import { sortByPosition } from "src/position_helpers";

export const Backlinks = (props: { entityID: string }) => {
  let backlinks = useIndex.vae(props.entityID);
  let sections = Object.keys(
    backlinks.reduce(
      (acc, c) => {
        acc[c.attribute] = true;
        return acc;
      },
      { "deck/contains": true } as { [k in string]: boolean }
    )
  ) as (keyof ReferenceAttributes)[];

  // filter array for "message/attachedCard"
  // TODO: remove when we add proper chat backlinks
  sections = sections.filter((section) => section != "message/attachedCard");

  return sections.length > 0 ? (
    <div className=" grid grid-flow-row gap-6 ">
      <small className="bg-background rounded-md p-2 font-bold lightBorder">
        This card is part of {sections.length} collection
        {sections.length > 1 ? "s" : ""}
      </small>
      <ul className=" grid grid-flow-row gap-4">
        {sections.map((s) => {
          return (
            <BacklinkSection entityID={props.entityID} attribute={s} key={s} />
          );
        })}
      </ul>
    </div>
  ) : null;
};

const BacklinkSection = (props: {
  entityID: string;
  attribute: keyof ReferenceAttributes;
}) => {
  let backlinkedCards = useIndex.vae(props.entityID, props.attribute);

  let title =
    props.attribute === "deck/contains" ? (
      "Decks"
    ) : (
      <p>
        <span className="">{props.attribute.slice(8)}</span>
        <span className="font-normal normal-case text-grey-55">
          {" "}
          section in
        </span>
      </p>
    );
  return (
    <div className="flex flex-col gap-2">
      <h4>{title}</h4>
      {props.attribute === "deck/contains" ? (
        <AddToDeck entity={props.entityID} />
      ) : null}
      <SmallCardList
        backlink={true}
        attribute={props.attribute}
        cards={backlinkedCards || []}
        deck={props.entityID}
        positionKey="vae"
      />
    </div>
  );
};

const AddToDeck = (props: { entity: string }) => {
  let [open, setOpen] = useState(false);
  const decks = useIndex.aev(open ? "deck" : null);
  const containingDecks = useIndex.vae(props.entity, "deck/contains");
  let rep = useContext(ReplicacheContext);
  let { authorized, mutate } = useMutations();
  let deckEntities = useMemo(() => {
    return decks.map((d) => d.entity);
  }, [decks]);
  const decksWithNames = useIndex.eav(deckEntities, "card/title");
  if (!authorized) return null;
  return (
    <>
      <ButtonSecondary content="Add to deck" onClick={() => setOpen(true)} />
      <FindOrCreate
        allowBlank={false}
        onClose={() => setOpen(false)}
        onSelect={async (d) => {
          if (!rep?.rep) return;
          if (d.type === "create") return;
          let cards = await rep.rep.query((tx) => {
            return scanIndex(tx).eav(d.entity, "deck/contains");
          });
          let lastPosition = cards.sort(sortByPosition("eav"))[cards.length - 1]
            ?.positions.eav;
          mutate("addCardToSection", {
            cardEntity: props.entity,
            parent: d.entity,
            section: "deck/contains",
            positions: { eav: generateKeyBetween(lastPosition || null, null) },
          });
        }}
        selected={containingDecks.map((d) => d.entity)}
        open={open}
        items={decksWithNames
          .filter((d) => !!d)
          .map((d) => {
            let deck = d as Fact<"card/title">;
            return {
              display: deck.value,
              entity: deck.entity,
              icon: <DeckSmall />,
            };
          })}
      />
    </>
  );
};
