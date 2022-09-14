import { useContext, useState, createContext, useRef, useEffect } from "react";
import { CardView } from "./CardView";

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
          className={`cardWrapper 
          h-full w-[calc(100vw-16px)] max-w-3xl 
          pt-2 pb-4 sm:pt-4 sm:pb-8 
          shrink-0 sm:shrink        
          focus:outline-none
          snap-center touch-pan-x 
          flex flex-col items-stretch`}
        >
          {state.history[0] && (
            <>
              <button
                onClick={() => {
                  setState((s) => ({ ...s, history: s.history.slice(1) }));
                }}
              >
                x
              </button>
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
