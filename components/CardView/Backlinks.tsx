import { CardPreviewWithData } from "components/CardPreview";
import { RoomCanvas, RoomChat, RoomCollection } from "components/Icons";
import { db, scanIndex, useMutations } from "hooks/useReplicache";
import { useSubscribe } from "hooks/useSubscribe";
import { useSetRoom } from "hooks/useUIState";
import { Message } from "data/Messages";

import { sortByPosition } from "src/position_helpers";
import { useCardViewer } from "components/CardViewerContext";

export const Backlinks = (props: { entityID: string }) => {
  let rooms = db.useReference(props.entityID, "desktop/contains");
  let cardBacklinks = db.useReference(props.entityID, "deck/contains");
  let { open } = useCardViewer();
  let [cardMessages, roomMessages] = useSubscribe(
    async (tx) => {
      let messages = await scanIndex(tx).vae(
        props.entityID,
        "message/attached-card"
      );
      let result = [[], []] as [Message[], Message[]];
      for (let m of messages) {
        let message = (
          await tx
            .scan({ indexName: "messageByEntity", prefix: m.entity })
            .values()
            .toArray()
        )[0] as Message;
        let isRoom = await scanIndex(tx).eav(message.topic, "room/type");
        if (isRoom) result[1].push(message);
        else result[0].push(message);
      }
      return result;
    },
    [[], []],
    [props.entityID],
    props.entityID + "messageBacklinks"
  );
  let inlineBacklinks = db.useReference(props.entityID, "card/inline-links-to");

  let cards = cardBacklinks.sort(sortByPosition("vae"));
  let { mutate } = useMutations();
  return (
    <div className="flex flex-col gap-2">
      {rooms.length + roomMessages.length > 0 && (
        <div>
          <h4>Rooms</h4>
          <hr className="border-grey-80" />
        </div>
      )}
      {rooms.map((c) => {
        return (
          <Room
            entityID={c.entity}
            key={c.id}
            onClick={() => {
              setTimeout(() => {
                document.getElementById("room-wrapper")?.scrollIntoView();
              }, 300);
            }}
          />
        );
      })}
      {roomMessages.map((m) => (
        <MessageBacklink key={m.id} id={m.id}>
          <Room
            entityID={m.topic}
            onClick={() => {
              setTimeout(() => {
                document.getElementById(m.id)?.scrollIntoView();
              }, 400);
            }}
          />
        </MessageBacklink>
      ))}
      {cards.length + cardMessages.length + inlineBacklinks.length > 0 && (
        <div>
          <h4>Cards</h4>
          <hr className="border-grey-80" />
        </div>
      )}
      {cards.map((c) => {
        return (
          <div key={c.id}>
            <CardPreviewWithData
              key={c.id}
              hideContent
              factID={c.id}
              onDelete={() => {
                mutate("retractFact", { id: c.id });
              }}
              entityID={c.entity}
              size={"big"}
            />
          </div>
        );
      })}
      {inlineBacklinks.map((c) => {
        return (
          <CardPreviewWithData
            key={c.id}
            factID={c.id}
            onDelete={() => {
              mutate("retractFact", { id: c.id });
            }}
            entityID={c.entity}
            size={"big"}
          />
        );
      })}
      {cardMessages.map((c) => {
        return (
          <MessageBacklink
            key={c.id}
            id={c.id}
            onClick={() => {
              open({ entityID: c.topic });
            }}
          >
            <CardPreviewWithData entityID={c.topic} size={"big"} hideContent />
          </MessageBacklink>
        );
      })}
    </div>
  );
};

const MessageBacklink = (props: {
  id: string;
  children: React.ReactNode;
  onClick?: () => void;
}) => {
  let message = db.useMessageByID(props.id);
  let sender = db.useEntity(message?.sender || null, "member/name");
  if (!message) return null;

  let time = message ? new Date(parseInt(message?.ts)) : null;

  return (
    <button
      className="messageBacklinkWrapper flex w-full flex-col text-left"
      onClick={() => {
        props.onClick?.();
        setTimeout(() => {
          document.getElementById(props.id)?.scrollIntoView();
        }, 400);
      }}
    >
      <div className="w-full">{props.children}</div>
      <div className="messageBacklinkContent flex w-full flex-row ">
        <div className="messageBacklinkConnector ml-3 h-6 w-3 self-start rounded-bl-md border-b border-l border-dashed border-grey-80" />
        <div className="messageBacklinkMessageWrapper mt-2 flex w-full flex-col rounded-md border border-grey-80 bg-bg-blue px-3 py-2 text-sm text-grey-35">
          <div className="flex flex-row items-baseline gap-2">
            <div className=" messageBacklinkSender shrink grow overflow-x-hidden truncate whitespace-nowrap font-bold">
              {sender?.value}
            </div>

            <div className="messageBacklinkTimestamp shrink-0 text-xs italic text-grey-55">
              {time?.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          <div className="messageBacklinkText">{message.content}</div>
        </div>
      </div>
    </button>
  );
};

const Room = (props: { entityID: string; onClick?: () => void }) => {
  let roomName = db.useEntity(props.entityID, "room/name");
  let roomType = db.useEntity(props.entityID, "room/type");
  let setRoom = useSetRoom();
  return (
    <button
      onClick={() => {
        setRoom(props.entityID);
        props.onClick?.();
      }}
      className="flex flex-row items-center gap-2 rounded-md border border-grey-80 bg-background p-2 font-bold text-grey-35"
    >
      {roomType?.value === "collection" ? (
        <RoomCollection />
      ) : roomType?.value === "canvas" ? (
        <RoomCanvas />
      ) : (
        <RoomChat />
      )}{" "}
      {roomName?.value}
    </button>
  );
};
