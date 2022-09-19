import { useContext, useState, createContext, useRef, useEffect } from "react";
import { CardView } from "./CardView";
import {
  DeckSmall,
  GoBackToPage,
  Member,
  SearchOrCommand,
  Card as CardIcon,
  RightArrow,
} from "./Icons";
import { useIndex, useMutations } from "hooks/useReplicache";
import { ulid } from "src/ulid";
import { FindOrCreate, useAllItems } from "./FindOrCreateEntity";
import useWindowDimensions from "hooks/useWindowDimensions";
import { useLongPress } from "hooks/useLongPress";

let PopupCardViewerContext = createContext({
  open: (_args: { focused: LinkContextType; entityID: string }) => {},
});

let LinkContext = createContext({} as LinkContextType);

type LinkContextType =
  | { type: "desktop" }
  | { type: "entity"; entityID: string };
export const LinkContextProvider: React.FC<LinkContextType> = (props) => {
  return (
    <LinkContext.Provider value={props}>{props.children}</LinkContext.Provider>
  );
};

export const PopupCardViewer: React.FC = (props) => {
  let [history, setHistory] = useState([] as string[]);

  let ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!history[0]) return;
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, [history[0]]);

  return (
    <PopupCardViewerContext.Provider
      value={{
        open: (args) =>
          setHistory((h) => {
            if (h[0] === args.entityID) return h;
            return [args.entityID, ...h];
          }),
      }}
    >
      <div
        className={`
        pageWrapper 
        pr-2 pl-[calc((100vw-352px)/2)] sm:px-8 
        h-full w-full 
        flex flex-row gap-8 
        snap-x snap-mandatory overflow-x-scroll 
        sm:justify-center`}
      >
        {props.children}

        <div
          ref={ref}
          className={`cardViewerWrapper 
          h-full w-[calc(100vw-16px)] max-w-3xl 
          pt-2 pb-4 sm:pt-4 sm:pb-8 
          shrink-0 sm:shrink        
          focus:outline-none
          snap-center touch-pan-x 
          flex flex-col gap-3 items-stretch`}
        >
          {history[0] ? (
            <>
              <div className="cardViewerHeader grid grid-cols-[auto_max-content] items-center gap-4 ">
                <BackButton history={history} setHistory={setHistory} />
                <FindOrCreateBar />
              </div>
              <CardView
                entityID={history[0]}
                key={history[0]}
                onDelete={() => setHistory((s) => s.slice(1))}
              />
            </>
          ) : (
            <>
              <div className="cardViewerHeader grid items-center gap-4 justify-end justify-items-end">
                <FindOrCreateBar />
                <EmptyState />
              </div>
              {/* merged various nested card wrappers */}
            </>
          )}
        </div>
      </div>
    </PopupCardViewerContext.Provider>
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

const BackButton = (props: {
  history: string[];
  setHistory: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  let prevCardTitle = useIndex.eav(props.history[1], "card/title");
  const { width } = useWindowDimensions();
  let longPressProps = useLongPress(() => {
    props.setHistory([]);
  });
  return (
    <button
      {...longPressProps}
      className="CardViewerBackButton overflow-clip"
      onClick={() => {
        if (props.history.length === 1) {
          // if on last card, scroll back to desktop
          setTimeout(() => {
            const desktop = document.querySelector(".Desktop");
            desktop?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 50);
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
              ? `Back to ${prevCardTitle?.value}`
              : "Back"
            : width > 1000
            ? "Clear Stack"
            : "Clear"}
        </p>
      </div>
    </button>
  );
};

const FindOrCreateBar = () => {
  let [open, setOpen] = useState(false);
  let { open: openCard } = usePopupCardViewer();
  let items = useAllItems(open);

  let { authorized, mutate } = useMutations();
  return (
    <>
      <button className="flex items-center" onClick={() => setOpen(true)}>
        <div className="lightborder px-3 py-1 italic bg-white border border-grey-80 rounded-l-md text-grey-80">
          {" "}
          find or create a card...
        </div>
        <div className="text-accent-blue bg-bg-blue border border-accent-blue  rounded-r-md px-3 py-1">
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

export const usePopupCardViewer = () => {
  let cardPreview = useContext(PopupCardViewerContext);
  let link = useContext(LinkContext);
  return {
    open: (args: { entityID: string }) => {
      cardPreview.open({ focused: link, entityID: args.entityID });
    },
  };
};
