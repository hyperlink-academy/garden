import { Dialog } from "@headlessui/react";
import { animated, useSpring } from "@react-spring/web";
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

  let SlideLeft = useSpring({
    from: { x: 100 },
    to: { x: 0 },
    delay: 1200,
  });

  let SlideRight = useSpring({
    to: { x: 0 },
    from: { x: 100 },
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
        <div
          style={{
            marginRight: "max(calc((100vw - 75rem)/2), 1rem)",
            marginLeft: "max(calc((100vw - 75rem)/2), 1rem)",
          }}
          className="popUpModalWrapper lightBorder bg-white h-[calc(100vh-32px)] mt-[16px] "
        >
          <Dialog.Panel className="p-4 h-full flex flex-row gap-4">
            {state.focused &&
              (state.focused?.type === "desktop" ? (
                // POP UP NEXT TO DESKTOP
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
                // END POP UP NEXT TO DESKTOP

                // POP UP NEXT TO CARD
                <LinkContextProvider
                  type="entity"
                  entityID={state.focused.entityID}
                >
                  {/* original card */}
                  <animated.div
                    className=" shrink-0 grow-0 w-[calc(100vw-32px)] max-w-xl"
                    style={SlideLeft}
                  >
                    <CardView entityID={state.focused.entityID} />
                  </animated.div>

                  {/* pop up card */}
                  <div className="grow w-full max-w-xl">
                    <CardView entityID={state.history[0]} />
                  </div>
                </LinkContextProvider>
                //END POP UP NEXT TO CARD
              ))}
          </Dialog.Panel>
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

// ANIMATION COMPONENTS

// 1. Origin card moves into modal (focused card is behind)

// 2. Original card slides to Lefts and Focused card slides to the Right
