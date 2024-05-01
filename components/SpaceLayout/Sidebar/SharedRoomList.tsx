import { RadioGroup } from "@headlessui/react";
import {
  useMutations,
  db,
  ReplicacheContext,
  scanIndex,
} from "hooks/useReplicache";
import { useContext, useState } from "react";
import { ulid } from "src/ulid";
import { DraggableRoomListItem, RoomListPreview } from "./RoomListLayout";
import { sortByPosition, updatePositions } from "src/position_helpers";
import { useDroppableZone } from "components/DragContext";
import {
  AddTiny,
  RoomCanvas,
  RoomCard,
  RoomChat,
  RoomCollection,
} from "components/Icons";
import { useSetRoom } from "hooks/useUIState";
import { ModalSubmitButton, Modal } from "components/Modal";
import { Fact } from "data/Facts";

export const SharedRoomList = (props: { setRoomEditOpen: () => void }) => {
  let { authorized } = useMutations();
  let rooms = db.useAttribute("room/name").sort(sortByPosition("roomList"));

  return (
    <div className="flex flex-col gap-0.5">
      <div className="sidebarSharedRoomList flex flex-col gap-0.5">
        {rooms
          .filter((f) => f.value !== "prompts")
          .map((room) => {
            return (
              <DraggableRoomListItem
                {...props}
                draggable={authorized}
                key={room.id}
                entityID={room.entity}
                factID={room.id}
              >
                {room.value || <i>Untitled Room</i>}
              </DraggableRoomListItem>
            );
          })}
        <CreateRoom />
      </div>
    </div>
  );
};

const CreateRoom = () => {
  let { mutate, authorized } = useMutations();
  let [open, setOpen] = useState(false);
  let [roomState, setRoomState] = useState({
    name: "",
    type: "canvas" as "canvas" | "collection" | "chat" | "card",
  });
  let existingCard = db.useUniqueAttribute("card/title", roomState.name);

  let setRoom = useSetRoom();
  let rep = useContext(ReplicacheContext);
  let { setNodeRef: droppableRef, over } = useDroppableZone({
    type: "room",
    entityID: "",
    id: "create-room",
    onDragEnd: async (data) => {
      if (!rep) return;
      if (data.type !== "room") return;
      let siblings = (
        await rep.rep.query((tx) => {
          return scanIndex(tx).aev("room/name");
        })
      ).sort(sortByPosition("roomList"));
      let newPositions = updatePositions("roomList", siblings, [
        [data.id, siblings.length - 1],
      ]);
      mutate("updatePositions", {
        positionKey: "roomList",
        newPositions,
      });
    },
  });

  if (!authorized) return null;
  return (
    <>
      {over && over.type === "room" && (
        <div className="opacity-60">
          <RoomListPreview entityID={over.entityID} />
        </div>
      )}
      <button
        ref={droppableRef}
        className="sidebarAddRoom group flex w-full items-center gap-2 rounded-md border border-transparent px-1 py-0.5 text-grey-55 hover:border-accent-blue hover:text-accent-blue"
        onClick={async () => {
          setOpen(true);
        }}
      >
        <div className="text-grey-80 group-hover:text-accent-blue">
          <AddTiny />
        </div>
        new room
      </button>
      <Modal header="Create Room" open={open} onClose={() => setOpen(false)}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            let room =
              roomState.type === "card" && existingCard
                ? existingCard.entity
                : ulid();
            await mutate("createRoom", { entity: room, ...roomState });
            if (roomState.type === "card" && !existingCard)
              await mutate("updateTitleFact", {
                attribute: "card/title",
                entity: room,
                value: roomState.name,
              });
            setRoom(room);
            setRoomState({ name: "", type: "canvas" });
            setOpen(false);
          }}
          className="editRoomModal flex flex-col gap-3 text-grey-35"
        >
          <>
            <div className="editRoomName flex flex-col gap-1">
              <p className="font-bold">Room Name (required)</p>
              <input
                required
                className="w-full"
                value={roomState.name}
                placeholder={"Room name"}
                onChange={(e) => {
                  let value = e.currentTarget.value;
                  setRoomState((s) => ({ ...s, name: value }));
                }}
              />
            </div>
            <RadioGroup
              value={roomState.type}
              onChange={(value) => setRoomState((s) => ({ ...s, type: value }))}
            >
              <RadioGroup.Label className="font-bold">
                Room Type
              </RadioGroup.Label>
              <div className="my-2 flex flex-col gap-2">
                <RoomTypeOption
                  type="canvas"
                  description="spatial workspace"
                  icon={<RoomCanvas />}
                  name="Canvas"
                />
                <RoomTypeOption
                  type="collection"
                  description="ordered list"
                  icon={<RoomCollection />}
                  name="Collection"
                />
                <RoomTypeOption
                  type="chat"
                  description="group conversation"
                  icon={<RoomChat />}
                  name="Chat"
                />
                <RoomTypeOption
                  type="card"
                  description="just one card"
                  icon={<RoomCard />}
                  name="Card"
                />
              </div>
            </RadioGroup>

            <ModalSubmitButton
              content="Construct Room"
              onClose={() => setOpen(false)}
            />
          </>
        </form>
      </Modal>
    </>
  );
};

function RoomTypeOption(props: {
  type: Fact<"room/type">["value"];
  name: string;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <RadioGroup.Option value={props.type}>
      {({ checked }) => (
        <div
          className={`${
            checked ? "bg-bg-blue" : ""
          } flex items-center justify-between gap-2 rounded-md border border-grey-15 p-2 hover:cursor-pointer`}
        >
          <div className="flex items-center gap-2">
            {props.icon}
            <span className="font-bold">{props.name}</span>
          </div>
          <span className="text-sm italic">{props.description}</span>
        </div>
      )}
    </RadioGroup.Option>
  );
}
