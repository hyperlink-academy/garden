import { Menu } from "@headlessui/react";

import {
  MoreOptionsTiny,
  Delete,
  Member,
  CalendarMedium,
  CardAddLined,
  SectionImageAdd,
  ReactionAdd,
  CloseLinedTiny,
  GoBackToPageLined,
  LinkSmall,
  Pin,
} from "components/Icons";
import { Divider, MenuContainer, MenuItem } from "components/Layout";
import { scanIndex, db, useMutations, useSpaceID } from "hooks/useReplicache";
import * as Popover from "@radix-ui/react-popover";

import { AttachedCardSection, SingleTextSection } from "./Sections";
import { usePreserveScroll } from "hooks/utils";
import Link from "next/link";
import { useAuth } from "hooks/useAuth";
import { MakeImage, ImageSection } from "./ImageSection";
import { useEffect, useMemo, useState } from "react";
import { AddExistingCard } from "components/CardStack";
import { ButtonPrimary, ButtonTertiary } from "components/Buttons";
import { ulid } from "src/ulid";
import { AddReaction, Reactions } from "./Reactions";
import { useDroppableZone } from "components/DragContext";
import { sortByPosition } from "src/position_helpers";
import { generateKeyBetween } from "src/fractional-indexing";
import { useUndoableState } from "hooks/useUndoableState";
import { Fact } from "data/Facts";
import { getAndUploadFile } from "src/getAndUploadFile";
import { useReactions } from "hooks/useReactions";
import { CardViewDrawer } from "./CardViewDrawer";
import {
  useCloseCard,
  useRoom,
  useRoomHistory,
  useSetRoom,
  useUIState,
} from "hooks/useUIState";
import { Modal } from "components/Modal";
import { Title } from "./Title";
import { LinkPreview } from "components/LinkPreview";
import { useLinkPreviewManager } from "hooks/useLinkPreviewManager";
import { useDrag } from "@use-gesture/react";
import { useSmoker } from "components/Smoke";
import { elementID } from "src/utils";

const borderStyles = (args: { member: boolean }) => {
  switch (true) {
    //styles can be found is global.css
    case args.member:
      return `memberCardBorder`;
    default:
      return `defaultCardBorder`;
  }
};

const contentStyles = (args: { member: boolean }) => {
  switch (true) {
    case args.member:
      return `bg-white rounded-md mx-2 mt-1 mb-3 px-4 py-4`;
    default:
      return `px-3  sm:px-4`;
  }
};

