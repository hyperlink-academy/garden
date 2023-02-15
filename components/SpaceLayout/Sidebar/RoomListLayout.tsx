import { Popover } from "@headlessui/react";
import { ButtonPrimary } from "components/Buttons";
import { Modal, Divider } from "components/Layout";
import { Fact } from "data/Facts";
import { DeckSmall, Delete, MoreOptionsTiny } from "../../Icons";
import { useIndex, useMutations } from "hooks/useReplicache";
import { useState, useEffect } from "react";

export const RoomListLabel = (props: {
  helpText: React.ReactNode;
  label: string;
}) => {
  return (
    <div className="flex flex-col gap-1 pb-1">
      <div className="flex justify-between">
        <small className="px-2 font-bold text-grey-55">{props.label}</small>
        <div className=" -mt-[2px] pr-2 ">
          <Popover className="">
            <Popover.Button>
              <span className="text-sm text-grey-55">
                <em>?</em>
              </span>
            </Popover.Button>
            <div className="absolute z-10">
              <Popover.Panel className="lightBorder absolute left-9 -top-6 z-50 flex w-[154px] flex-col gap-2 bg-white p-2 text-sm text-grey-55  sm:w-56">
                <div className="flex flex-col gap-1">{props.helpText}</div>
              </Popover.Panel>
            </div>
          </Popover>
        </div>
      </div>
      <div className="w-full border-t border-dashed border-grey-80" />
    </div>
  );
};

export const EditRoomModal = (props: {
  open: boolean;
  onClose: () => void;
  currentRoom: string | null;
}) => {
  let currentRoom:
    | Fact<"room/name">
    | Fact<"member/name">
    | Fact<"promptroom/name">
    | null = null;
  let isMember = false;
  let isPromptRoom = false;
  let sharedRoom = useIndex.eav(props.currentRoom, "room/name");
  let memberRoom = useIndex.eav(props.currentRoom, "member/name");
  let promptRoom = useIndex.eav(props.currentRoom, "promptroom/name");

  if (memberRoom) {
    currentRoom = memberRoom;
    isMember = true;
  } else if (promptRoom) {
    currentRoom = promptRoom;
    isPromptRoom = true;
  } else currentRoom = sharedRoom;

  let { mutate } = useMutations();
  let [formState, setFormState] = useState(currentRoom?.value || "");

  useEffect(() => {
    setFormState(currentRoom?.value || "");
  }, [currentRoom?.value]);

  if (!props.currentRoom) return null;
  let entityID = props.currentRoom;

  return (
    <Modal open={props.open} onClose={props.onClose}>
      <div className="editRoomModal flex flex-col gap-3 text-grey-35">
        <h3>Room Settings</h3>
        {isMember ? (
          <p className="italic text-grey-55">nothing to edit... yet ;)</p>
        ) : (
          <>
            <div className="editRoomName flex flex-col gap-1">
              <p className="font-bold">Room Name</p>
              <input
                className="w-full"
                value={formState}
                placeholder={currentRoom?.value}
                onChange={(e) => {
                  let value = e.currentTarget.value;
                  setFormState(value);
                }}
              />
            </div>
            <ButtonPrimary
              content="Edit Room!"
              onClick={async () => {
                await mutate("assertFact", {
                  entity: entityID,
                  attribute: isPromptRoom ? "promptroom/name" : "room/name",
                  value: formState,
                  positions: {},
                });
                setFormState("");
                props.onClose();
              }}
            />

            <Divider />
            {isMember ? null : (
              <ButtonPrimary
                destructive
                onClick={async () => {
                  await mutate("deleteEntity", { entity: entityID });
                  setFormState("");
                  props.onClose();
                }}
                content="Delete this room"
                icon={<Delete />}
              />
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export const RoomListItem = (props: {
  onRoomChange: (room: string) => void;
  children: React.ReactNode;
  unreads?: number;
  currentRoom: string | null;
  roomEntity: string;
  setRoomEditOpen: () => void;
}) => {
  let { authorized } = useMutations();
  let roomType = useIndex.eav(props.roomEntity, "room/type");
  return (
    <div
      className={`flex w-full items-center gap-2 overflow-hidden rounded-md border border-transparent  text-left ${props.roomEntity === props.currentRoom
          ? "rounded-md bg-accent-blue  font-bold text-white"
          : " text-grey-35 hover:border-grey-80"
        }`}
    >
      <button
        className="sidebarRoomName flex w-full flex-row gap-2 whitespace-nowrap py-0.5 pl-2 text-left"
        onClick={() => props.onRoomChange(props.roomEntity)}
      >
        {roomType?.value === "collection" ? (
          <div className="w-6">
            <DeckSmall />
          </div>
        ) : null}
        {props.children}
      </button>
      {!!props.unreads && props.unreads > 0 && (
        <div className="h-[20px] w-[20px] shrink-0 rounded-full bg-accent-gold">
          {props.unreads}
        </div>
      )}
      {!authorized ? null : (
        <button
          onClick={() => props.setRoomEditOpen()}
          className={`  sidebarRoomOptions mr-2 rounded-md border border-transparent pt-[1px] hover:border-white ${props.roomEntity === props.currentRoom ? "" : "hidden"
            }`}
        >
          <MoreOptionsTiny />
        </button>
      )}
    </div>
  );
};
