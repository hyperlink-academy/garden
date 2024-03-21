import { db } from "hooks/useReplicache";
import { Backlinks } from "./Backlinks";
import {
  MessageInput,
  MessageWindow,
  Messages,
  useMarkRead,
} from "./Discussion";
import { useViewportSize } from "@react-aria/utils";
import { useUIState } from "hooks/useUIState";
import { springConfig } from "src/constants";
import useMeasure from "react-use-measure";
import { animated, useSpring } from "@react-spring/web";

export const CardViewDrawer = (props: {
  entityID: string;
  drawerOpen: boolean;
}) => {
  let drawer = useUIState((s) => s.cardStates[props.entityID]?.drawer);
  let viewportHeight = useViewportSize().height;

  let [measure, { height }] = useMeasure();
  let drawerSpring = useSpring({
    height: props.drawerOpen ? height : 0,
    springConfig: springConfig,
  });
  let cardBackgroundColor =
    db.useEntity(props.entityID, "card/background-color")?.value || "#FFFFFF";
  return (
    <div className="z-10">
      <div className="cardDrawerHeader -mx-3 -mt-6  md:-mx-4">
        <div className="cardDrawerTabs flex items-end gap-2 border-b border-b-grey-80 pl-4">
          <ChatTab entityID={props.entityID} />
          <BacklinkTab entityID={props.entityID} />
        </div>
      </div>
      <animated.div style={drawerSpring}>
        <div ref={measure}>
          <MessageWindow
            onDragTop={() => useUIState.getState().closeDrawer(props.entityID)}
            style={{
              maxHeight: props.drawerOpen
                ? `min(60vh, ${viewportHeight - 128}px)`
                : "",
            }}
            className={`cardDrawerContent no-scrollbar relative flex h-fit shrink flex-col gap-2 overflow-x-hidden overflow-y-scroll`}
          >
            {!drawer || drawer === "chat" ? (
              <DiscussionContent
                entityID={props.entityID}
                open={props.drawerOpen}
              />
            ) : (
              <Backlinks entityID={props.entityID} />
            )}
            {/* <div className="scroll-m-8 b ${
          }g-white" /> */}
          </MessageWindow>
        </div>
      </animated.div>
      <div
        className={`sticky bottom-0  mt-2  pb-2`}
        style={{ backgroundColor: cardBackgroundColor }}
      >
        {(drawer === "chat" || !drawer) && (
          <MessageInput
            entityID={props.entityID}
            allowReact={true}
            isRoom={false}
            onSend={() =>
              useUIState.getState().openDrawer(props.entityID, "chat")
            }
          />
        )}
      </div>
    </div>
  );
};

const DiscussionContent = (props: { entityID: string; open: boolean }) => {
  useMarkRead(props.entityID, props.open);
  return (
    <>
      <div className="-mx-3 flex flex-col sm:-mx-4">
        <Messages entityID={props.entityID} isRoom={false} />
      </div>
    </>
  );
};

const ChatTab = (props: { entityID: string }) => {
  let messages = db.useMessages(props.entityID);
  return (
    <Tab
      entityID={props.entityID}
      text={`chat (${messages.length})`}
      id="chat"
    />
  );
};

const BacklinkTab = (props: { entityID: string }) => {
  let rooms = db.useReference(props.entityID, "desktop/contains");
  let cardBacklinks = db.useReference(props.entityID, "deck/contains");
  let messageBacklinks = db.useReference(
    props.entityID,
    "message/attached-card"
  );
  let inlineBacklinks = db.useReference(props.entityID, "card/inline-links-to");
  let references =
    cardBacklinks.length +
    messageBacklinks.length +
    inlineBacklinks.length +
    rooms.length;
  if (references === 0) return null;
  return (
    <Tab
      entityID={props.entityID}
      text={`backlinks (${references})`}
      id="backlinks"
    />
  );
};

const Tab = (props: {
  id: "backlinks" | "chat";
  text: string;
  entityID: string;
}) => {
  let currentTab =
    useUIState((s) => s.cardStates[props.entityID]?.drawer) || "chat";
  let drawerOpen = useUIState((s) => s.cardStates[props.entityID]?.drawerOpen);
  let cardBackgroundColor =
    db.useEntity(props.entityID, "card/background-color")?.value || "#FFFFFF";
  return (
    <button
      onClick={() => {
        if (currentTab !== props.id || !drawerOpen) {
          useUIState.getState().openDrawer(props.entityID, props.id);
        } else {
          useUIState.getState().closeDrawer(props.entityID);
        }
      }}
      style={{
        backgroundColor: currentTab === props.id ? cardBackgroundColor : "",
        borderBottom:
          currentTab === props.id ? "1px solid " + cardBackgroundColor : "",
      }}
      className={`${
        currentTab === props.id ? `font-bold` : "bg-grey-90"
      } -mb-[1px] w-fit shrink-0 rounded-t-md border border-grey-80  px-2  pt-0.5 text-sm text-grey-35`}
    >
      {props.text}
    </button>
  );
};
