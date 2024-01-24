import { db } from "hooks/useReplicache";
import { useRef, useState } from "react";
import { Backlinks } from "./Backlinks";
import {
  DiscussionRoom,
  MessageInput,
  MessageWindow,
  Messages,
  useMarkRead,
} from "./Discussion";
import { useViewportSize } from "@react-aria/utils";
import { useUIState } from "hooks/useUIState";

export const CardViewDrawer = (props: {
  entityID: string;
  drawerOpen: boolean;
}) => {
  let drawer = useUIState((s) => s.cardStates[props.entityID]?.drawer);
  let viewportHeight = useViewportSize().height;
  let [reply, setReply] = useState<string | null>(null);

  return (
    <div className="z-10 ">
      <div className="cardDrawerHeader -mx-3 -mt-6  md:-mx-4">
        <div className="cardDrawerTabs flex items-end gap-2 border-b border-b-grey-80 pl-4">
          <CommentsTab entityID={props.entityID} />
          <BacklinkTab entityID={props.entityID} />
        </div>
      </div>
      <MessageWindow
        style={{
          maxHeight: props.drawerOpen
            ? `min(60vh, ${viewportHeight - 128}px)`
            : "",
        }}
        className={`cardDrawerContent no-scrollbar relative flex shrink flex-col gap-2 overflow-x-hidden overflow-y-scroll ${
          props.drawerOpen ? " h-fit" : "h-0 "
        }`}
      >
        {drawer === "comments" ? (
          <DiscussionContent
            entityID={props.entityID}
            open={props.drawerOpen}
            setReply={setReply}
          />
        ) : (
          <Backlinks entityID={props.entityID} />
        )}
        {/* <div className="scroll-m-8 bg-white" /> */}
      </MessageWindow>
      {(drawer === "comments" || drawer === null) && (
        <div className="sticky bottom-0  mt-2 ">
          <MessageInput
            entityID={props.entityID}
            allowReact={true}
            isRoom={false}
            reply={reply}
            setReply={setReply}
            onSend={() =>
              useUIState.getState().openDrawer(props.entityID, "comments")
            }
          />
        </div>
      )}
    </div>
  );
};

const DiscussionContent = (props: {
  entityID: string;
  open: boolean;
  setReply: (reply: string) => void;
}) => {
  useMarkRead(props.entityID, props.open);
  return (
    <>
      <div className="-mx-3 flex flex-col sm:-mx-4">
        <Messages
          entityID={props.entityID}
          isRoom={false}
          setReply={props.setReply}
        />
      </div>
    </>
  );
};

const CommentsTab = (props: { entityID: string }) => {
  let messages = db.useMessages(props.entityID);
  return (
    <Tab
      entityID={props.entityID}
      text={`comments (${messages.length})`}
      id="comments"
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
      text={`mentioned in (${references})`}
      id="backlinks"
    />
  );
};

const Tab = (props: {
  id: "backlinks" | "comments";
  text: string;
  entityID: string;
}) => {
  let currentTab =
    useUIState((s) => s.cardStates[props.entityID]?.drawer) || "comments";
  let drawerOpen = useUIState((s) => s.cardStates[props.entityID]?.drawerOpen);
  return (
    <button
      onClick={() => {
        if (currentTab !== props.id || !drawerOpen) {
          useUIState.getState().openDrawer(props.entityID, props.id);
        } else {
          useUIState.getState().closeDrawer(props.entityID);
        }
      }}
      className={`${
        currentTab === props.id
          ? "border-b-white bg-white font-bold"
          : "bg-grey-90"
      } -mb-[1px] w-fit shrink-0 rounded-t-md border border-grey-80  px-2  pt-0.5 text-sm text-grey-35`}
    >
      {props.text}
    </button>
  );
};
