import { useContext, useState, createContext, useRef, useEffect } from "react";
import { CardView } from "./CardView";
import { GoBackToPage, SearchOrCommand } from "./Icons";
import { useIndex } from "hooks/useReplicache";
import { ButtonPrimary, ButtonSecondary } from "./Buttons";

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
  let [state, setState] = useState({
    history: [] as string[],
    focused: undefined as undefined | LinkContextType,
  });

  let ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.history[0]]);

  let prevCardTitle = useIndex.eav(state.history[1], "card/title");

  return (
    <PopupCardViewerContext.Provider
      value={{
        open: (args) =>
          setState((s) => {
            let history = [args.entityID, ...s.history];
            return {
              ...s,
              history,
              focused: args.focused,
            };
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
          {state.history[0] && (
            <>
              <div className="cardViewerHeader grid grid-cols-[auto_max-content] items-end gap-4 ">
                <button
                  className="CardViewerBackButton overflow-clip"
                  onClick={() => {
                    setState((s) => ({ ...s, history: s.history.slice(1) }));
                  }}
                >
                  <div className="grid grid-cols-[max-content_auto] gap-3 items-center place-items-start text-grey-55">
                    <GoBackToPage />{" "}
                    <p className="truncate whitespace-nowrap">
                      {state.history.length >= 2
                        ? `Back to ${prevCardTitle?.value}`
                        : "Clear Stack"}{" "}
                    </p>
                  </div>
                </button>
                <div className="flex items-center">
                  <div className="lightborder px-3 py-1 italic bg-white border border-grey-80 rounded-l-md text-grey-80">
                    {" "}
                    find or create a card...
                  </div>
                  <div className="text-accent-blue bg-bg-blue border border-accent-blue  rounded-r-md px-3 py-1">
                    <SearchOrCommand />
                  </div>
                </div>
              </div>
              <CardView entityID={state.history[0]} />
            </>
          )}
        </div>
      </div>
    </PopupCardViewerContext.Provider>
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
