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
      <div className="mx-auto h-full w-full flex flex-row gap-2 snap-x snap-mandatory overflow-x-scroll">
        {props.children}

        <div
          ref={ref}
          className={`h-full w-[calc(100%-32px)] max-w-3xl snap-center flex-shrink-0 pb-1.5 focus:outline-none py-1 pr-2 touch-pan-x flex flex-col items-stretch`}
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
