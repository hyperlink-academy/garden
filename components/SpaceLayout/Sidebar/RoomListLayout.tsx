import { ButtonPrimary } from "components/Buttons";
import { Divider } from "components/Layout";
import { ModalSubmitButton, Modal } from "components/Modal";
import { Fact } from "data/Facts";
import {
  Delete,
  RoomCanvas,
  RoomChat,
  RoomCollection,
  UnreadDot,
} from "../../Icons";
import {
  ReplicacheContext,
  scanIndex,
  db,
  useMutations,
} from "hooks/useReplicache";
import { useState, useEffect, useContext } from "react";
import { useSubscribe } from "hooks/useSubscribe";
import { useDraggableCard, useDroppableZone } from "components/DragContext";
import { sortByPosition, updatePositions } from "src/position_helpers";
import { useCombinedRefs } from "components/Desktop";
import { ulid } from "src/ulid";
import { Textarea } from "components/Textarea";
import { generateKeyBetween } from "src/fractional-indexing";
import { SingleTextSection } from "components/CardView/Sections";
import { useIsActiveRoom, useRoom, useSetRoom } from "hooks/useUIState";
import { Form, SubmitButton } from "components/Form";
import { useIsMobile } from "hooks/utils";
import { useSidebarState } from "app/(app)/@sidebar/SidebarState";

export const EditRoomModal = (props: {
  open: boolean;
  room: string | null;
  onClose: () => void;
}) => {
  let currentRoomName = db.useEntity(props.room, "room/name");

  let currentRoomDescription: Fact<"room/description"> | null = null;
  currentRoomDescription = db.useEntity(props.room, "room/description");

  let { mutate } = useMutations();
  let [nameState, setNameState] = useState(currentRoomName?.value || "");
  let [descriptionState, setDescriptionState] = useState(
    currentRoomDescription?.value || ""
  );
  let [areYouSureRoomDeletionModalOpen, setAreYouSureRoomDeletionModalOpen] =
    useState(false);

  useEffect(() => {
    setNameState(currentRoomName?.value || "");
    setDescriptionState(currentRoomDescription?.value || "");
  }, [currentRoomName?.value, currentRoomDescription?.value, props.open]);

  if (!props.room) return null;

  return (
    <Modal open={props.open} onClose={props.onClose} header="Room Settings">
      <form
        className="editRoomModal flex flex-col gap-3 text-grey-35"
        onSubmit={async () => {
          if (!currentRoomName || !props.room) return;
          await mutate("updateFact", {
            id: currentRoomName?.id,
            data: {
              value: nameState,
            },
          });
          await mutate("assertFact", {
            entity: props.room,
            factID: ulid(),
            attribute: "room/description",
            value: descriptionState,
            positions: {},
          });
          props.onClose();
        }}
      >
        <>
          <div className="editRoomName flex flex-col gap-1">
            <p className="font-bold">Room Name</p>
            <input
              className="w-full"
              value={nameState}
              placeholder={currentRoomName?.value}
              onChange={(e) => {
                let value = e.currentTarget.value;
                setNameState(value);
              }}
            />
          </div>
          <div className="editRoomDescription flex flex-col gap-1">
            <p className="font-bold">Description</p>
            <Textarea
              className="box-border w-full rounded-md border border-grey-55 p-2"
              value={descriptionState}
              maxLength={500}
              placeholder={
                currentRoomDescription?.value || "Add a description…"
              }
              onChange={(e) => {
                let value = e.currentTarget.value;
                setDescriptionState(value);
              }}
            />
          </div>
          <ModalSubmitButton content="Save Changes" onClose={props.onClose} />

          <Divider />
          <div className="lightBorder flex flex-col gap-2 p-3 text-center ">
            <p className="text-sm text-grey-55">
              Don&apos;t worry, deleting this room won&apos;t delete the cards
              inside of it!
            </p>
            <ButtonPrimary
              destructive
              type="button"
              onClick={() => {
                setAreYouSureRoomDeletionModalOpen(true);
              }}
              content="Delete Room"
              icon={<Delete />}
              className="place-self-center"
            />
          </div>
        </>
      </form>
      {areYouSureRoomDeletionModalOpen && (
        <AreYouSureRoomDeletionModal
          open={areYouSureRoomDeletionModalOpen}
          onClose={() => {
            setAreYouSureRoomDeletionModalOpen(false);
            props.onClose();
          }}
          entityID={props.room}
          currentRoomName={currentRoomName}
        />
      )}
    </Modal>
  );
};

