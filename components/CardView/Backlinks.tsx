import { DeckSmall, SectionLinkedCard } from "components/Icons";
import { Divider } from "components/Layout";
import { SmallCardList } from "components/SmallCardList";
import { ReferenceAttributes } from "data/Attributes";
import { useIndex } from "hooks/useReplicache";

export const Backlinks = (props: { entityID: string }) => {
  let backlinks = useIndex.vae(props.entityID);
  let sections = Object.keys(
    backlinks.reduce((acc, c) => {
      acc[c.attribute] = true;
      return acc;
    }, {} as { [k in string]: boolean })
  ) as (keyof ReferenceAttributes)[];
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
    <div>
      <h4 className="pb-2">{title}</h4>
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
