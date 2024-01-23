import { db } from "hooks/useReplicache";
import { useUIState } from "hooks/useUIState";
import { useState } from "react";
import { useMarkRead, Messages, MessageInput } from "./Discussion";
import { Backlinks } from "./Backlinks";

export const DiscussionAndBacklinks = (props: { entityID: string }) => {
  let drawer = useUIState((s) => s.cardStates[props.entityID]?.drawer);

  return (
    <div className="">
      <div className="cardDrawerTabs flex items-end gap-2 border-b border-b-grey-80 ">
        <CommentsTab entityID={props.entityID} />
        <BacklinkTab entityID={props.entityID} />
      </div>
      {drawer === "comments" ? (
        <DiscussionContent entityID={props.entityID} open={true} />
      ) : (
        <Backlinks entityID={props.entityID} />
      )}
    </div>
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

const DiscussionContent = (props: { entityID: string; open: boolean }) => {
  let [reply, setReply] = useState<string | null>(null);
  useMarkRead(props.entityID, props.open);
  return (
    <>
      <div className="-mx-3 flex flex-col sm:-mx-4">
        <Messages
          entityID={props.entityID}
          isRoom={false}
          setReply={setReply}
        />
      </div>

      <div className="sticky -bottom-[0px]">
        <MessageInput
          entityID={props.entityID}
          allowReact={true}
          isRoom={false}
          reply={reply}
          setReply={setReply}
        />
      </div>
    </>
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
