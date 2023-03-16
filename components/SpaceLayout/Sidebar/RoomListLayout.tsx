import { ButtonPrimary } from "components/Buttons";
import { Modal, Divider } from "components/Layout";
import { Fact } from "data/Facts";
import {
  Delete,
  MoreOptionsTiny,
  RoomCalendar,
  RoomCanvas,
  RoomCollection,
  RoomMember,
  RoomSearch,
} from "../../Icons";
import {
  ReplicacheContext,
  scanIndex,
  useIndex,
  useMutations,
} from "hooks/useReplicache";
import { useState, useEffect, useContext } from "react";
import { useSubscribe } from "replicache-react";
import { useDraggableCard, useDroppableZone } from "components/DragContext";
import { sortByPosition, updatePositions } from "src/position_helpers";
import { useCombinedRefs } from "components/Desktop";

export const RoomListLabel = (props: { label: string }) => {
  return <div className="px-2 pb-1 font-bold text-grey-35">{props.label}</div>;
};

export const EditRoomModal = (props: {
  open: boolean;
  onClose: () => void;
  currentRoom: string | null;
}) => {
  let currentRoom: Fact<"room/name"> | Fact<"member/name"> | null = null;
  let isMember = false;
  let sharedRoom = useIndex.eav(props.currentRoom, "room/name");
  let memberRoom = useIndex.eav(props.currentRoom, "member/name");

  if (memberRoom) {
    currentRoom = memberRoom;
    isMember = true;
  } else currentRoom = sharedRoom;

  let { mutate } = useMutations();
  let [formState, setFormState] = useState(currentRoom?.value || "");

  useEffect(() => {
    setFormState(currentRoom?.value || "");
  }, [currentRoom?.value, props.open]);

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
                  attribute: "room/name",
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
  currentRoom: string | null;
  roomEntity: string;
  setRoomEditOpen?: () => void;
}) => {
  let { memberEntity, authorized } = useMutations();
  let isMember = !!useIndex.eav(props.roomEntity, "member/name");
  let roomType = useIndex.eav(props.roomEntity, "room/type");

  let rep = useContext(ReplicacheContext);
  let unreadCount = useSubscribe(
    rep?.rep,
    async (tx) => {
      if (!memberEntity) return false;
      // NB - currently collections also use 'desktop/contains'
      let cards = await scanIndex(tx).eav(props.roomEntity, "desktop/contains");
      for (let card of cards) {
        let unread = (
          await scanIndex(tx).eav(card.value.value, "card/unread-by")
        ).find((f) => f.value.value === memberEntity);

        if (unread) return true;

        let discussions = await scanIndex(tx).eav(
          card.value.value,
          "card/discussion"
        );
        for (let d of discussions) {
          let unread = (
            await scanIndex(tx).eav(d.value.value, "discussion/unread-by")
          ).find((f) => f.value.value === memberEntity);
          if (unread) return true;
        }
      }
      return false;
    },
    false,
    [memberEntity]
  );

  return (
    <div
      className={`relative select-none rounded-md border border-transparent ${props.roomEntity === props.currentRoom
        ? "rounded-md bg-accent-blue font-bold text-white"
        : " text-grey-35 hover:border-grey-80"
        }`}
    >
      {/* buttom = name + either edit button OR room type icon */}
      <button
        style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
        className="sidebarRoomName flex w-full flex-row gap-1 py-0.5 pl-1 pr-1 text-left"
        onClick={() =>
          // don't trigger 'onRoomChange' if room already active (may be trying to setRoomEditOpen instead)
          props.roomEntity !== props.currentRoom
            ? props.onRoomChange(props.roomEntity)
            : undefined
        }
      >
        {props.roomEntity === props.currentRoom &&
          authorized &&
          props.setRoomEditOpen ? (
          // edit options - only if auth-ed AND on current room
          <div className=" roomListItemSettings flex w-5 shrink-0 place-content-center pt-0.5">
            <button
              onClick={() => props.setRoomEditOpen?.()}
              className={` rounded-md border border-transparent pt-[1px] hover:border-white`}
            >
              <MoreOptionsTiny />
            </button>
          </div>
        ) : (
          // when not on room, show room type icon
          <div
            className={` roomListItemIcon mt-[2px] h-5 w-5 shrink-0 pt-[1px] pl-[2px]
             ${props.roomEntity === props.currentRoom
                ? "text-white"
                : "text-grey-55"
              }`}
          >
            {props.roomEntity === memberEntity || isMember ? (
              <RoomMember />
            ) : roomType?.value === "collection" ? (
              <RoomCollection />
            ) : roomType?.value === "canvas" ? (
              <RoomCanvas />
            ) : props.roomEntity === "search" ? (
              <RoomSearch />
            ) : props.roomEntity === "calendar" ? (
              <RoomCalendar />
            ) : null}
          </div>
        )}
        <div className="roomListItemUnreads grow">{props.children}</div>
        {unreadCount && (
          <div className="unreadCount mt-[6px] ml-1 h-[12px] w-[12px] shrink-0 rounded-full border  border-white bg-accent-gold"></div>
        )}
      </button>
    </div>
  );
};

export const DraggableRoomListItem = (props: {
  draggable: boolean;
  entityID: string;
  factID: string;
  children: React.ReactNode
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
  setRoomEditOpen: () => void;
}) => {
  let rep = useContext(ReplicacheContext);
  const { attributes, listeners, setNodeRef, isOverSomethingElse } =
    useDraggableCard({
      disabled: !props.draggable,
      type: "room",
      entityID: props.entityID,
      id: props.factID,
    });

  let { mutate } = useMutations();
  let { setNodeRef: droppableRef, over } = useDroppableZone({
    type: "room",
    entityID: props.entityID,
    id: props.factID,
    onDragEnd: async (data) => {
      if (!rep) return;
      if (data.type !== "room") return;
      let siblings = (
        await rep.rep.query((tx) => {
          return scanIndex(tx).aev("room/name");
        })
      ).sort(sortByPosition("roomList"));
      let currentIndex = siblings.findIndex((f) => f.entity === data.entityID);
      let newIndex = siblings.findIndex((f) => f.entity === props.entityID);
      let newPositions = updatePositions("roomList", siblings, [
        [siblings[currentIndex].id, newIndex - 1],
      ]);
      mutate("updatePositions", {
        positionKey: "roomList",
        newPositions,
      });
    },
  });
  useEffect(() => {
    if (over?.type === "room" || !over) return;
    let timeout = window.setTimeout(() => {
      props.onRoomChange(props.entityID);
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [over]);


  let refs = useCombinedRefs(setNodeRef, droppableRef);

  let obj =
    { ...listeners, ...attributes };
  return (
    <div {...obj} ref={refs} className={``}>
      {over && over.entityID !== props.entityID && over.type === "room" && (
        <div className="opacity-60">
          <RoomListPreview entityID={over.entityID} />
        </div>
      )}
      {isOverSomethingElse ? null : (
        <RoomListItem
          onRoomChange={props.onRoomChange}
          currentRoom={props.currentRoom}
          roomEntity={props.entityID}
          setRoomEditOpen={props.setRoomEditOpen}
        >
          {props.children}
        </RoomListItem>
      )}
    </div>
  );
};


export const RoomListPreview = (props: { entityID: string }) => {
  let name = useIndex.eav(props.entityID, "room/name");
  return (
    <RoomListItem
      roomEntity={props.entityID}
      onRoomChange={() => { }}
      currentRoom={null}
    >
      {name?.value}
    </RoomListItem>
  );
};
