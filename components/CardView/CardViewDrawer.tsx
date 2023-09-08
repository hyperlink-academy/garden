import { db } from "hooks/useReplicache";
import { useRoom } from "hooks/useUIState";
import { useRef, useState } from "react";
import { Backlinks } from "./Backlinks";
import { Discussion } from "./Discussion";

export const CardViewDrawer = (props: { entityID: string }) => {
  let ref = useRef<HTMLDivElement | null>(null);
  let [tab, setTab] = useState<"comments" | "backlinks">("comments");
  return (
    <>
      <div className="sticky -bottom-4 z-10 -mx-3 mt-16  md:-mx-4">
        <div className="flex items-end gap-2 border-b border-b-grey-80 pl-4">
          <CommentsTab
            entityID={props.entityID}
            currentTab={tab}
            onClick={() => {
              setTab("comments");
              ref.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            }}
          />
          <BacklinkTab
            entityID={props.entityID}
            currentTab={tab}
            onClick={() => {
              setTab("backlinks");
              ref.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            }}
          />
        </div>
        <div className="h-4 w-full bg-white" />
      </div>
      {/* END CARD CONTENT */}

      {/* START CARD DISCUSSION */}
      {tab === "comments" ? (
        <Discussion entityID={props.entityID} allowReact isRoom={false} />
      ) : (
        <Backlinks entityID={props.entityID} />
      )}
      <div ref={ref} className="scroll-m-8 bg-white" />
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
        props.currentTab === props.id ? "font-bold" : "bg-grey-90"
      } -mb-[1px] w-fit shrink-0 rounded-t-md border border-grey-80 border-b-white bg-white px-2  pt-0.5 text-sm text-grey-55`}
    >
      {props.text}
    </button>
  );
};