const AreYouSureRoomDeletionModal = (props: {
  open: boolean;
  onClose: () => void;
  onDelete?: () => void;
  entityID: string;
  currentRoomName: Fact<"room/name"> | Fact<"member/name"> | null;
}) => {
  let { mutate } = useMutations();
  let setRoom = useSetRoom();
  let rooms = db.useAttribute("room/name").sort(sortByPosition("roomList"));

  return (
    <Modal header="Are You Sure?" open={props.open} onClose={props.onClose}>
      <div className="flex flex-col gap-3">
        This will permanently delete the room and its contents.
        <ModalSubmitButton
          destructive
          content="Delete Room"
          icon={<Delete />}
          onSubmit={async () => {
            await mutate("deleteEntity", { entity: props.entityID });
            let nextRoom = rooms.filter((r) => r.entity !== props.entityID)[0];
            setRoom(nextRoom.entity);
            props.onClose();
          }}
          onClose={() => {
            props.onClose();
          }}
        />
      </div>
    </Modal>
  );
};

export const RoomListItem = (props: {
  children: React.ReactNode;
  editing: boolean;
  setEditing: (editing: boolean) => void;
  roomEntity: string;
  setRoomEditOpen?: () => void;
  isOver?: boolean;
}) => {
  let isActiveRoom = useIsActiveRoom(props.roomEntity);
  let setRoom = useSetRoom();
  let { memberEntity, authorized } = useMutations();
  let roomType = db.useEntity(props.roomEntity, "room/type");
  let isMobile = useIsMobile();
  let { setSidebar } = useSidebarState();

  let unreadCount = useSubscribe(
    async (tx) => {
      if (!memberEntity) return false;
      let unread = (
        await scanIndex(tx).eav(props.roomEntity, "discussion/unread-by")
      ).find((f) => f.value.value === memberEntity);

      if (unread) return true;
      // NB - currently collections also use 'desktop/contains'
      let cards = await scanIndex(tx).eav(props.roomEntity, "desktop/contains");
      for (let card of cards) {
        let unread = (
          await scanIndex(tx).eav(card.value.value, "card/unread-by")
        ).find((f) => f.value.value === memberEntity);

        if (unread) return true;

        let unreadDiscussion = (
          await scanIndex(tx).eav(card.value.value, "discussion/unread-by")
        ).find((f) => f.value.value === memberEntity);
        if (unreadDiscussion) return true;
      }
      return false;
    },
    false,
    [memberEntity],
    `${props.roomEntity}/unreadCount`
  );

  return (
    <div
      className={`relative select-none rounded-md border  ${
        isActiveRoom || props.isOver
          ? "rounded-md  border-accent-blue font-bold text-accent-blue"
          : " border-transparent text-grey-35 hover:border-grey-80"
      }`}
    >
      {/* buttom = name + either edit button OR room type icon */}
      <button
        style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
        className={`sidebarRoom flex w-full flex-row gap-1 py-0.5 pl-1 pr-0.5 text-left ${
          isActiveRoom ? "font-bold" : ""
        }`}
        onClick={(e) => {
          e.stopPropagation();

          if (e.detail === 2 && authorized) {
            props.setEditing(true);
            return;
          }
          setTimeout(() => {
            let roomView = document.getElementById("roomWrapper");
            if (roomView) {
              roomView.scrollIntoView({ behavior: "smooth" });
            }
          }, 10);

          // don't trigger 'onRoomChange' if room already active (may be trying to setRoomEditOpen instead)
          if (isActiveRoom) return;

          if (isMobile) {
            setSidebar(false);
          }
          setRoom(props.roomEntity);
        }}
      >
        <div
          className={` roomListItemIcon mt-[4px] h-4 w-4 shrink-0
             ${
               isActiveRoom || props.isOver
                 ? "text-accent-blue"
                 : "text-grey-55"
             }`}
        >
          {roomType?.value === "collection" ? (
            <RoomCollection />
          ) : roomType?.value === "canvas" ? (
            <RoomCanvas />
          ) : roomType?.value === "chat" ? (
            <RoomChat />
          ) : null}
        </div>
        {authorized && props.editing ? (
          <SingleTextSection
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                props.setEditing(false);
              }
            }}
            onFocus={(e) => {
              e.currentTarget.setSelectionRange(
                0,
                e.currentTarget.value.length
              );
            }}
            entityID={props.roomEntity}
            section="room/name"
            focused
            onBlur={() => props.setEditing(false)}
            className={`grow border-none bg-inherit p-0 font-normal italic text-inherit`}
          />
        ) : (
          <div className="roomListName grow">{props.children}</div>
        )}

        <PresenceDots entityID={props.roomEntity} />
        {unreadCount && (
          <div className="absolute left-0 top-1">
            <UnreadDot />
          </div>
        )}
      </button>
    </div>
  );
};

