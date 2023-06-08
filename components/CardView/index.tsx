import { Menu } from "@headlessui/react";

import {
  MoreOptionsTiny,
  Delete,
  Member,
  CalendarMedium,
  CardAdd,
  ReactionAdd,
  TitleAdd,
} from "components/Icons";
import { Divider, MenuContainer, MenuItem, Modal } from "components/Layout";
import {
  scanIndex,
  useIndex,
  useMutations,
  useSpaceID,
} from "hooks/useReplicache";

import { AttachedCardSection, SingleTextSection } from "./Sections";
import { Backlinks } from "./Backlinks";
import { usePreserveScroll } from "hooks/utils";
import Link from "next/link";
import { useAuth } from "hooks/useAuth";
import { MakeImage, ImageSection } from "./ImageSection";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { AddExistingCard } from "components/CardStack";
import { ButtonPrimary, ButtonTertiary } from "components/Buttons";
import { Discussion } from "./Discussion";
import { ulid } from "src/ulid";
import { AddReaction, Reactions } from "./Reactions";
import { useDroppableZone } from "components/DragContext";
import { sortByPosition } from "src/position_helpers";
import { generateKeyBetween } from "src/fractional-indexing";
import { useUndoableState } from "hooks/useUndoableState";
import { Fact } from "data/Facts";
import { getAndUploadFile } from "src/getAndUploadFile";
import { useReactions } from "hooks/useReactions";

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
      return `px-2 py-2 sm:px-4 sm:py-4`;
  }
};

