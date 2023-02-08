import { useMutations, useIndex } from "hooks/useReplicache";
import { ulid } from "src/ulid";
import { RoomListLabel, RoomListItem } from "./RoomListLayout";

export const SharedRoomList = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
  setRoomEditOpen: () => void;
}) => {
  let { mutate, authorized } = useMutations();
  let rooms = useIndex.aev("room/name");

  return (
    <div className="flex flex-col gap-1">
      <RoomListLabel
        label="rooms"
        helpText={
          <>
            {" "}
            <p>Rooms are workspaces to collect, create, and play with cards.</p>
            <p>Make as many as you like!</p>
          </>
        }
      />

      <ul className="sidebarSharedRoomList flex flex-col gap-0.5">
        {rooms
          .filter((f) => f.value !== "prompts")
          .map((room) => {
            return (
              <RoomListItem
                onRoomChange={props.onRoomChange}
                currentRoom={props.currentRoom}
                roomEntity={room.entity}
                setRoomEditOpen={props.setRoomEditOpen}
              >
                {room.value || <i>Untitled Room</i>}
              </RoomListItem>
            );
          })}
        {!authorized ? null : (
          <button
            className="sidebarAddRoom flex w-full place-items-center justify-between gap-1 rounded-md border border-transparent py-0.5 px-2 text-grey-55 hover:border-accent-blue hover:text-accent-blue"
            onClick={async () => {
              let room = ulid();
              await mutate("assertFact", {
                entity: room,
                attribute: "room/name",
                value: "",
                positions: {},
              });
              props.onRoomChange(room);
              props.setRoomEditOpen();
            }}
          >
            + room
          </button>
        )}
      </ul>
    </div>
  );
};
