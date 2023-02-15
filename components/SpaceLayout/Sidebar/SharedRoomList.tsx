import { ButtonPrimary } from "components/Buttons";
import { Modal } from "components/Layout";
import { RadioGroup } from "@headlessui/react";
import { useMutations, useIndex } from "hooks/useReplicache";
import { useState } from "react";
import { ulid } from "src/ulid";
import { RoomListLabel, RoomListItem } from "./RoomListLayout";
import { sortByPosition } from "src/position_helpers";

export const SharedRoomList = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
  setRoomEditOpen: () => void;
}) => {
  let desktops = useIndex.aev("room/name");
  let collections = useIndex.aev("promptroom/name");
  let rooms = [...desktops, ...collections].sort(sortByPosition("roomList"));

  return (
    <ul className="sidebarSharedRoomList flex flex-col gap-0.5">
      {rooms
        .filter((f) => f.value !== "prompts")
        .map((room) => {
          return (
            <RoomListItem
              key={room.id}
              onRoomChange={props.onRoomChange}
              currentRoom={props.currentRoom}
              roomEntity={room.entity}
              setRoomEditOpen={props.setRoomEditOpen}
            >
              {room.value || <i>Untitled Room</i>}
            </RoomListItem>
          );
        })}
      <CreateRoom />
    </ul>
  );
};

const CreateRoom = () => {
  let { mutate, authorized } = useMutations();
  let [open, setOpen] = useState(false);
  let [roomState, setRoomState] = useState({
    name: "",
    type: "canvas" as "canvas" | "collection",
  });

  if (!authorized) return null;
  return (
    <>
      <button
        className="sidebarAddRoom flex w-full place-items-center justify-between gap-1 rounded-md border border-transparent py-0.5 px-2 text-grey-55 hover:border-accent-blue hover:text-accent-blue"
        onClick={async () => {
          setOpen(true);
        }}
      >
        + new room
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
                <RadioGroup.Option value="Canvas">
                  {({ checked }) => (
                    <div
                      className={`${
                        checked ? "bg-bg-blue" : ""
                      } rounded-md border border-grey-15 p-4 hover:cursor-pointer`}
                    >
                      Canvas
                    </div>
                  )}
                </RadioGroup.Option>
                <RadioGroup.Option value="collection">
                  {({ checked }) => (
                    <div
                      className={`${
                        checked ? "bg-bg-blue" : ""
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