export const CardView = (props: {
  entityID: string;
  space_id: string;
  onDelete?: () => void;
  referenceFactID?: string;
}) => {
  let { authToken } = useAuth();
  let spaceID = useSpaceID();
  let memberName = db.useEntity(props.entityID, "member/name");

  let { mutate, rep, memberEntity } = useMutations();
  let { setNodeRef } = useDroppableZone({
    id: props.entityID + "-cardview-dropzone",
    entityID: props.entityID,
    type: "cardView",
    onDragEnd: async (data) => {
      if (!rep) return;

      let entityID;
      switch (data.type) {
        case "room":
          return;
        case "card": {
          entityID = data.entityID;
          await mutate("retractFact", { id: data.id });
          break;
        }
        case "search-card": {
          entityID = data.entityID;
          break;
        }
        case "new-card": {
          entityID = ulid();
          break;
        }
        case "new-search-card": {
          entityID = ulid();
          break;
        }
        default: {
          data satisfies never;
        }
      }

      let siblings =
        (await rep.query((tx) => {
          return scanIndex(tx).eav(props.entityID, "deck/contains");
        })) || [];

      let lastPosition = siblings.sort(sortByPosition("eav"))[
        siblings.length - 1
      ]?.positions["eav"];
      let position = generateKeyBetween(lastPosition || null, null);
      await mutate("addCardToSection", {
        factID: ulid(),
        cardEntity: entityID as string,
        parent: props.entityID,
        section: "deck/contains",
        positions: {
          eav: position,
        },
      });
      setTimeout(() => {
        document
          .getElementById(elementID.card(props.entityID).attachedCards)
          ?.scrollIntoView({ block: "end", behavior: "smooth" });
      }, 100);
    },
  });
  let cardBackgroundColor =
    db.useEntity(props.entityID, "card/background-color")?.value || "white";

  let unreadBy = db.useEntity(props.entityID, "card/unread-by");
  let { session } = useAuth();
  useEffect(() => {
    if (memberEntity && session.user) {
      let unread = unreadBy?.find((f) => f.value.value === memberEntity);
      if (unread)
        mutate("markRead", {
          memberEntity,
          userID: session.user.id,
          space_id: props.space_id,
          entityID: props.entityID,
          attribute: "card/unread-by",
        });
    }
  }, [
    props.entityID,
    unreadBy,
    memberEntity,
    mutate,
    session.user,
    props.space_id,
  ]);

  return (
    <div className="flex h-full flex-col items-stretch">
      <div
        ref={setNodeRef}
        style={{
          backgroundColor: cardBackgroundColor,
        }}
        className={`
          card
          relative
          mx-auto
          flex h-[42px]
          w-full max-w-3xl
          grow flex-col items-stretch
          ${borderStyles({
            member: !!memberName,
          })}
            member: !!memberName,
          })}
          `}
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault();
          if (!authToken || !spaceID) return;
          let data = await getAndUploadFile(
            e.dataTransfer.items,
            authToken,
            spaceID
          );
          if (data.length === 0) return;
          e.preventDefault();
          for (let image of data) {
            if (!image.success) continue;
            await mutate("assertFact", {
              entity: props.entityID,
              factID: ulid(),
              attribute: "card/image",
              value: { type: "file", id: image.data.id, filetype: "image" },
              positions: {},
            });
          }
        }}
      >
        {/* IF MEMBER CARD, INCLUDE LINK TO STUDIO  */}
        {!memberName ? null : (
          <div className="grid shrink-0 grid-cols-[auto_max-content] items-end pb-1 pl-2 pr-3 pt-2 text-white">
            <Member />
            <Link href={`/s/${memberName?.value}`}>
              <span className="justify-self-start text-sm">visit studio</span>
            </Link>
          </div>
        )}
        <div
          className={`
            no-scrollbar flex
            h-full  grow
            flex-col
            items-stretch
            overflow-x-hidden overflow-y-hidden
            ${contentStyles({
              member: !!memberName,
            })}
            `}
        >
          <CardContent {...props} />
        </div>
      </div>
    </div>
  );
};

