import { Dialog } from "@headlessui/react";
import { animated, useSpring } from "@react-spring/web";
import { useIndex } from "hooks/useReplicache";
import { useContext, useState, createContext } from "react";
import useMeasure from "react-use-measure";
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

  const [refPanel, data] = useMeasure();

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
          className="popUpModalWrapper  h-[calc(100vh-32px)] mt-[16px] "
        >
          <Dialog.Panel className="h-full flex flex-row" ref={refPanel}>
            {state.focused && (
              <LinkContextProvider {...state.focused}>
                {state.focused.type === "desktop" ? (
                  <div className="overflow-y-scroll no-scrollbar flex-shrink-0 w-[350px] snap-center">
                    <div className="px-4">
                      <SpaceInfo />
                    </div>
                    <Desktop />
                  </div>
                ) : (
                  <LeftCard
                    entityID={state.focused.entityID}
                    PanelLeftX={data.left}
                  />
                )}

                {/* pop up card */}
                <RightCard
                  entityID={state.history[0]}
                  PanelRightX={data.left}
                  onClick={() =>
                    setState((s) => ({ ...s, history: s.history.slice(1) }))
                  }
                />
              </LinkContextProvider>
            )}
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

const LeftCard = (props: { entityID: string; PanelLeftX: number }) => {
  const [refLeftCard, data] = useMeasure();

  let TranslateX =
    window.innerWidth / 2 - (props.PanelLeftX + 16 + data.width / 2);

  let SlideLeft = useSpring({
    from: { x: TranslateX },
    to: { x: 0 },
    delay: 200,
  });

  return (
    <animated.div
      className=" LeftPanel shrink-0 grow-0 w-[calc(100vw-32px)] max-w-xl z-20  bg-background border border-grey-80 p-4 rounded-tl-md rounded-bl-lg"
      style={SlideLeft}
      ref={refLeftCard}
    >
      <CardView entityID={props.entityID} />
    </animated.div>
  );
};
const RightCard = (props: {
  entityID: string | undefined;
  onClick: () => void;
  PanelRightX: number;
}) => {
  const [refRightCard, data] = useMeasure();

  let TranslateX =
    props.PanelRightX + 16 + data.width / 2 - window.innerWidth / 2;

  let SlideRight = useSpring({
    from: { x: TranslateX },
    to: { x: 0 },
    delay: 200,
  });

  return (
    <animated.div
      className="grow w-full max-w-xl flex flex-col bg-grey-80 p-4 rounded-tr-md rounded-br-lg"
      style={SlideRight}
      ref={refRightCard}
    >
      <div className="flex">
        {!props.entityID ? null : (
          <button onClick={props.onClick}>{"<-"} back</button>
        )}
      </div>
      <SearchBar />
      {props.entityID && <CardView entityID={props.entityID} />}
    </animated.div>
  );
};

export const SearchBar = () => {
  let [input, setInput] = useState("");
  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.currentTarget.value)} />
      <Results searchTerm={input} />
    </div>
  );
};

const Results = (props: { searchTerm: string }) => {
  let { open } = usePopupCardViewer();
  let titles = useIndex
    .aev(props.searchTerm ? "card/title" : null)
    .filter((f) => !!f.value);
  let items = titles
    .map((t) => {
      return {
        entity: t.entity,
        display: t.value,
      };
    })
    .filter((f) => {
      if (/[A-Z]/g.test(props.searchTerm))
        return f.display.includes(props.searchTerm);
      return f.display
        .toLocaleLowerCase()
        .includes(props.searchTerm.toLocaleLowerCase());
    });
  return (
    <div>
      {items.map((i) => (
        <div
          onClick={() => {
            open({ entityID: i.entity });
          }}
        >
          {i.display}
        </div>
      ))}
    </div>
  );
};
