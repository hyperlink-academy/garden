import { Carousel } from "components/CardCarousel";
import { CardView } from "components/CardView";
import { CrossLarge, HighlightNote } from "components/Icons";
import { useIndex } from "hooks/useReplicache";
import { spacePath } from "hooks/utils";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

export default function HighlightPage() {
  let { query: q } = useRouter();
  let time = useMemo(() => {
    return Date.now() - 24 * 60 * 60 * 1000;
  }, []);

  let cards = useIndex.at("highlight/time", time);

  return (
    // TODO for Jared :
    // - If you click a link in the card, the new card will open on top of the original one with a back button to go down the stack
    // - Depending on read state the highlight note will have a different visual style. You can change the state too se the different versions
    // - the note will always show the name and time of the highlighter. if there is a user note that will show too
    // -everything bg-test pink is gonna be in the fun processing bg so wait for that lol

    <div className="highlightCarousel h-full grow flex flex-col gap-4 items-stretch relative py-6">
      <div className="highlightHeader w-[calc(100%-32px)] max-w-3xl mx-auto flex gap-2">
        <h2 className="grow">Highlights</h2>
        <Link href={spacePath(q.studio, q.space)}>
          <a>
            <CrossLarge />
          </a>
        </Link>
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
  let [noteOpen, setNoteOpen] = useState(true);
  let card = useIndex.eav(props.entityID, "highlight/card");

  return (
    <div
      tabIndex={0}
      className={`highlightCard h-full w-[calc(100%-32px)] flex flex-col relative max-w-3xl snap-center flex-shrink-0 pb-1.5 focus:outline-none `}
    >
      {noteOpen ? (
        <Note entityID={props.entityID} onClose={() => setNoteOpen(false)} />
      ) : (
        <button
          onClick={() => setNoteOpen(true)}
          className="absolute z-20 bottom-12 right-5 rounded-full flex mr-2 h-8 w-8 bg-bg-blue text-accent-blue lightBorder items-center justify-center"
        >
          <HighlightNote />
        </button>
      )}

      {card && <CardView entityID={card?.value.value} />}
    </div>
  );
};

let Note = (props: { entityID: string; onClose: () => void }) => {
  let note = useIndex.eav(props.entityID, "highlight/note");
  let time = useIndex.eav(props.entityID, "highlight/time");
  let member = useIndex.eav(props.entityID, "highlight/by");
  let memberName = useIndex.eav(member?.value.value || null, "member/name");
  let [read, setRead] = useState(false);
  return (
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
          <span className="font-bold">{memberName?.value}</span>{" "}
          {time && (
            <span className="italic">
              {timeSince(Date.now() - parseInt(time.value.value))}
            </span>
          )}
        </p>
        <button
          className="rounded-full flex w-8 text-accent-blue items-center justify-center"
          onClick={() => props.onClose()}
        >
          <HighlightNote />
        </button>
      </div>
      <p className="leading-tight">{note?.value}</p>
    </div>
  );
};

function timeSince(ms: number) {
  let minutes = Math.floor(ms / 1000 / 60);
  if (minutes === 0) return "Now";
  if (minutes < 60) {
    return `${minutes} minutes ago`;
  }
  let hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  let days = Math.floor(hours / 24);
  return `${days} days ago`;
}
