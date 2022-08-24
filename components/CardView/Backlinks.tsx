import { CollapseTiny } from "components/Icons";
import { SmallCardList } from "components/SmallCardList";
import { ReferenceAttributes } from "data/Attributes";
import { useIndex } from "hooks/useReplicache";
import ChatPage from "pages/s/[studio]/s/[space]/chat";

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
      backlinkWrapper
      focus:outline-none
      px-4 
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
      grid grid-rows-[auto_max-content]
      
      `}
      tabIndex={0}
      onClick={() => {
        props.onOpen();
      }}
    >
      <div
        className={`backlinks  
        pt-12 py-4 flex flex-col gap-3 h-full overflow-y-scroll no-scrollbar
     
        `}
      >
        <h3 className="font-bold text-grey-35">References</h3>
        <ul
          className={` 
            ${props.open === "backlink" ? " " : "pointer-events-none"}
            flex flex-col gap-4 `}
        >
          {sections.map((s) => {
            return (
              <BacklinkSection
                entityID={props.entityID}
                attribute={s}
                key={s}
              />
            );
          })}
        </ul>
      </div>
      <div
        className={` text-grey-55 flex gap-2 items-center justify-end overflow-hidden transition-all duration-75 ${
          props.open === "backlink" ? "h-0" : "h-max pb-0.5 pt-1 "
        } `}
      >
        <p className="text-[12px]">references</p>
        <div className="pt-0.5">
          <CollapseTiny />
        </div>
      </div>
    </div>
  ) : null;
};

const BacklinkSection = (props: {
  entityID: string;
  attribute: keyof ReferenceAttributes;
}) => {
  let backlinkedCards = useIndex.vae(props.entityID, props.attribute);
  let homeEntity = useIndex.aev("home");
  let cards =
    props.attribute === "deck/contains"
      ? backlinkedCards.filter((c) => c.entity !== homeEntity[0]?.entity)
      : backlinkedCards;

  let title =
    props.attribute === "deck/contains" ? (
      "Decks"
    ) : (
      <>
        <span className="font-bold">{props.attribute.slice(8)}</span>
        <span className="font-normal"> section of</span>
      </>
    );
  return (
    <div className="flex flex-col gap-2">
      <p className="font-bold text-grey-55">{title}</p>
      <SmallCardList
        backlink={true}
        attribute={props.attribute}
        cards={cards || []}
        deck={props.entityID}
        positionKey="vae"
      />
    </div>
  );
};
