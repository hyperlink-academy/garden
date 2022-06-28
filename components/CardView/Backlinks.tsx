import { SmallCardList } from "components/SmallCardList";
import { ReferenceAttributes } from "data/Attributes";
import { useIndex } from "hooks/useReplicache";

export const Backlinks = (props: {
  entityID: string;
  open?: string;
  onOpen: () => void;
}) => {
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

  // TODO: remove when we add proper chat and activity backlinks
  sections = sections.filter(
    (section) =>
      section !== "message/attachedCard" && section !== "activity/hand-contains"
  );

  return sections.length > 0 ? (
    <div
      className={`
      focus:outline-none
      no-scrollbar
      backlinks 
      flex flex-col gap-3 
      pt-12 p-4
      ${props.open === "backlink" ? " overflow-y-scroll" : " overflow-y-hidden"}
      sticky
      top-0
      left-0
      right-0
      z-0
      h-full
      rounded-lg
      bg-[#FFF2D8]
      w-[97%]
      mx-auto
      shadow-inner
      `}
      tabIndex={0}
      onClick={() => {
        props.onOpen();
      }}
    >
      <h3 className="font-bold text-grey-35">References</h3>
      <ul
        className={` 
      ${props.open === "backlink" ? " " : "pointer-events-none"}
       flex flex-col gap-4 `}
      >
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
