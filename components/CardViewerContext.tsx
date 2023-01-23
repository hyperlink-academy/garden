import { useAppEventListener } from "hooks/useEvents";
import { useLongPress } from "hooks/useLongPress";
import { useIndex } from "hooks/useReplicache";
import { useUndoableState } from "hooks/useUndoableState";
import useWindowDimensions from "hooks/useWindowDimensions";
import { createContext, useContext, useRef } from "react";
import { ButtonLink } from "./Buttons";
import { CardView } from "./CardView";
import { CloseFilledTiny, GoBackToPage } from "./Icons";
import { Divider } from "./Layout";

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
  let [history, setHistory] = useUndoableState([] as string[]);

  let ref = useRef<HTMLDivElement | null>(null);
  useAppEventListener(
    "cardviewer.open-card",
    (data) =>
      setHistory((h) => {
        if (h[0] === data.entityID) return h;
        return [data.entityID, ...h];
      }),
    []
  );

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
        flex flex-row items-stretch gap-4 sm:gap-4 
        sm:justify-center
        overflow-x-scroll
        pb-4 sm:pb-8
`}
        // you need to add this to the contentSplitLayout class if you are going to scroll across more than 2 panes
        // it prevents the last pane from sticking to the end
        // after:content-[""] after:h-full after:w-2 after:block after:shrink-0
      >
        <div className="roomWrapper flex flex-row rounded-md border border-grey-90">
          <div className="roomListWrapper bg-white rounded-l-[3px] w-48 shrink-0 flex flex-col gap-2 text-grey-35 p-4 border-r border-grey-90">
            <h3>Brainstorm</h3>
            <Divider />
            <div>
              <h4>Shared</h4>
              <ul>
                <li>Homeroom</li>
                <li>
                  <strong>Brainstorm</strong>
                </li>
                <li>Memes</li>
                <li>Week 1</li>
                <li>Week 2</li>
                <li>Week 3</li>
              </ul>
              <ButtonLink content="new room" />
            </div>
            <div>
              <h4>Members</h4>
              <ul>
                <li>Brendan</li>
                <li>Celine</li>
                <li>Jared</li>
              </ul>
              <ButtonLink content="invite member" />
            </div>
          </div>
          <div
            className={`
          desktopWrapper
          overflow-y-scroll overflow-x-hidden 
          no-scrollbar 
          flex-shrink-0 
         h-full
          flex flex-col gap-0
          `}
          >
            {props.children}
          </div>
        </div>

        <div
          className={`cardViewerWrapper 
          h-full w-[calc(100vw-16px)] max-w-3xl 
          shrink-0 sm:shrink        
          focus:outline-none
          touch-pan-x 
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
        {props.history.length >= 2 ? <GoBackToPage /> : <CloseFilledTiny />}
        <p className="truncate whitespace-nowrap">
          {props.history.length >= 2
            ? width > 1000
              ? `Back to ${prevCardTitle || prevCardMemberName}`
              : "Back"
            : "Close"}
        </p>
      </div>
    </button>
  );
};
