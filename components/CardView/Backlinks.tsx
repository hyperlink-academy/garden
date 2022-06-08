import { ButtonSecondary } from "components/Buttons";
import { FindOrCreate } from "components/FindOrCreateEntity";
import { Card, DeckSmall, Member } from "components/Icons";
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
import { ulid } from "src/ulid";

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
      <AddToSection entity={props.entityID} attribute={props.attribute} />
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

const AddToSection = (props: {
  entity: string;
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
        !!decks.find((d) => f.entity === d.entity)
    );
  const alreadyIn = useIndex.vae(props.entity, props.attribute);

  let rep = useContext(ReplicacheContext);
  let { authorized, mutate } = useMutations();
  if (!authorized) return null;
  return (
    <>
      <ButtonSecondary content="Add" onClick={() => setOpen(true)} />
      <FindOrCreate
        allowBlank={false}
        onClose={() => setOpen(false)}
        onSelect={async (d) => {
          if (!rep?.rep) return;
          if (d.type === "create") return;
          let cards = await rep.rep.query((tx) => {
            return scanIndex(tx).eav(d.entity, props.attribute);
          });
          if (props.attribute !== "deck/contains") {
            let existingSections = await rep.rep.query((tx) =>
              scanIndex(tx).eav(d.entity, "card/section")
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
                cardEntity: d.entity,
                positions: "",
              });
            }
          }
          let lastPosition = cards.sort(sortByPosition("eav"))[cards.length - 1]
            ?.positions.eav;
          await mutate("addCardToSection", {
            cardEntity: props.entity,
            parent: d.entity,
            section: props.attribute,
            positions: { eav: generateKeyBetween(lastPosition || null, null) },
          });
        }}
        selected={alreadyIn.map((d) => d.entity)}
        open={open}
        items={items}
      />
    </>
  );
};