export const CardContent = (props: {
  entityID: string;
  onDelete?: () => void;
  referenceFactID?: string;
}) => {
  useLinkPreviewManager(props.entityID);
  let { ref } = usePreserveScroll<HTMLDivElement>(props.entityID);
  let date = db.useEntity(props.entityID, "card/date");
  let [dateEditing, setDateEditing] = useUndoableState(false);
  let memberName = db.useEntity(props.entityID, "member/name");
  let { authorized } = useMutations();
  let drawerOpen = useUIState((s) => s.cardStates[props.entityID]?.drawerOpen);
  let cardCreator = db.useEntity(props.entityID, "card/created-by");
  let drawer = useUIState((s) => s.cardStates[props.entityID]?.drawer);
  let cardCreatorName = db.useEntity(
    cardCreator?.value.value as string,
    "member/name"
  )?.value;

  return (
    <>
      {/* START CARD CONTENT */}
      <div
        ref={ref}
        className={`cardContentWrapper no-scrollbar relative z-0 flex grow flex-col items-stretch overflow-y-scroll overscroll-y-none ${
          !memberName ? "pt-3 sm:pt-4" : ""
        }`}
        onClick={() => {
          useUIState.getState().closeDrawer(props.entityID);
        }}
      >
        <div className="cardSectionAdder pointer-events-none sticky top-0 z-10 flex w-full  justify-between">
          <BackButton entityID={props.entityID} />
          {authorized && (
            <SectionAdder
              entityID={props.entityID}
              setDateEditing={() => {
                setDateEditing(true);
              }}
              dateEditing={dateEditing}
            />
          )}
          <div className="w-8"></div>
        </div>

        {/* card info (name and more options menu) */}
        {/* hide for members, who don't have a cardCreatorName */}
        {/* AND handle for legacy regular cards w/o cardCreatorName */}
        {!memberName ? (
          <div
            className={`cardInfo pointer-events-none relative z-20 -mt-[44px] mb-3 flex h-[42px] w-full shrink-0 items-center justify-end gap-3 `}
          >
            {/* NB: keep wrapper for spacing with CardMoreOptionsMenu even if no cardCreatorName */}

            <div className="flex flex-row gap-2 text-grey-55">
              <CardMoreOptionsMenu
                onDelete={props.onDelete}
                entityID={props.entityID}
                referenceFactID={props?.referenceFactID}
              />
            </div>
          </div>
        ) : null}

        {/* card content wrapper */}
        <div
          className={`cardContent z-0 flex grow flex-col gap-3 pb-10 ${
            drawerOpen ? "opacity-40" : ""
          }`}
        >
          <div className="flex flex-col gap-0">
            <Title entityID={props.entityID} />

            <ScheduledDate
              entityID={props.entityID}
              date={date}
              dateEditing={dateEditing}
              closeDateEditing={() => setDateEditing(false)}
              openDateEditing={() => setDateEditing(true)}
            />
          </div>

          <Reactions entityID={props.entityID} />

          <DefaultTextSection entityID={props.entityID} />

          <CardLinkPreview entityID={props.entityID} />

          <ImageSection entityID={props.entityID} />

          <AttachedCardSection entityID={props.entityID} />
          <div className=" h-[28px] gap-2  text-sm italic text-grey-55">
            created by {cardCreatorName}
          </div>
        </div>
      </div>
      {/* END CARD CONTENT */}

      {/* START CARD DISCUSSION */}
      <CardViewDrawer entityID={props.entityID} drawerOpen={drawerOpen} />
    </>
  );
};

const CardLinkPreview = (props: { entityID: string }) => {
  let linkPreview = db.useEntity(props.entityID, "card/link-preview");
  if (linkPreview) return <LinkPreview entityID={props.entityID} />;
  return null;
};

const BackButton = (props: { entityID: string }) => {
  let closeCard = useCloseCard();
  let room = useRoom();
  let { authorized } = useMutations();
  if (props.entityID === room) return null;
  return (
    <button
      className={`pointer-events-auto  flex h-min w-fit items-center gap-1 rounded-full border border-grey-90 bg-white p-1 text-grey-55 shadow ${
        !authorized ? "" : "mt-3"
      }`}
      onClick={() => {
        closeCard(props.entityID);
      }}
    >
      <CloseLinedTiny />
    </button>
  );
};

