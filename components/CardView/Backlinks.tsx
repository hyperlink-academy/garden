import { CardPreviewWithData } from "components/CardPreview";
import { RoomCanvas, RoomChat, RoomCollection } from "components/Icons";
import { db, scanIndex, useMutations } from "hooks/useReplicache";
import { useSubscribe } from "hooks/useSubscribe";
import { useRoom, useSetRoom } from "hooks/useUIState";
import { Message } from "data/Messages";

import { sortByPosition } from "src/position_helpers";

export const Backlinks = (props: { entityID: string }) => {
  let room = useRoom();
  let rooms = db
    .useReference(props.entityID, "desktop/contains")
    .filter((r) => r.entity != room);
  let cardBacklinks = db.useReference(props.entityID, "deck/contains");
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
  if (cards.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <div>
        <h4>Rooms</h4>
        <hr className="border-grey-80" />
      </div>
      {rooms.map((c) => {
        return <Room entityID={c.entity} key={c.id} />;
      })}
      {roomMessages.map((m) => (
        <MessageBacklink key={m.id} id={m.id}>
          <Room entityID={m.topic} />
        </MessageBacklink>
      ))}
      <div>
        <h4>Cards</h4>
        <hr className="border-grey-80" />
      </div>
      {cards.map((c) => {
        return (
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
          <MessageBacklink key={c.id} id={c.id}>
            <CardPreviewWithData entityID={c.topic} size={"big"} hideContent />
          </MessageBacklink>
        );
      })}
    </div>
  );
};

const MessageBacklink = (props: { id: string; children: React.ReactNode }) => {
  let message = db.useMessageByID(props.id);
  let sender = db.useEntity(message?.sender || null, "member/name");
  if (!message) return null;

  let time = message ? new Date(parseInt(message?.ts)) : null;

  return (
    <div className="flex flex-col">
      {props.children}
      <div className="flex flex-row ">
        <div className="ml-3 h-6 w-3 self-start rounded-bl-md border-b border-l border-dashed border-grey-80" />
        <div className="mt-2 flex flex-col rounded-md border border-grey-80 bg-bg-blue py-2 px-3 text-grey-35">
          <div className="flex flex-row gap-1">
            <div className="font-bold">{sender?.value}</div>

            <div className="text-grey-55">
              {time?.toLocaleDateString(undefined, {
                month: "numeric",
                year: "2-digit",
                day: "numeric",
              })}
            </div>
          </div>
          <div>{message.content}</div>
        </div>
      </div>
    </div>
  );
};

const Room = (props: { entityID: string }) => {
  let roomName = db.useEntity(props.entityID, "room/name");
  let roomType = db.useEntity(props.entityID, "room/type");
  let setRoom = useSetRoom();
  return (
    <button
      onClick={() => {
        setRoom(props.entityID);
        setTimeout(() => {
          document.getElementById("room-wrapper")?.scrollIntoView();
        }, 300);
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
