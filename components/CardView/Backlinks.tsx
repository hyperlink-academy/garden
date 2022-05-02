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
  return (
    <div className=" grid grid-flow-row gap-2">
      <h3>This card appears in ({sections.length})</h3>
      <ul className=" grid grid-flow-row gap-2">
        {sections.map((s) => {
          return <BacklinkSection entityID={props.entityID} attribute={s} />;
        })}
      </ul>
    </div>
  );
};

const BacklinkSection = (props: {
  entityID: string;
  attribute: keyof ReferenceAttributes;
}) => {
  let backlinkedCards = useIndex.vae(props.entityID, props.attribute);

  let title =
    props.attribute === "deck/contains"
      ? "Decks"
      : `${props.attribute.slice(8)} Section of`;
  return (
    <div>
      <h3 className="pb-2">{title}</h3>
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