const CardMoreOptionsMenu = (props: {
  entityID: string;
  referenceFactID?: string;
  onDelete?: () => void;
}) => {
  let { authorized, permissions, mutate } = useMutations();
  let memberName = db.useEntity(props.entityID, "member/name");
  let [areYouSureCardDeletionModalOpen, setAreYouSureCardDeletionModalOpen] =
    useState(false);
  let smoke = useSmoker();
  if (!!memberName) return null;
  if (!authorized) {
    if (!permissions.commentAndReact) return null;
    return (
      <div className="pointer-events-auto relative flex flex-row gap-2 pt-4">
        <button
          onClick={(e) => {
            smoke({
              text: "copied link!",
              position: { x: e.clientX, y: e.clientY },
            });
            navigator.clipboard.writeText(
              `${document.location.protocol}//${document.location.host}${document.location.pathname}?openCard=${props.entityID}`
            );
          }}
        >
          <LinkSmall />
        </button>
        <ReactionPicker entityID={props.entityID} />
      </div>
    );
  }

  return (
    <Menu as="div" className="pointer-events-auto relative">
      <Menu.Button className={` pt-[6px]`}>
        <MoreOptionsTiny />
      </Menu.Button>
      <MenuContainer>
        <MenuItem
          onClick={(e) => {
            smoke({
              text: "copied link!",
              position: { x: e.clientX, y: e.clientY },
            });
            navigator.clipboard.writeText(
              `${document.location.protocol}//${document.location.host}${document.location.pathname}?openCard=${props.entityID}`
            );
          }}
        >
          <div>Copy Link</div>
          <LinkSmall />
        </MenuItem>
        <PinCardMenuItem entityID={props.entityID} />
        <MenuItem>
          <CardBackgroundColorPicker entityID={props.entityID} />
        </MenuItem>

        <Divider my={8} />
        <MenuItem
          onClick={() => {
            setAreYouSureCardDeletionModalOpen(true);
          }}
        >
          <p className="font-bold text-accent-red">Delete Card</p>
          <div className="text-accent-red">
            <Delete />
          </div>
        </MenuItem>
      </MenuContainer>
      <AreYouSureCardDeletionModal
        open={areYouSureCardDeletionModalOpen}
        onClose={() => setAreYouSureCardDeletionModalOpen(false)}
        onDelete={props.onDelete}
        entityID={props.entityID}
      />
    </Menu>
  );
};

const PinCardMenuItem = (props: { entityID: string }) => {
  let { mutate, rep } = useMutations();
  let isRoom = db.useEntity(props.entityID, "room/name");
  let roomType = db.useEntity(props.entityID, "room/type");
  let setRoom = useSetRoom();
  if (isRoom)
    return (
      <MenuItem
        onClick={async () => {
          let rooms = (
            (await rep?.query((tx) => scanIndex(tx).aev("room/name"))) || []
          ).sort(sortByPosition("roomList"));
          let index = rooms.findIndex((r) => r.entity === props.entityID);
          setRoom(rooms[index < 1 ? 1 : index - 1].entity);
          if (isRoom) mutate("retractFact", { id: isRoom.id });
          if (roomType) mutate("retractFact", { id: roomType.id });
        }}
      >
        Unpin from Sidebar <Pin />
      </MenuItem>
    );
  return (
    <MenuItem
      onClick={() => {
        mutate("createRoom", {
          entity: props.entityID,
          type: "card",
          name: "",
        });
      }}
    >
      Pin to Sidebar <Pin />
    </MenuItem>
  );
};

