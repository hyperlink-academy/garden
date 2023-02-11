import { useIndex, useMutations } from "hooks/useReplicache";
import { ulid } from "src/ulid";
import { RoomListLabel, RoomListItem } from "./RoomListLayout";

export const PromptRoomList = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
  setRoomEditOpen: () => void;
}) => {
  let promptRooms = useIndex.aev("promptroom/name");
  let { mutate, authorized } = useMutations();
  return (
    <div className="flex flex-col gap-1">
      <RoomListLabel
        label="prompts"
        helpText={
          <>
            <p>Prompt rooms are for action items — things to do!</p>
            <p>
              You can draw prompt cards from your room, and reply with new
              cards.
            </p>
          </>
        }
      />

      <ul className="sidebarPromptRoomList flex flex-col gap-0.5">
        {promptRooms.map((room) => {
          return (
            <RoomListItem
              onRoomChange={props.onRoomChange}
              currentRoom={props.currentRoom}
              roomEntity={room.entity}
              setRoomEditOpen={props.setRoomEditOpen}
            >
              {room.value || <i>Untitled Prompts</i>}
            </RoomListItem>
          );
        })}
        {!authorized ? null : (
          <button
            className=" flex w-full place-items-center justify-between gap-1 rounded-md border border-transparent py-0.5 px-2 text-grey-55 hover:border-accent-blue hover:text-accent-blue"
            onClick={async () => {
              let room = ulid();
              await mutate("assertFact", {
                entity: room,
                attribute: "promptroom/name",
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
