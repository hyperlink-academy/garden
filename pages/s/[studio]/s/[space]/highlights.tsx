import { ButtonPrimary } from "components/Buttons";
import { CardView } from "components/CardView";
import { CardViewerContext } from "components/CardViewerContext";
import { Checkmark } from "components/Icons";
import { useNextHighlight } from "hooks/useNextHighlight";
import { useMutations } from "hooks/useReplicache";
import { useRef, useState } from "react";
import { BackButton } from ".";

export default function HighlightPage() {
  let { memberEntity, mutate } = useMutations();
  let highlights = useNextHighlight();
  return (
    // TODO for Jared :
    // - If you click a link in the card, the new card will open on top of the original one with a back button to go down the stack
    // - Depending on read state the highlight note will have a different visual style. You can change the state too se the different versions
    // - the note will always show the name and time of the highlighter. if there is a user note that will show too
    // -everything bg-test pink is gonna be in the fun processing bg so wait for that lol

    <div className="highlightCarousel h-full grow flex items-stretch flex-col gap-2">
      {!memberEntity ? (
        <EmptyState />
      ) : (
        highlights && (
          <>
            <HighlightedItem entityID={highlights.current.entity} />
            <div className="pb-2">
              <ButtonPrimary
                content="Next"
                onClick={async () => {
                  if (!memberEntity || !highlights) return;
                  await mutate("assertFact", {
                    entity: memberEntity,
                    value: highlights.current.value,
                    attribute: "member/last-read-highlight",
                    positions: {},
                  });
                }}
              />
            </div>
          </>
        )
      )}
    </div>
  );
}

let HighlightedItem = (props: { entityID: string }) => {
  let { memberEntity, mutate, authorized } = useMutations();
  return (
    <InlineCardViewer>
      <div
        tabIndex={0}
        className={`highlightCard h-full w-full flex flex-col relative max-w-3xl snap-center focus:outline-none `}
      >
        {authorized && (
          <button
            onClick={() => {
              if (!memberEntity) return;
              mutate("assertFact", {
                entity: props.entityID,
                attribute: "highlight/read-by",
                value: { type: "reference", value: memberEntity },
                positions: {},
              });
            }}
            className={`absolute z-20 bottom-16 left-5 rounded-md flex mr-2 h-8 w-8 items-center justify-center shadow-drop 
                 bg-bg-blue text-accent-blue border border-accent-blue
                 `}
          >
            <Checkmark />
          </button>
        )}

        {<CardView entityID={props.entityID} />}
      </div>
    </InlineCardViewer>
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

const EmptyState = () => {
  return (
    <div
      className={`
                w-full
                max-w-3xl mx-auto
                overflow-y-scroll       
                relative
                no-scrollbar
                snap-y snap-mandatory snap-start
                border border-dashed border-grey-80 rounded-lg
                text-grey-35
                flex flex-col gap-6
                p-4
                `}
    >
      <h3>No new highlights in this Space!</h3>
      <p>
        When you <strong>Highlight</strong> cards, they show for all members for{" "}
        <strong>24 hrs</strong> — then disappear.
      </p>
      <p>
        To <strong>make a Highlight</strong>, click the icon on any card, and
        optionally add a note.
      </p>
      <p>Use Highlights to focus attention on meaningful things:</p>
      <ul className="list-disc list-outside ml-4">
        <li>New cards…or members!</li>
        <li>Things that need feedback</li>
        <li>Important chat convos</li>
        <li>Next "moves" for the group</li>
      </ul>
      <p>
        Once you've seen a Highlight, it'll be marked (just for you) as read.
      </p>

      <p>
        Since Highlights are ephemeral, act fast: treat them as prompts, respond
        via cards or chat, make new Highlights.
      </p>
      <p>
        <strong>Let's play the infinite game</strong>.
      </p>
    </div>
  );
};

const InlineCardViewer: React.FC = (props) => {
  let [history, setHistory] = useState([] as string[]);

  let ref = useRef<HTMLDivElement | null>(null);

  return (
    <CardViewerContext.Provider
      value={{
        open: (args) => {
          setHistory((h) => {
            if (h[0] === args.entityID) return h;
            return [args.entityID, ...h];
          });
        },
      }}
    >
      <>
        {props.children}

        {history[0] ? (
          <div
            ref={ref}
            key={history[0]}
            tabIndex={0}
            className={`highlightCard h-full w-[calc(100%-32px)] flex flex-col relative max-w-3xl snap-center flex-shrink-0 pb-1.5 focus:outline-none `}
          >
            <div className="cardViewerHeader grid grid-cols-[auto_max-content] items-center gap-4 ">
              <BackButton
                history={history}
                setHistory={setHistory}
                onFinalClose={() => {}}
              />
            </div>
            <CardView
              entityID={history[0]}
              onDelete={() => setHistory((s) => s.slice(1))}
            />
          </div>
        ) : (
          <></>
        )}
      </>
    </CardViewerContext.Provider>
  );
};