const PresenceDots = (props: { entityID: string }) => {
  let present = useSubscribe(
    async (tx) => {
      let sessions = await scanIndex(tx).vae(
        props.entityID,
        "presence/in-room"
      );
      let members = [] as Fact<"member/color">[];
      for (let presence of sessions) {
        let member = await scanIndex(tx).eav(
          presence.entity,
          "presence/client-member"
        );
        if (member && !members.find((m) => m.entity === member?.value.value)) {
          let memberColor = await scanIndex(tx).eav(
            member.value.value,
            "member/color"
          );
          if (memberColor) members.push(memberColor);
        }
      }
      return members;
    },
    [],
    [props.entityID],
    `${props.entityID}-present-in-room`
  );
  return (
    <>
      {present.length <= 6 ? (
        <div className=" my-auto flex h-max max-h-6 w-4 shrink-0 grow-0 flex-col flex-wrap-reverse items-start justify-center ">
          {present.map((color) => {
            return (
              <div
                key={color.id}
                style={{ backgroundColor: color.value }}
                className=" h-[7px] w-[7px] rounded-full border border-white"
              />
            );
          })}
        </div>
      ) : (
        <div className=" italics hrink-0 my-auto flex h-max max-h-6 w-4 grow-0 items-start justify-center overflow-visible  whitespace-nowrap text-sm font-normal text-grey-55 ">
          {present.length}
        </div>
      )}
    </>
  );
};

export const DraggableRoomListItem = (props: {
  draggable: boolean;
  entityID: string;
  factID: string;
  children: React.ReactNode;
  setRoomEditOpen: () => void;
}) => {
  let rep = useContext(ReplicacheContext);
  let roomType = db.useEntity(props.entityID, "room/type");

  let [editing, setEditing] = useState(false);
  const { attributes, listeners, setNodeRef, isOverSomethingElse } =
    useDraggableCard({
      disabled: !props.draggable || editing,
      type: "room",
      entityID: props.entityID,
      id: props.factID,
    });

  let { mutate } = useMutations();
  let { setNodeRef: droppableRef, over } = useDroppableZone({
    type: "room",
    roomType: roomType?.value,
    entityID: props.entityID,
    id: props.factID,
    onDragEnd: async (data) => {
      if (!rep) return;
      if (data.type === "card") {
        if (data.parent === props.entityID) return;
        let roomType = await rep.rep.query((tx) =>
          scanIndex(tx).eav(props.entityID, "room/type")
        );
        if (!roomType) return;
        if (roomType.value === "collection") {
          let siblings = (
            await rep.rep.query((tx) => {
              return scanIndex(tx).eav(props.entityID, "desktop/contains");
            })
          ).sort(sortByPosition("eav"));

          let newIndex = siblings.length;
          let position = generateKeyBetween(
            siblings[newIndex - 1]?.positions.eav || null,
            siblings[newIndex]?.positions.eav || null
          );

          await mutate("retractFact", { id: data.id });
          await mutate("addCardToSection", {
            factID: ulid(),
            cardEntity: data.entityID,
            parent: props.entityID,
            section: "desktop/contains",
            positions: {
              eav: position,
            },
          });
        }
        if (roomType.value === "canvas") {
          let siblingPositions = await rep.rep.query(async (tx) => {
            let siblings = await scanIndex(tx).eav(
              props.entityID,
              "desktop/contains"
            );

            return Promise.all(
              siblings.map(async (c) =>
                scanIndex(tx).eav(c.id, "card/position-in")
              )
            );
          });

          let siblingsSortedByPosition = siblingPositions.sort(
            (a, b) => (a?.value.y || 0) - (b?.value.y || 0)
          );

          let lastSiblingPosition =
            siblingsSortedByPosition[siblingsSortedByPosition.length - 1]?.value
              .y;

          await mutate("retractFact", { id: data.id });
          await mutate("addCardToDesktop", {
            factID: ulid(),
            entity: data.entityID,
            desktop: props.entityID,
            position: {
              y: lastSiblingPosition ? lastSiblingPosition + 124 : 32,
              x: 64,
              rotation: 0,
              size:
                data.position?.size === "small"
                  ? "small"
                  : data.hideContent
                  ? "small"
                  : "big",
            },
          });
        }
      }
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

  let setRoom = useSetRoom();
  useEffect(() => {
    if (roomType?.value === "chat") return;
    if (over?.type === "room" || !over) return;
    let timeout = window.setTimeout(() => {
      setRoom(props.entityID);
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [over, props.entityID, setRoom, roomType]);

  let refs = useCombinedRefs(setNodeRef, droppableRef);

  let obj = { ...listeners, ...attributes };
  return (
    <div {...obj} ref={refs} className={``}>
      {over && over.type === "room" && over.entityID !== props.entityID && (
        <div className="opacity-60">
          <RoomListPreview entityID={over.entityID} />
        </div>
      )}
      {isOverSomethingElse ? null : (
        <RoomListItem
          isOver={!!over && over.type !== "room" && roomType?.value !== "chat"}
          editing={editing}
          setEditing={setEditing}
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
  let name = db.useEntity(props.entityID, "room/name");
  return (
    <RoomListItem
      editing={false}
      setEditing={() => {}}
      roomEntity={props.entityID}
    >
      {name?.value}
    </RoomListItem>
  );
};