const AreYouSureCardDeletionModal = (props: {
  open: boolean;
  onClose: () => void;
  onDelete?: () => void;
  entityID: string;
}) => {
  let { mutate, action, rep } = useMutations();
  let setRoom = useSetRoom();
  return (
    <Modal open={props.open} onClose={props.onClose}>
      <div className="flex flex-col gap-3 text-grey-35">
        <div className="modal flex flex-col gap-3">
          <h4>Are you sure?</h4>
          <p className="text-sm">
            This will permanently delete the card and its contents.
          </p>
          <div className="flex justify-end gap-4">
            <ButtonTertiary
              content="Cancel"
              onClick={() => {
                props.onClose();
              }}
            >
              Cancel
            </ButtonTertiary>
            <ButtonPrimary
              content="Delete Card"
              icon={<Delete />}
              destructive={true}
              onClick={async () => {
                action.start();
                let rooms = (
                  (await rep?.query((tx) => scanIndex(tx).aev("room/name"))) ||
                  []
                ).sort(sortByPosition("roomList"));
                let index = rooms.findIndex((r) => r.entity === props.entityID);
                if (index !== -1)
                  setRoom(rooms[index < 1 ? 1 : index - 1].entity);
                await mutate("deleteEntity", { entity: props.entityID });
                props.onDelete?.();

                action.end();
              }}
            >
              Delete
            </ButtonPrimary>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const CardBackgroundColors = [
  "#FFFFFF", //white
  "#FFEEF2", //red
  "#fff2e7", //orange
  "#FFFAE7", //yellow
  "#F4FFE7", //green
  "#ECF8FF", //blue
  "#f4eeff", //purple
];

const CardBackgroundColorPicker = (props: { entityID: string }) => {
  let cardBackgroundColor =
    db.useEntity(props.entityID, "card/background-color")?.value || "#FFFFFF";
  let { mutate } = useMutations();
  let setCardBackgroudColor = async (color: string) => {
    await mutate("assertFact", {
      entity: props.entityID,
      attribute: "card/background-color",
      value: color,
      positions: {},
    });
  };

  return (
    <div className="flex flex-col gap-1 font-bold">
      Set Card Color
      <div className="flex gap-1">
        {CardBackgroundColors.map((color) => {
          return (
            <button
              key={color}
              className={`h-5 w-5 rounded-full border hover:cursor-pointer
               ${
                 cardBackgroundColor === color
                   ? "border-2 border-grey-55"
                   : "border-1 border-grey-80 hover:border-2"
               }`}
              style={{ backgroundColor: color }}
              onClick={() => {
                setCardBackgroudColor(color);
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

const ScheduledDate = (props: {
  entityID: string;
  date: Fact<"card/date"> | null;
  dateEditing: boolean;
  closeDateEditing: () => void;
  openDateEditing: () => void;
}) => {
  let { mutate, authorized } = useMutations();

  let [dateInputValue, setDateInputValue] = useState("");
  useEffect(() => {
    setDateInputValue(props.date?.value.value || "");
  }, [props.date]);

  let date = useMemo(() => {
    if (!props.date) return null;
    try {
      let dateParts = Intl.DateTimeFormat("en", {
        timeZone: "UTC",
        month: "short",
        year: "numeric",
        day: "numeric",
      }).formatToParts(new Date(props.date.value.value));
      let month = dateParts.find((f) => f.type === "month")?.value;
      let day = dateParts.find((f) => f.type === "day")?.value;
      let year = dateParts.find((f) => f.type === "year")?.value;
      return { month, day, year };
    } catch (e) {
      return null;
    }
  }, [props.date]);

  if (!props.dateEditing && !date) return null;

  return (
    <div className="flex place-items-center gap-2 text-sm italic text-grey-55">
      {props.dateEditing ? (
        <>
          <input
            className="border-grey-80 px-1 py-[2px] text-grey-55"
            onBlur={() => props.closeDateEditing()}
            onChange={(e) => {
              setDateInputValue(e.currentTarget.value);
              mutate("assertFact", {
                factID: ulid(),
                entity: props.entityID,
                attribute: "card/date",
                value: {
                  type: "yyyy-mm-dd",
                  value: e.currentTarget.value,
                },
                positions: {},
              });
            }}
            value={dateInputValue}
            type="date"
          />

          <button
            className="justify-self-center text-sm text-grey-55 hover:text-accent-blue"
            onClick={() => {
              if (props.date) {
                mutate("retractFact", { id: props.date.id });
                setDateInputValue("");
                props.closeDateEditing();
              } else {
                props.closeDateEditing();
              }
            }}
          >
            remove
          </button>
        </>
      ) : date ? (
        authorized ? (
          <button
            className="-ml-[5px] border border-transparent px-1 py-[3px] text-sm italic text-grey-55 underline hover:text-accent-blue"
            onClick={() => {
              props.openDateEditing();
            }}
          >
            {date.month} {date.day}, {date.year}
          </button>
        ) : (
          <div className="-ml-[4px] px-1 py-1 text-sm text-grey-55">
            {date.month} {date.day}, {date.year}
          </div>
        )
      ) : null}
    </div>
  );
};

const DefaultTextSection = (props: { entityID: string }) => {
  let { authToken } = useAuth();
  let { authorized, mutate } = useMutations();
  let spaceID = useSpaceID();

  let cardBackgroundColor =
    db.useEntity(props.entityID, "card/background-color")?.value || "white";

  return (
    <SingleTextSection
      autocompleteCardNames
      id={elementID.card(props.entityID).content}
      style={{
        backgroundColor: cardBackgroundColor,
      }}
      onPaste={async (e) => {
        if (!authToken || !spaceID) return;
        let data = await getAndUploadFile(
          e.clipboardData.items,
          authToken,
          spaceID
        );
        if (data.length === 0) return;
        e.preventDefault();

        for (let image of data) {
          if (!image.success) continue;
          await mutate("assertFact", {
            entity: props.entityID,
            attribute: "card/image",
            value: { type: "file", id: image.data.id, filetype: "image" },
            positions: {},
          });
        }
      }}
      entityID={props.entityID}
      section={"card/content"}
      placeholder={authorized ? "write something…" : ""}
    />
  );
};

let toggledOffStyle =
  "rounded-md border p-0.5 hover:border-accent-blue hover:text-accent-blue border-transparent";
let toggledOnStyle =
  "rounded-md border p-0.5 hover:border-accent-blue hover:text-accent-blue border-grey-90 bg-bg-blue text-grey-80";

export const SectionAdder = (props: {
  entityID: string;
  dateEditing: boolean;
  setDateEditing: () => void;
}) => {
  let { authorized } = useMutations();
  let date = db.useEntity(props.entityID, "card/date");

  if (!authorized) return null;
  return (
    <div className="pointer-events-auto flex w-fit items-center gap-1 rounded-full border border-grey-90 bg-white px-4 py-2 text-grey-55 shadow">
      {/* IMAGE ADDER */}
      <MakeImage entity={props.entityID}>
        <div className={`${toggledOffStyle} `}>
          <SectionImageAdd />
        </div>
      </MakeImage>
      {/* END ADDER */}
      {/* LINKED CARD ADDER */}
      <AddExistingCard
        parentID={props.entityID}
        attribute="deck/contains"
        positionKey="eav"
        addToEnd
        onAdd={() => {
          setTimeout(() => {
            document
              .getElementById(elementID.card(props.entityID).attachedCards)
              ?.scrollIntoView({ block: "end", behavior: "smooth" });
          }, 100);
        }}
      >
        <div className={`${toggledOffStyle} `}>
          <CardAddLined />
        </div>
      </AddExistingCard>
      {/* END LINKED CARD ADDER */}
      {/* DATE ADDER */}
      <button
        className={`${
          date || props.dateEditing ? toggledOnStyle : toggledOffStyle
        } `}
        onClick={() => {
          if (date) {
            document
              .getElementById(elementID.card(props.entityID).container)
              ?.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            props.setDateEditing();
            document
              .getElementById(elementID.card(props.entityID).container)
              ?.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
      >
        <CalendarMedium />
      </button>
      {/* END DATE ADDER */}
      <div className="h-full w-[2px] px-2">
        <Divider vertical />
      </div>
      <ReactionPicker entityID={props.entityID} />
    </div>
  );
};

const ReactionPicker = (props: { entityID: string }) => {
  let [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  return (
    <Popover.Root
      onOpenChange={() => setReactionPickerOpen(!reactionPickerOpen)}
    >
      <Popover.Trigger className="flex items-center" asChild>
        <button
          className={`${toggledOffStyle} ${
            !reactionPickerOpen
              ? ""
              : "rounded-md border border-accent-blue p-0.5 text-accent-blue"
          }`}
        >
          <ReactionAdd />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={16}
          collisionPadding={{ right: 20 }}
          className="-mt-[1px] max-w-[298px]"
        >
          <AddReaction
            entityID={props.entityID}
            onSelect={() =>
              document
                .getElementById(elementID.card(props.entityID).reactions)
                ?.scrollIntoView({ block: "center", behavior: "smooth" })
            }
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
