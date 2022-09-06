import { Dialog } from "@headlessui/react";
import { useContext, useState, createContext } from "react";
import { CardView } from "./CardView";
import { Desktop } from "./Desktop";
import { SpaceInfo } from "./SpaceInfo";

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
    open: false,
    focused: undefined as undefined | LinkContextType,
  });
  return (
    <PopupCardViewerContext.Provider
      value={{
        open: (args) =>
          setState((s) => {
            let history;
            if (args.focused.type === s.focused?.type && args.focused) {
              history = [args.entityID, ...s.history];
            } else history = [args.entityID];

            return {
              ...s,
              open: true,
              history,
              focused: args.focused,
            };
          }),
      }}
    >
      {props.children}
      <Dialog
        open={state.open}
        onClose={() => {
          setState({ history: [], open: false, focused: undefined });
        }}
        className="fixed z-10 inset-0 overflow-y-hidden"
      >
        <Dialog.Overlay className="overlay" />
        <div className="flex flex-row w-full h-full p-4">
          {state.focused &&
            (state.focused?.type === "desktop" ? (
              <LinkContextProvider type="desktop">
                <div className="overflow-y-scroll no-scrollbar flex-shrink-0 w-[350px] snap-center">
                  <div className="px-4">
                    <SpaceInfo />
                  </div>
                  <Desktop />
                </div>
                <CardView entityID={state.history[0]} />
              </LinkContextProvider>
            ) : (
              <LinkContextProvider
                type="entity"
                entityID={state.focused.entityID}
              >
                <CardView entityID={state.focused.entityID} />
                <CardView entityID={state.history[0]} />
              </LinkContextProvider>
            ))}
        </div>
      </Dialog>
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
