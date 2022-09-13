import { itemsEqual } from "@dnd-kit/sortable/dist/utilities";
import { animated, useSpring } from "@react-spring/web";
import { notEqual } from "assert";
import { CardCarousel, Carousel } from "components/CardCarousel";
import { CardStack } from "components/CardStack";
import { CardView } from "components/CardView";
import { Close, Cross, CrossLarge, HighlightNote } from "components/Icons";
import { AttributeFromShortCode, ReferenceAttributes } from "data/Attributes";
import { multipleReferenceSection } from "data/Facts";
import { useIndex } from "hooks/useReplicache";
import { useRouter } from "next/router";
import { useState } from "react";
import { sortByPosition } from "src/position_helpers";

export default function HighlightPage() {
  let router = useRouter();
  let attribute = router.query.attribute as string;
  let card = router.query.card as string;

  let section: keyof ReferenceAttributes =
    (AttributeFromShortCode(attribute) as keyof ReferenceAttributes) ||
    multipleReferenceSection(attribute);

  let cards = [
    "01G7D93S65RVKPWX5M6DWZ6RYT",
    "01G7D9467DZRQZCXDHJKAJESZW",
    "01G7Z5MRD3C54G6RBB0A9D1EFR",
  ];

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
        {cards.map((entity) => {
          let [read, setRead] = useState(false);
          let [note, setNote] = useState(true);

          return (
            <div
              tabIndex={0}
              className={`highlightCard h-full w-[calc(100%-32px)] flex flex-col relative max-w-3xl snap-center flex-shrink-0 pb-1.5 focus:outline-none `}
            >
              {note ? (
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
                      onClick={() => setNote(false)}
                    >
                      <HighlightNote />
                    </div>
                    <div className="pt-1"></div>
                  </div>
                  <p className="leading-tight">
                    hey I'm a note and I think it'd be pretty cool if y'all look
                    a look at this card. I added a new section!
                  </p>
                </div>
              ) : (
                <div className="absolute z-20 bottom-12 right-5">
                  <div
                    className={`highlightNoteCollapsed rounded-full flex mr-2 h-8 w-8 bg-bg-blue text-accent-blue lightBorder items-center justify-center`}
                    onClick={() => setNote(true)}
                  >
                    <HighlightNote />
                  </div>
                </div>
              )}

              <CardView entityID={entity} />
            </div>
          );
        })}
      </Carousel>
    </div>
  );
}
