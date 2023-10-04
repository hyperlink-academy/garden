import { RadioGroup } from "@headlessui/react";
import {
  useMutations,
  db,
  ReplicacheContext,
  scanIndex,
} from "hooks/useReplicache";
import { useContext, useEffect, useState } from "react";
import { ulid } from "src/ulid";
import { DraggableRoomListItem, RoomListPreview } from "./RoomListLayout";
import { sortByPosition, updatePositions } from "src/position_helpers";
import { useDroppableZone } from "components/DragContext";
import {
  AddTiny,
  RoomCanvas,
  RoomChat,
  RoomCollection,
} from "components/Icons";
import { useRoom, useSetRoom } from "hooks/useUIState";
import { ModalButton, ModalNew } from "components/Modal";

export const SharedRoomList = (props: { setRoomEditOpen: () => void }) => {
  let { authorized } = useMutations();
  let rooms = db.useAttribute("room/name").sort(sortByPosition("roomList"));
  let currentRoom = useRoom();
  let setRoom = useSetRoom();

  useEffect(() => {
    let listener = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" && e.altKey) {
        let currentIndex = rooms.findIndex((r) => r.entity === currentRoom);
        if (currentIndex === -1) return;
        if (currentIndex > 0) {
          setRoom(rooms[currentIndex - 1].entity);
        }
      }
      if (e.key === "ArrowDown" && e.altKey) {
        let currentIndex = rooms.findIndex((r) => r.entity === currentRoom);
        if (currentIndex === -1) return;
        if (currentIndex < rooms.length) {
          setRoom(rooms[currentIndex + 1].entity);
        }
      }
    };
    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [currentRoom, setRoom, rooms]);

  return (
    <div className="flex flex-col gap-0.5">
      <ul className="sidebarSharedRoomList flex flex-col gap-0.5">
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
      </ul>
    </div>
  );
};

const CreateRoom = () => {
  let { mutate, authorized } = useMutations();
  let [open, setOpen] = useState(false);
  let [roomState, setRoomState] = useState({
    name: "",
    type: "canvas" as "canvas" | "collection" | "chat",
  });

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
      <ModalNew header="Create Room" open={open} onClose={() => setOpen(false)}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            let room = ulid();
            await mutate("assertFact", {
              entity: room,
              attribute: "room/name",
              value: roomState.name,
              positions: {},
            });
            await mutate("assertFact", {
              entity: room,
              attribute: "room/type",
              value: roomState.type,
              positions: {},
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
                <RadioGroup.Option value="canvas">
                  {({ checked }) => (
                    <div
                      className={`${
                        checked ? "bg-bg-blue" : ""
                      } flex items-center justify-between gap-2 rounded-md border border-grey-15 p-2 hover:cursor-pointer`}
                    >
                      <div className="flex items-center gap-2">
                        <RoomCanvas />
                        <span className="font-bold">Canvas</span>
                      </div>
                      <span className="text-sm italic">spatial workspace</span>
                    </div>
                  )}
                </RadioGroup.Option>
                <RadioGroup.Option value="collection">
                  {({ checked }) => (
                    <div
                      className={`${
                        checked ? "bg-bg-blue" : ""
                      } flex items-center justify-between gap-2 rounded-md border border-grey-15 p-2 hover:cursor-pointer`}
                    >
                      <div className="flex items-center gap-2">
                        <RoomCollection />
                        <span className="font-bold">Collection</span>
                      </div>
                      <span className="text-sm italic">ordered list</span>
                    </div>
                  )}
                </RadioGroup.Option>
                <RadioGroup.Option value="chat">
                  {({ checked }) => (
                    <div
                      className={`${
                        checked ? "bg-bg-blue" : ""
                      } flex items-center justify-between gap-2 rounded-md border border-grey-15 p-2 hover:cursor-pointer`}
                    >
                      <div className="flex items-center gap-2">
                        <RoomChat />
                        <span className="font-bold">Chat</span>
                      </div>
                      <span className="text-sm italic">group conversation</span>
                    </div>
                  )}
                </RadioGroup.Option>
              </div>
            </RadioGroup>

            <ModalButton
              content="Construct Room"
              onClose={() => setOpen(false)}
            />
          </>
        </form>
      </ModalNew>
    </>
  );
};
