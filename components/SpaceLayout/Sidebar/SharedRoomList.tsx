import { ButtonPrimary } from "components/Buttons";
import { Modal } from "components/Layout";
import { RadioGroup } from "@headlessui/react";
import {
  useMutations,
  useIndex,
  ReplicacheContext,
  scanIndex,
} from "hooks/useReplicache";
import { useContext, useEffect, useState } from "react";
import { ulid } from "src/ulid";
import { RoomListLabel, DraggableRoomListItem, RoomListPreview } from "./RoomListLayout";
import { sortByPosition, updatePositions } from "src/position_helpers";
import { useDroppableZone } from "components/DragContext";
import { AddTiny } from "components/Icons";

export const SharedRoomList = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
  setRoomEditOpen: () => void;
}) => {
  let rooms = useIndex.aev("room/name").sort(sortByPosition("roomList"));

  useEffect(() => {
    let listener = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" && e.altKey) {
        let currentIndex = rooms.findIndex(
          (r) => r.entity === props.currentRoom
        );
        if (currentIndex === -1) return;
        if (currentIndex > 0) {
          props.onRoomChange(rooms[currentIndex - 1].entity);
        }
      }
      if (e.key === "ArrowDown" && e.altKey) {
        let currentIndex = rooms.findIndex(
          (r) => r.entity === props.currentRoom
        );
        if (currentIndex === -1) return;
        if (currentIndex < rooms.length) {
          props.onRoomChange(rooms[currentIndex + 1].entity);
        }
      }
    };
    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [props.currentRoom]);

  return (
    <div className="flex flex-col gap-0.5">
      <RoomListLabel label="Rooms" />
      <ul className="sidebarSharedRoomList flex flex-col gap-0.5">
        {rooms
          .filter((f) => f.value !== "prompts")
          .map((room) => {
            return (
              <DraggableRoomListItem
                {...props}
                draggable
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
    type: "canvas" as "canvas" | "collection",
  });

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
        className="sidebarAddRoom group flex w-full items-center gap-2 rounded-md border border-transparent py-0.5 px-1 text-grey-55 hover:border-accent-blue hover:text-accent-blue"
        onClick={async () => {
          setOpen(true);
        }}
      >
        <div className="text-grey-80 group-hover:text-accent-blue">
          <AddTiny />
        </div>
        new room
      </button>
      <Modal open={open} onClose={() => setOpen(false)}>
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
            setRoomState({ name: "", type: "canvas" });
            setOpen(false);
          }}
          className="editRoomModal flex flex-col gap-3 text-grey-35"
        >
          <h3>Room Settings</h3>
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
              <div className="flex flex-row gap-2">
                <RadioGroup.Option value="canvas">
                  {({ checked }) => (
                    <div
                      className={`${checked ? "bg-bg-blue" : ""
                        } rounded-md border border-grey-15 p-4 hover:cursor-pointer`}
                    >
                      Canvas
                    </div>
                  )}
                </RadioGroup.Option>
                <RadioGroup.Option value="collection">
                  {({ checked }) => (
                    <div
                      className={`${checked ? "bg-bg-blue" : ""
                        } rounded-md border border-grey-15 p-4 hover:cursor-pointer`}
                    >
                      Collection
                    </div>
                  )}
                </RadioGroup.Option>
              </div>
            </RadioGroup>
            <ButtonPrimary
              content="Construct Room!"
              type="submit"
              disabled={!roomState.name}
            />
          </>
        </form>
      </Modal>
    </>
  );
};
