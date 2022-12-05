import { useLongPress } from "hooks/useLongPress";
import { useIndex, useMutations } from "hooks/useReplicache";
import useWindowDimensions from "hooks/useWindowDimensions";
import { createContext, useContext, useRef, useState } from "react";
import { ulid } from "src/ulid";
import { CardView } from "./CardView";
import { FindOrCreate, useAllItems } from "./FindOrCreateEntity";
import { Close, Cross, GoBackToPage, SearchOrCommand } from "./Icons";

export const CardViewerContext = createContext({
  open: (_args: { entityID: string }) => {},
});

export const useCardViewer = () => {
  return useContext(CardViewerContext);
};

export function CardViewerLayout(props: {
  children: React.ReactNode;
  EmptyState: React.ReactNode;
}) {
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
`}
        // you need to add this to the contentSplitLayout class if you are going to scroll across more than 2 panes
        // it prevents the last pane from sticking to the end
        // after:content-[""] after:h-full after:w-2 after:block after:shrink-0
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
          {props.children}
        </div>

        <div
          className={`cardViewerWrapper 
          h-full w-[calc(100vw-16px)] max-w-3xl 
           pb-4  sm:pb-8 
          shrink-0 sm:shrink        
          focus:outline-none
          snap-center touch-pan-x 
          flex flex-col gap-3 items-stretch`}
        >
          <div className="cardViewerHeader grid grid-cols-[auto_max-content] items-center gap-4 ">
            {history[0] ? (
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
            ) : (
              <div />
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
            props.EmptyState
          )}
        </div>
      </div>
    </CardViewerContext.Provider>
  );
}

const BackButton = (props: {
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
      <div className="grid grid-cols-[max-content_auto] gap-2 items-center place-items-start text-grey-55">
        {props.history.length >= 2 ? <GoBackToPage /> : <Close />}
        <p className="truncate whitespace-nowrap">
          {props.history.length >= 2
            ? width > 1000
              ? `Back to ${
                  prevCardTitle || prevCardMemberName || prevCardBotName
                }`
              : "Back"
            : "Close"}
        </p>
      </div>
    </button>
  );
};

const FindOrCreateBar = () => {
  let [open, setOpen] = useState(false);
  let { open: openCard } = useCardViewer();
  let items = useAllItems(open);

  let { authorized, mutate, memberEntity } = useMutations();
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
          if (!memberEntity) return;
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
                memberEntity,
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
