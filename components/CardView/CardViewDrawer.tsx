import { db } from "hooks/useReplicache";
import { useRef, useState } from "react";
import { Backlinks } from "./Backlinks";
import { DiscussionRoom, MessageInput, Messages } from "./Discussion";

export const CardViewDrawer = (props: {
  entityID: string;
  drawerOpen: boolean;
  setDrawerOpen: () => void;
  setDrawerClosed: () => void;
}) => {
  let ref = useRef<HTMLDivElement | null>(null);
  let [tab, setTab] = useState<"comments" | "backlinks">("comments");
  return (
    <div className="z-10 ">
      <div className="cardDrawerHeader -mx-3 -mt-6  md:-mx-4">
        <div className="cardDrawerTabs flex items-end gap-2 border-b border-b-grey-80 pl-4">
          <CommentsTab
            entityID={props.entityID}
            currentTab={tab}
            onClick={() => {
              if (tab === "backlinks" || !props.drawerOpen) {
                props.setDrawerOpen();
                setTab("comments");
                ref.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "end",
                });
              } else {
                props.setDrawerClosed();
              }
            }}
          />
          <BacklinkTab
            entityID={props.entityID}
            currentTab={tab}
            onClick={() => {
              if (tab === "comments" || !props.drawerOpen) {
                props.setDrawerOpen();
                setTab("backlinks");
                ref.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "end",
                });
              } else {
                props.setDrawerClosed();
              }
            }}
          />
        </div>
      </div>
      <div
        className={`cardDrawerContent no-scrollbar relative shrink overflow-x-hidden overflow-y-scroll ${
          props.drawerOpen ? " mt-4 mb-2  h-fit max-h-[60vh] " : "mb-2 h-0 "
        }`}
      >
        {tab === "comments" ? (
          <DiscussionContent entityID={props.entityID} />
        ) : (
          <Backlinks entityID={props.entityID} />
        )}
        <div ref={ref} className="scroll-m-8 bg-white" />
      </div>
    </div>
  );
};

const DiscussionContent = (props: { entityID: string }) => {
  let [reply, setReply] = useState<string | null>(null);
  return (
    <>
      <div className="flex flex-col-reverse">
        <Messages
          entityID={props.entityID}
          isRoom={false}
          setReply={setReply}
        />
      </div>

      <div className="sticky bottom-0">
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

const CommentsTab = (props: {
  entityID: string;
  currentTab: string;
  onClick: () => void;
}) => {
  let messages = db.useMessages(props.entityID);
  return (
    <Tab
      onClick={props.onClick}
      currentTab={props.currentTab}
      text={`comments (${messages.length})`}
      id="comments"
    />
  );
};

const BacklinkTab = (props: {
  entityID: string;
  currentTab: string;
  onClick: () => void;
}) => {
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
      onClick={props.onClick}
      currentTab={props.currentTab}
      text={`mentioned in (${references})`}
      id="backlinks"
    />
  );
};

const Tab = (props: {
  currentTab: string;
  id: string;
  text: string;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={() => props.onClick()}
      className={`${
        props.currentTab === props.id
          ? "border-b-white bg-white font-bold"
          : "bg-grey-90"
      } -mb-[1px] w-fit shrink-0 rounded-t-md border border-grey-80  px-2  pt-0.5 text-sm text-grey-35`}
    >
      {props.text}
    </button>
  );
};
