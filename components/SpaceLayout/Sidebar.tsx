import { ButtonLink } from "components/Buttons";
import { SingleTextSection } from "components/CardView/Sections";
import { Divider } from "components/Layout";
import { useIndex, useMutations } from "hooks/useReplicache";
import { useState } from "react";
import { ulid } from "src/ulid";

export const Sidebar = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
}) => {
  let homeEntity = useIndex.aev("home");
  let rooms = useIndex.aev("room/name");
  let { mutate, authorized } = useMutations();
  return (
    <div className="roomList flex h-full w-48 shrink-0 flex-col gap-2 rounded-l-[3px] border-r border-grey-90 bg-white p-4 text-grey-35">
      {props.currentRoom === homeEntity[0]?.entity ? (
        <h3>Homeroom</h3>
      ) : (
        <RoomTitle entityID={props.currentRoom} />
      )}
      <Divider />
      <div>
        <h4>Shared</h4>
        <ul>
          <ButtonLink
            onClick={() => {
              props.onRoomChange(homeEntity[0]?.entity);
            }}
            content="Homeroom"
            className={
              homeEntity[0]?.entity === props.currentRoom
                ? "text-grey-35"
                : "text-grey-55"
            }
          />
          {rooms
            .filter((f) => f.value !== "prompts")
            .map((room) => {
              return (
                <ButtonLink
                  onClick={() => props.onRoomChange(room.entity)}
                  content={room.value}
                  className={`max-w-full overflow-hidden whitespace-nowrap ${
                    room.entity === props.currentRoom
                      ? "text-grey-35"
                      : "text-grey-55"
                  }`}
                />
              );
            })}
        </ul>
        <ButtonLink
          onClick={async () => {
            let room = ulid();
            await mutate("assertFact", {
              entity: room,
              attribute: "room/name",
              value: "Untitled Room",
              positions: {},
            });
            props.onRoomChange(room);
          }}
          content="new room"
        />
      </div>
      <div>
        <h4>Members</h4>
        <MemberList {...props} />
        <ButtonLink content="invite member" />
      </div>

      <button
        onClick={async () => {
          let promptRoom = rooms.find((f) => f.value === "prompts")?.entity;
          if (!promptRoom) {
            promptRoom = ulid();
            await mutate("assertFact", {
              entity: promptRoom,
              attribute: "room/name",
              value: "prompts",
              positions: {},
            });
          }
          console.log(rooms.find((f) => f.value === "prompts"));
          props.onRoomChange(promptRoom);
        }}
      >
        <h4>Prompts</h4>
      </button>
    </div>
  );
};

const MemberList = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
}) => {
  let members = useIndex.aev("member/name");

  return (
    <ul>
      {members.map((member) => (
        <ButtonLink
          onClick={() => props.onRoomChange(member.entity)}
          content={member.value}
          className={
            member.entity === props.currentRoom
              ? "text-grey-35"
              : "text-grey-55"
          }
        />
      ))}
    </ul>
  );
};

const RoomTitle = (props: { entityID: string | null }) => {
  let name = useIndex.eav(props.entityID, "room/name");
  let memberName = useIndex.eav(props.entityID, "member/name");
  let [state, setState] = useState<"editting" | "normal">("normal");
  if (!props.entityID) return null;
  return (
    <div className="grid grid-flow-col gap-2">
      {state === "editting" && !memberName ? (
        <SingleTextSection
          entityID={props.entityID}
          section="room/name"
          placeholder="room"
        />
      ) : (
        <h2>{memberName?.value || name?.value}</h2>
      )}
      {!memberName && (
        <button
          className="justify-self-end"
          onClick={() => {
            setState(state === "editting" ? "normal" : "editting");
          }}
        >
          {state === "editting" ? "done" : "edit"}
        </button>
      )}
    </div>
  );
};
