import { Divider } from "components/Layout";
import { SmallCardList } from "components/SmallCardList";
import { ReferenceAttributes } from "data/Attributes";
import { useIndex } from "hooks/useReplicache";

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
    <div className=" grid grid-flow-row gap-3 ">
      <Divider />
      <p className="font-bold text-grey-35">Referenced in</p>
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
        <span className="font-bold">{props.attribute.slice(8)}</span>
        <span className="font-normal"> section of</span>
      </p>
    );
  return (
    <div className="flex flex-col gap-2">
      <p className="font-bold text-grey-55">{title}</p>
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
