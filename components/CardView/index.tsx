import { Menu } from "@headlessui/react";

import {
  MoreOptionsTiny,
  Delete,
  Member,
  CalendarMedium,
  CardSmallLined,
  SectionImageAdd,
  ReactionAdd,
  CloseLinedTiny,
  GoBackToPageLined,
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
import { HighlightCard } from "./HighlightCard";
import { CardViewDrawer } from "./CardViewDrawer";
import { useCloseCard, useRoomHistory, useUIState } from "hooks/useUIState";
import { Modal } from "components/Modal";
import { Title } from "./Title";

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
  onDelete?: () => void;
  referenceFactID?: string;
}) => {
  let { authToken } = useAuth();
  let spaceID = useSpaceID();
  let memberName = db.useEntity(props.entityID, "member/name");

  let { mutate, rep } = useMutations();
  let { setNodeRef } = useDroppableZone({
    id: props.referenceFactID + "-dropzone",
    entityID: props.entityID,
    type: "linkCard",
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

      let firstPosition = siblings.sort(sortByPosition("eav"))[0]?.positions[
        "eav"
      ];
      let position = generateKeyBetween(null, firstPosition || null);
      await mutate("addCardToSection", {
        factID: ulid(),
        cardEntity: entityID,
        parent: props.entityID,
        section: "deck/contains",
        positions: {
          eav: position,
        },
      });
    },
  });

  return (
    <div className="flex h-full flex-col items-stretch">
      <div
        ref={setNodeRef}
        className={`
          card
          relative
          mx-auto       
          flex
          h-[42px] w-full
          max-w-3xl grow
          flex-col items-stretch
          ${borderStyles({
            member: !!memberName,
          })}
            member: !!memberName,
          })}
          `}
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          if (!authToken || !spaceID) return;
          let data = await getAndUploadFile(
            e.dataTransfer.items,
            authToken,
            spaceID
          );
          if (!data.success) return;

          await mutate("assertFact", {
            entity: props.entityID,
            factID: ulid(),
            attribute: "card/image",
            value: { type: "file", id: data.data.id, filetype: "image" },
            positions: {},
          });
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
          id="card-container"
          className={`
            no-scrollbar flex 
            h-full  grow   
            flex-col       
            items-stretch
            overflow-x-hidden overflow-y-hidden
            pb-0
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
  let { ref } = usePreserveScroll<HTMLDivElement>(props.entityID);
  let date = db.useEntity(props.entityID, "card/date");
  let [dateEditing, setDateEditing] = useUndoableState(false);
  let memberName = db.useEntity(props.entityID, "member/name");
  let { authorized } = useMutations();
  let drawerOpen = useUIState((s) => s.cardStates[props.entityID]?.drawerOpen);
  let cardCreator = db.useEntity(props.entityID, "card/created-by");
  let cardCreatorName = db.useEntity(
    cardCreator?.value.value as string,
    "member/name"
  )?.value;

  return (
    <>
      {/* START CARD CONTENT */}
      <div
        ref={ref}
        className={`cardContentWrapper no-scrollbar relative z-0 flex grow flex-col items-stretch overflow-y-scroll overscroll-y-auto pb-3 sm:pb-4 ${
          !memberName ? "pt-3 sm:pt-4" : ""
        }`}
        onClick={() => {
          useUIState.getState().closeDrawer(props.entityID);
        }}
      >
        <div className="cardSectionAdder pointer-events-none sticky top-0 z-10 flex w-full  justify-between">
          <BackButton />
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
              <HighlightCard entityID={props.entityID} />
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

const BackButton = () => {
  let history = useRoomHistory();
  let closeCard = useCloseCard();
  let { authorized } = useMutations();
  return (
    <button
      className={`pointer-events-auto  flex h-min w-fit items-center gap-1 rounded-full border border-grey-90 bg-white p-1 text-grey-55 shadow ${
        !authorized ? "" : "mt-3"
      }`}
      onClick={() => {
        if (history.length < 2) {
          setTimeout(() => {
            let roomView = document.getElementById("roomWrapper");
            if (roomView) {
              roomView.scrollIntoView({ behavior: "smooth" });
            }
          }, 5);
        }
        closeCard();
      }}
    >
      {history.length < 2 ? <CloseLinedTiny /> : <GoBackToPageLined />}
    </button>
  );
};

const CardMoreOptionsMenu = (props: {
  entityID: string;
  referenceFactID?: string;
  onDelete?: () => void;
}) => {
  let { authorized } = useMutations();
  let memberName = db.useEntity(props.entityID, "member/name");
  let [areYouSureCardDeletionModalOpen, setAreYouSureCardDeletionModalOpen] =
    useState(false);
  if (!!memberName) return null;
  if (!authorized) return null;

  return (
    <Menu as="div" className="pointer-events-auto relative">
      <Menu.Button className={` pt-[6px]`}>
        <MoreOptionsTiny />
      </Menu.Button>
      <MenuContainer>
        {authorized && (
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
        )}
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

const AreYouSureCardDeletionModal = (props: {
  open: boolean;
  onClose: () => void;
  onDelete?: () => void;
  entityID: string;
}) => {
  let { mutate, action } = useMutations();
  return (
    <Modal open={props.open} onClose={props.onClose}>
      <div className="flex flex-col gap-3 text-grey-35">
        <div className="modal flex flex-col gap-3">
          <p className="text-lg font-bold">Are you sure?</p>
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
    <div
      id="card-date"
      className="flex place-items-center gap-2 text-sm italic text-grey-55"
    >
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
  return (
    <SingleTextSection
      autocompleteCardNames
      id="default-text-section"
      onPaste={async (e) => {
        if (!authToken || !spaceID) return;
        let data = await getAndUploadFile(
          e.clipboardData.items,
          authToken,
          spaceID
        );
        if (!data.success) return;
        await mutate("assertFact", {
          entity: props.entityID,
          attribute: "card/image",
          value: { type: "file", id: data.data.id, filetype: "image" },
          positions: {},
        });
      }}
      entityID={props.entityID}
      section={"card/content"}
      placeholder={authorized ? "write something..." : ""}
    />
  );
};

export const SectionAdder = (props: {
  entityID: string;
  dateEditing: boolean;

  setDateEditing: () => void;
}) => {
  let { authorized, mutate } = useMutations();
  let image = db.useEntity(props.entityID, "card/image");
  let attachedCards = db.useEntity(props.entityID, "deck/contains");
  let date = db.useEntity(props.entityID, "card/date");
  let reactions = useReactions(props.entityID);

  let [reactionPickerOpen, setReactionPickerOpen] = useState(false);

  let toggledOffStyle =
    "rounded-md border p-0.5 hover:border-accent-blue hover:text-accent-blue border-transparent";
  let toggledOnStyle =
    "rounded-md border p-0.5 hover:border-accent-blue hover:text-accent-blue border-grey-90 bg-bg-blue text-grey-80";

  if (!authorized) return null;
  return (
    <div className="pointer-events-auto flex w-fit items-center gap-1 rounded-full border border-grey-90 bg-white px-4 py-2 text-grey-55 shadow">
      {/* IMAGE ADDER */}
      <MakeImage entity={props.entityID}>
        <div className={`${image ? toggledOnStyle : toggledOffStyle} `}>
          <SectionImageAdd />
        </div>
      </MakeImage>
      {/* END ADDER */}
      {/* LINKED CARD ADDER */}
      {attachedCards && attachedCards.length !== 0 ? (
        <button
          className={`${toggledOnStyle}`}
          onClick={() => {
            document
              .getElementById("card-attached-cards")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <CardSmallLined />
        </button>
      ) : (
        <AddExistingCard
          parentID={props.entityID}
          attribute="deck/contains"
          positionKey="eav"
          onAdd={() => {
            setTimeout(
              () =>
                document
                  .getElementById("card-attached-cards")
                  ?.scrollIntoView({ behavior: "smooth" }),
              50
            );
          }}
        >
          <div className={`${toggledOffStyle} `}>
            <CardSmallLined />
          </div>
        </AddExistingCard>
      )}
      {/* END LINKED CARD ADDER */}
      {/* DATE ADDER */}
      <button
        className={`${
          date || props.dateEditing ? toggledOnStyle : toggledOffStyle
        } `}
        onClick={() => {
          if (date) {
            document
              .getElementById("card-container")
              ?.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            props.setDateEditing();
            document
              .getElementById("card-container")
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
      <Popover.Root
        onOpenChange={() => setReactionPickerOpen(!reactionPickerOpen)}
      >
        <Popover.Trigger className="flex items-center">
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
                  .getElementById("card-reactions")
                  ?.scrollIntoView({ block: "center", behavior: "smooth" })
              }
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};