export const CardView = (props: {
  entityID: string;
  onDelete?: () => void;
  referenceFactID?: string;
}) => {
  let { authToken } = useAuth();
  let spaceID = useSpaceID();
  let memberName = useIndex.eav(props.entityID, "member/name");
  let { ref } = usePreserveScroll<HTMLDivElement>(props.entityID);

  let { mutate, rep } = useMutations();
  let { setNodeRef } = useDroppableZone({
    id: props.referenceFactID + "-dropzone",
    entityID: props.entityID,
    type: "linkCard",
    onDragEnd: async (data) => {
      if (!rep) return;
      mutate("retractFact", { id: data.id });

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
        cardEntity: data.entityID,
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
      <Backlinks entityID={props.entityID} />
      <div
        ref={setNodeRef}
        className={`
      card
      no-scrollbar
      relative
      mx-auto       
      flex
      h-full w-full
      max-w-3xl grow
      flex-col items-stretch overflow-y-scroll
      ${borderStyles({
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
          <div className="grid shrink-0 grid-cols-[auto_max-content] items-end px-2 pt-2 pb-1 text-white">
            <Member />
            <Link href={`/s/${memberName?.value}`}>
              <small className="justify-self-start">visit studio</small>
            </Link>
          </div>
        )}
        <div
          ref={ref}
          id="cardContentAndDiscussion"
          className={`
            no-scrollbar flex h-full          
            grow
            flex-col
            gap-4
            overflow-scroll
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
  let cardCreator = useIndex.eav(props.entityID, "card/created-by");
  // returns reference…
  let cardCreatorName = useIndex.eav(
    cardCreator?.value.value as string,
    "member/name"
  )?.value;
  let date = useIndex.eav(props.entityID, "card/date");
  let [dateEditing, setDateEditing] = useUndoableState(false);

  return (
    <>
      {/* START CARD CONTENT */}
      <div className="cardContent grid-auto-rows  grid gap-3 ">
        <div className="cardSectionAdder absolute top-4 z-10">
          <SectionAdder
            entityID={props.entityID}
            setDateEditing={() => {
              setDateEditing(true);
            }}
          />
        </div>
        <div className="cardInfo mr-0 ml-auto mb-2 flex h-[42px] shrink-0 items-center gap-3">
          {cardCreatorName ? (
            <div className="text-sm text-grey-55">by {cardCreatorName}</div>
          ) : null}
          <CardMoreOptionsMenu
            onDelete={props.onDelete}
            entityID={props.entityID}
            referenceFactID={props?.referenceFactID}
          />
        </div>
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
        <DefaultTextSection entityID={props.entityID} />

        {/* show the image and attached cards if any */}
        <ImageSection entityID={props.entityID} />
        <AttachedCardSection entityID={props.entityID} />

        {/* this handles the triggers to add cards, image, and date! */}
      </div>
      {/* END CARD CONTENT */}
      {/* <Divider /> */}
      {/* START CARD DISCUSSION + REACTIONS */}
      <div
        className="flex flex-1 flex-col justify-end gap-4"
        onClick={(e) => {
          console.log(e.currentTarget);
          console.log(e.target);
          if (e.target !== e.currentTarget) return;
          let element = document.getElementById("default-text-section");
          element?.focus();
        }}
      >
        <Reactions entityID={props.entityID} />
        <Discussion entityID={props.entityID} allowReact isRoom={false} />
      </div>
    </>
  );
};

const Title = (props: { entityID: string }) => {
  let { authorized } = useMutations();
  let memberName = useIndex.eav(props.entityID, "member/name");
  let cardTitle = useIndex.eav(props.entityID, "card/title");
  let titleFact = memberName || cardTitle;
  return (
    (memberName || titleFact) && (
      <SingleTextSection
        id="card-title"
        className="bg-inherit text-xl font-bold"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            let className = `${props.entityID}-default-text-section}`;
            let element = document.getElementById(className);
            element?.focus();
          }
        }}
        entityID={props.entityID}
        section={titleFact?.attribute || "card/title"}
        previewOnly={titleFact?.attribute === "member/name"}
        placeholder={authorized ? "write something..." : "Untitled"}
      />
    )
  );
};

const CardMoreOptionsMenu = (props: {
  entityID: string;
  referenceFactID?: string;
  onDelete?: () => void;
}) => {
  let { authorized, mutate, action } = useMutations();
  let memberName = useIndex.eav(props.entityID, "member/name");
  let [areYouSureCardDeletionModalOpen, setAreYouSureCardDeletionModalOpen] =
    useState(false);

  let { query: q } = useRouter();

  return !authorized || !!memberName ? null : (
    <Menu as="div" className="relative">
      <Menu.Button className={`pt-[6px]`}>
        <MoreOptionsTiny />
      </Menu.Button>
      <MenuContainer>
        <div className="py-2">
          <Divider />
        </div>{" "}
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
  }, [props.date]);

  if (!props.dateEditing && !date) return null;

  return (
    <div className="flex place-items-center gap-2  text-sm font-bold text-grey-55">
      Scheduled for{" "}
      {props.dateEditing ? (
        <>
          <input
            className="-ml-1 border-grey-80 py-[2px] px-1 font-bold text-grey-55 "
            onBlur={() => {
              props.closeDateEditing();
            }}
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
              props.closeDateEditing();
            }}
            value={dateInputValue}
            type="date"
          />

          <div className="h-6 w-[2px] border-l border-grey-55" />

          <button
            className=" justify-self-center text-sm text-grey-55 hover:text-accent-blue"
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
            className="-ml-[5px] border border-transparent py-[3px] px-1 text-sm font-bold text-grey-55 hover:underline"
            onClick={() => {
              props.openDateEditing();
            }}
          >
            {date.month} {date.day}, {date.year}
          </button>
        ) : (
          <div className="-ml-[4px] py-1 px-1 text-sm text-grey-55">
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
  setDateEditing: () => void;
}) => {
  let { authorized, mutate } = useMutations();
  let [open, setOpen] = useState(false);
  let attachedCards = useIndex.eav(props.entityID, "deck/contains");
  let reactions = useReactions(props.entityID);
  let memberName = useIndex.eav(props.entityID, "member/name");
  let cardTitle = useIndex.eav(props.entityID, "card/title");
  let date = useIndex.eav(props.entityID, "card/date");

  if (!authorized) return null;
  return (
    <div className="lightBorder flex w-fit gap-2  bg-white p-2 text-grey-55">
      <button
        className="inline-block w-max cursor-pointer text-grey-55 hover:text-accent-blue"
        onClick={async () => {
          if (memberName) return;
          if (cardTitle) {
            await mutate("updateTitleFact", {
              attribute: "card/title",
              entity: props.entityID,
              value: "",
            });
            await mutate("retractFact", cardTitle);
          } else {
            await mutate("updateTitleFact", {
              attribute: "card/title",
              entity: props.entityID,
              value: "",
            });
          }
        }}
      >
        <TitleAdd />
      </button>
      <MakeImage entity={props.entityID} />
      {attachedCards && attachedCards.length !== 0 ? null : (
        <AddExistingCard
          parentID={props.entityID}
          attribute="deck/contains"
          positionKey="eav"
        >
          <div className="hover:text-accent-blue">
            <CardAdd />
          </div>
        </AddExistingCard>
      )}
      <button
        onClick={() => {
          if (date !== null) {
            mutate("retractFact", { id: date.id });
          } else {
            props.setDateEditing();
          }
        }}
      >
        <CalendarMedium />
      </button>
    </div>
  );
};
