import { useContext, useState, useRef } from "react";
import { CardView } from "components/CardView";
import { GoBackToPage, SearchOrCommand } from "components/Icons";
import { useIndex, useMutations } from "hooks/useReplicache";
import { ulid } from "src/ulid";
import { FindOrCreate, useAllItems } from "components/FindOrCreateEntity";
import useWindowDimensions from "hooks/useWindowDimensions";
import { useLongPress } from "hooks/useLongPress";
import { Desktop } from "components/Desktop";
import {
  CardViewerContext,
  LinkContext,
  LinkContextProvider,
} from "components/ContextProvider";

export default function SpacePage() {
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
          window.setTimeout(() => {
            ref.current?.scrollTo({
              left: ref.current?.clientWidth,
              behavior: "smooth",
            }),
              50;
          });
        },
      }}
    >
      <div
        ref={ref}
        className={`
        contentSplitLayout
        w-full 
        flex flex-row items-stretch gap-4 sm:gap-8 
        sm:justify-center
        snap-x snap-mandatory overflow-x-scroll
        after:content-[""] after:h-full after:w-2 after:block after:shrink-0
`}
      >
        <div
          className={`
          desktopWrapper
          overflow-y-scroll overflow-x-hidden 
          no-scrollbar 
          snap-center
          flex-shrink-0 
         h-full
          flex flex-col gap-0
          `}
        >
          <LinkContextProvider type="desktop">
            <Desktop />
          </LinkContextProvider>
        </div>

        <div
          className={`cardViewerWrapper 
          h-full w-[calc(100vw-16px)] max-w-3xl 
          pt-2 pb-4 sm:pt-4 sm:pb-8 
          shrink-0 sm:shrink        
          focus:outline-none
          snap-center touch-pan-x 
          flex flex-col gap-3 items-stretch`}
        >
          <div className="cardViewerHeader grid grid-cols-[auto_max-content] items-center gap-4 ">
            {history[0] && (
              <BackButton
                history={history}
                setHistory={setHistory}
                onFinalClose={() => {
                  ref.current?.scrollTo({
                    left: 0,
                    behavior: "smooth",
                  });
                }}
              />
            )}
            <FindOrCreateBar />
          </div>
          {history[0] ? (
            <CardView
              entityID={history[0]}
              key={history[0]}
              onDelete={() => setHistory((s) => s.slice(1))}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </CardViewerContext.Provider>
  );
}
export const InlineCardViewer: React.FC = (props) => {
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
      <h3>Welcome!</h3>
      <p>
        To the <strong>left</strong> is the <strong>Desktop</strong>, a canvas
        for working with cards.
      </p>
      <ul className="list-disc list-outside ml-4">
        <li>
          Double click to add a card — regular cards, decks, or chat cards
        </li>
        <li>Move, rotate, and resize cards</li>
        <li>
          Drag a card into a deck, or on top of another card to make a new deck
        </li>
      </ul>
      <p>
        Here on the <strong>right</strong> is your <strong>Card Viewer</strong>.
      </p>
      <ul className="list-disc list-outside ml-4">
        <li>To open cards, click from the Desktop or search above</li>
        <li>Cards will stack temporarily as you browse</li>
      </ul>
      <p>
        Above the Desktop, view <strong>Space info</strong> and{" "}
        <strong>Highlights</strong>.
      </p>
      <p>
        Click the same icon on any card to add a <strong>new Highlight</strong>{" "}
        for others to see.
      </p>
    </div>
  );
};

export const BackButton = (props: {
  history: string[];
  onFinalClose: () => void;
  setHistory: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  let prevCardTitle = useIndex.eav(props.history[1], "card/title")?.value;
  let prevCardMemberName = useIndex.eav(props.history[1], "member/name")?.value;
  let prevCardBotName = useIndex.eav(props.history[1], "bot/name")?.value;

  const { width } = useWindowDimensions();
  let { handlers } = useLongPress(() => {
    props.setHistory([]);
  });
  return (
    <button
      {...handlers}
      className="CardViewerBackButton overflow-clip"
      onClick={() => {
        if (props.history.length === 1) {
          // if on last card, scroll back to desktop
          props.onFinalClose();
          // if narrow width, add delay so card doesn't blip out mid-scroll
          let delay = 0;
          if (width < 640) delay = 500;
          setTimeout(() => {
            props.setHistory((h) => h.slice(1));
          }, delay);
        } else {
          props.setHistory((s) => s.slice(1));
        }
      }}
    >
      <div className="grid grid-cols-[max-content_auto] gap-3 items-center place-items-start text-grey-55">
        <GoBackToPage />{" "}
        <p className="truncate whitespace-nowrap">
          {props.history.length >= 2
            ? width > 1000
              ? `Back to ${
                  prevCardTitle || prevCardMemberName || prevCardBotName
                }`
              : "Back"
            : "Back"}
        </p>
      </div>
    </button>
  );
};

const FindOrCreateBar = () => {
  let [open, setOpen] = useState(false);
  let { open: openCard } = useCardViewer();
  let items = useAllItems(open);

  let { authorized, mutate } = useMutations();
  return (
    <>
      <button className="flex items-center group" onClick={() => setOpen(true)}>
        <div className="px-3 py-1 italic bg-white border border-grey-80 border-r-0 rounded-l-md text-grey-80">
          {" "}
          find or create a card...
        </div>
        <div className="text-accent-blue bg-bg-blue border border-accent-blue rounded-r-md px-3 py-1 group-hover:bg-accent-blue group-hover:text-white">
          <SearchOrCommand />
        </div>
      </button>
      <FindOrCreate
        allowBlank={true}
        onClose={() => setOpen(false)}
        //START OF ON SELECT LOGIC
        onSelect={async (d) => {
          let entity;
          if (d.type === "create") {
            entity = ulid();

            if (d.cardType === "chat") {
              await mutate("assertFact", {
                entity,
                attribute: "chat",
                value: { type: "flag" },
                positions: {},
              });
            }
            if (d.name) {
              await mutate("createCard", {
                entityID: entity,
                title: d.name,
              });
            }
          } else {
            entity = d.entity;
          }
          openCard({ entityID: entity });
        }}
        // END OF ONSELECT LOGIC
        selected={[]}
        open={open}
        items={items}
      />
    </>
  );
};

export const useCardViewer = () => {
  let cardPreview = useContext(CardViewerContext);
  let link = useContext(LinkContext);
  return {
    open: (args: { entityID: string }) => {
      cardPreview.open({ focused: link, entityID: args.entityID });
    },
  };
};
