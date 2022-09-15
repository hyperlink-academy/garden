import { Carousel } from "components/CardCarousel";
import { CardView } from "components/CardView";
import { CrossLarge, HighlightNote } from "components/Icons";
import { AttributeFromShortCode, ReferenceAttributes } from "data/Attributes";
import { multipleReferenceSection } from "data/Facts";
import { useIndex } from "hooks/useReplicache";
import { useRouter } from "next/router";
import { useState } from "react";
import { sortByPosition } from "src/position_helpers";

export default function HighlightPage() {
  let router = useRouter();

  let cards = useIndex.at("highlight/time");

  return (
    // TODO for Jared :
    // - wire up the close button to take you back to where you where
    // - If you click a link in the card, the new card will open on top of the original one with a back button to go down the stack
    // - Depending on read state the highlight note will have a different visual style. You can change the state too se the different versions
    // - the note will always show the name and time of the highlighter. if there is a user note that will show too
    // -everything bg-test pink is gonna be in the fun processing bg so wait for that lol

    <div className="highlightCarousel h-full grow flex flex-col gap-4 items-stretch relative py-6">
      <div className="highlightHeader w-[calc(100%-32px)] max-w-3xl mx-auto flex gap-2">
        <h2 className="grow">Highlights</h2>
        <CrossLarge />
      </div>

      <Carousel>
        {cards.map(({ entity }) => (
          <HighlightedItem entityID={entity} />
        ))}
      </Carousel>
    </div>
  );
}

let HighlightedItem = (props: { entityID: string }) => {
  let [read, setRead] = useState(false);
  let [noteOpen, setNoteOpen] = useState(true);
  let note = useIndex.eav(props.entityID, "highlight/note");
  let card = useIndex.eav(props.entityID, "highlight/card");

  return (
    <div
      tabIndex={0}
      className={`highlightCard h-full w-[calc(100%-32px)] flex flex-col relative max-w-3xl snap-center flex-shrink-0 pb-1.5 focus:outline-none `}
    >
      {noteOpen ? (
        <div
          className={` 
                    hightlightNoteExpanded 
                    absolute z-20
                     bottom-10 left-0 right-0 
                    mx-4 p-3 
                    flex flex-col gap-1
                    rounded-md 
                    lightBorder
                    ${read ? "bg-test-pink" : "bg-bg-blue"}`}
        >
          <div className="flex items-center">
            <p className="grow text-grey-35">
              <span className="font-bold">celine</span>{" "}
              <span className="italic">23 hours ago</span>
            </p>
            <div
              className="rounded-full flex w-8 text-accent-blue items-center justify-center"
              onClick={() => setNoteOpen(false)}
            >
              <HighlightNote />
            </div>
            <div className="pt-1"></div>
          </div>
          <p className="leading-tight">{note?.value}</p>
        </div>
      ) : (
        <div className="absolute z-20 bottom-12 right-5">
          <div
            className={`highlightNoteCollapsed rounded-full flex mr-2 h-8 w-8 bg-bg-blue text-accent-blue lightBorder items-center justify-center`}
            onClick={() => setNoteOpen(true)}
          >
            <HighlightNote />
          </div>
        </div>
      )}

      {card && <CardView entityID={card?.value.value} />}
    </div>
  );
};
