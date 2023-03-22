import { Menu } from "@headlessui/react";

import {
  MoreOptionsTiny,
  Delete,
  Member,
  CalendarMedium,
  CardAdd,
  Send,
} from "components/Icons";
import { Divider, MenuContainer, MenuItem } from "components/Layout";
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
import { AddAttachedCard } from "components/CardStack";
import { ButtonPrimary } from "components/Buttons";
import { Discussion } from "./Discussion";
import { ulid } from "src/ulid";
import { animated, useSpring } from "@react-spring/web";
import { RenderedText } from "components/Textarea/RenderedText";
import { Reactions } from "./Reactions";
import { useDroppableZone } from "components/DragContext";
import { sortByPosition } from "src/position_helpers";
import { generateKeyBetween } from "src/fractional-indexing";
import { useUndoableState } from "hooks/useUndoableState";
import { Fact } from "data/Facts";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
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
      return `bg-white rounded-md ml-2 mr-2 mb-2 mt-0 px-3 pt-3 pb-6`;
    default:
      return `px-3 py-4 sm:px-4 sm:py-6`;
  }
};

export const CardView = (props: {
  entityID: string;
  onDelete?: () => void;
  referenceFactID?: string;
}) => {
  let [cardState, setCardState] = useState<null | string>(null);
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
          className={`
            cardContentAndDiscussion
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
          {cardState === null ? (
            <CardContent open={(id) => setCardState(id)} {...props} />
          ) : (
            <Discussion entityID={cardState} close={() => setCardState(null)} />
          )}
        </div>
      </div>
    </div>
  );
};

export const CardContent = (props: {
  entityID: string;
  onDelete?: () => void;
  referenceFactID?: string;
  open: (k: string) => void;
}) => {
  let cardCreator = useIndex.eav(props.entityID, "card/created-by");
  // returns reference…
  let cardCreatorName = useIndex.eav(
    cardCreator?.value.value as string,
    "member/name"
  )?.value;
  let [dateEditing, setDateEditing] = useUndoableState(false);

  let { session } = useAuth();
  let { mutate, authorized } = useMutations();

  let date = useIndex.eav(props.entityID, "card/date");

  return (
    <>
      {/* START CARD CONTENT */}
      <div className="cardContent grid-auto-rows grid gap-3">
        <div className="cardHeader flex flex-col gap-0">
          <div className="cardTitle grid grid-cols-[auto_max-content_max-content] gap-2">
            <Title entityID={props.entityID} />
            {cardCreatorName ? (
              <div className="lightBorder self-start rounded-md py-1 px-2 text-sm text-grey-35">
                {cardCreatorName}
              </div>
            ) : null}
            <div className="">
              <CardMoreOptionsMenu
                onDelete={props.onDelete}
                entityID={props.entityID}
                referenceFactID={props?.referenceFactID}
                setDateEditing={() => {
                  setDateEditing(true);
                }}
                date={date}
              />
            </div>
          </div>

          <ScheduledDate
            entityID={props.entityID}
            date={date}
            dateEditing={dateEditing}
            closeDateEditing={() => setDateEditing(false)}
            openDateEditing={() => setDateEditing(true)}
          />

          {/* <DateSection entityID={props.entityID} /> */}
        </div>

        <DefaultTextSection entityID={props.entityID} />

        {/* show the image and attached cards if any */}
        <ImageSection entityID={props.entityID} />
        <AttachedCardSection entityID={props.entityID} />

        {/* this handles the triggers to add cards, image, and date! */}
        <SectionAdder entityID={props.entityID} />
      </div>
      {/* END CARD CONTENT */}
      <Divider />
      {/* START CARD THOUGHTS */}
      <div className="cardThoughts flex w-full flex-col gap-2">
        <Reactions entityID={props.entityID} />
        <StartDiscussion entityID={props.entityID} />
      </div>
      <Discussions entityID={props.entityID} open={props.open} />
    </>
  );
};

const Discussions = (props: {
  entityID: string;
  open: (id: string) => void;
}) => {
  let discussions = useIndex.eav(props.entityID, "card/discussion") || [];
  return (
    <>
      {discussions.map((f) => (
        <Thought
          key={f.id}
          entityID={f.value.value}
          open={() => props.open(f.value.value)}
        />
      ))}
    </>
  );
};

const StartDiscussion = (props: { entityID: string }) => {
  let { mutate, memberEntity, authorized } = useMutations();
  let [thoughtInputFocus, setThoughtInputFocus] = useState(false);
  let [value, setValue] = useState("");
  let { height } = useSpring({ height: thoughtInputFocus || value ? 128 : 40 });
  if (!authorized || !memberEntity) return null;

  const send = async () => {
    if (!memberEntity) return;
    let discussionEntity = ulid();
    await mutate("createDiscussion", {
      cardEntity: props.entityID,
      discussionEntity,
      memberEntity,
      date: new Date().toISOString(),
      content: value,
    });
    setValue("");
  };
  return (
    <>
      <animated.textarea
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        placeholder="add a comment..."
        onFocus={() => setThoughtInputFocus(true)}
        onBlur={() => setThoughtInputFocus(false)}
        style={{ height }}
        className={`w-full resize-none overflow-hidden border-grey-80`}
        id="thoughtInput"
        onKeyDown={(e) => {
          if (
            (e.key === "Enter" && e.ctrlKey) ||
            (e.key === "Enter" && e.metaKey)
          )
            send();
        }}
      />
      {!thoughtInputFocus && !value ? null : (
        <div className="flex items-center justify-between text-grey-55 ">
          <div className="hover:text-accent-blue"></div>
          <ButtonPrimary
            disabled={!value}
            icon={<Send />}
            onClick={() => send()}
          />
        </div>
      )}
    </>
  );
};

const Title = (props: { entityID: string }) => {
  let memberName = useIndex.eav(props.entityID, "member/name");
  let cardTitle = useIndex.eav(props.entityID, "card/title");
  let titleFact = memberName || cardTitle;
  return (
    <SingleTextSection
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          let className = `${props.entityID}-default-text-section}`;
          let element = document.getElementById(className);
          element?.focus();
        }
      }}
      previewOnly={titleFact?.attribute === "member/name"}
      entityID={props.entityID}
      className="bg-inherit text-xl font-bold"
      section={titleFact?.attribute || "card/title"}
    />
  );
};

const CardMoreOptionsMenu = (props: {
  entityID: string;
  referenceFactID?: string;
  onDelete?: () => void;
  setDateEditing: () => void;
  date: Fact<"card/date"> | null;
}) => {
  let { authorized, mutate, action } = useMutations();
  let memberName = useIndex.eav(props.entityID, "member/name");

  let { query: q } = useRouter();

  return !authorized || !!memberName ? null : (
    <Menu as="div" className="relative">
      <Menu.Button className={`pt-[6px]`}>
        <MoreOptionsTiny />
      </Menu.Button>
      <MenuContainer>
        <MenuItem
          onClick={() => {
            if (props.date !== null) {
              mutate("retractFact", { id: props.date.id });
            } else {
              props.setDateEditing();
            }
          }}
        >
          {props.date ? <p>Remove Schedule</p> : <p>Schedule Card</p>}
          <CalendarMedium />
        </MenuItem>
        <div className="py-2">
          <Divider />
        </div>{" "}
        <MenuItem
          onClick={async () => {
            action.start();

            await mutate("deleteEntity", { entity: props.entityID });
            props.onDelete?.();

            action.end();
          }}
        >
          <p className="font-bold text-accent-red">Delete FOREVER</p>
          <div className="text-accent-red">
            <Delete />
          </div>
        </MenuItem>
      </MenuContainer>
    </Menu>
  );
};

const ScheduledDate = (props: {
  entityID: string;
  date: Fact<"card/date"> | null;
  dateEditing: boolean;
  closeDateEditing: () => void;
  openDateEditing: () => void;
}) => {
  let { session } = useAuth();
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

  return (
    <div className="flex place-items-center gap-2  text-sm text-grey-55">
      {props.dateEditing ? (
        <>
          <input
            className="-ml-1 border-grey-80 py-[2px] px-1 text-grey-55 "
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
              if (!session.token) return;
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
      ) : (
        date && (
          <button
            className="-ml-[6px] border border-transparent py-[3px] px-1 text-sm text-grey-55 hover:underline"
            onClick={() => {
              props.openDateEditing();
            }}
          >
            {date.month} {date.day}, {date.year}
          </button>
        )
      )}
    </div>
  );
};

const DefaultTextSection = (props: { entityID: string }) => {
  let { session } = useAuth();
  let { mutate } = useMutations();
  let spaceID = useSpaceID();
  return (
    <SingleTextSection
      id={`${props.entityID}-default-text-section}`}
      onPaste={async (e) => {
        let items = e.clipboardData.items;
        if (!items[0].type.includes("image") || !session.session) return;
        let image = items[0].getAsFile();
        if (!image) return;

        let res = await fetch(`${WORKER_URL}/space/${spaceID}/upload_file`, {
          headers: {
            "X-Authorization": session.session.id,
          },
          method: "POST",
          body: image,
        });
        let data = (await res.json()) as
          | { success: false }
          | { success: true; data: { id: string } };
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
    />
  );
};

export const SectionAdder = (props: { entityID: string }) => {
  let { mutate, authorized } = useMutations();
  let date = useIndex.eav(props.entityID, "card/date");
  let [open, setOpen] = useState(false);
  let attachedCards = useIndex.eav(props.entityID, "deck/contains");

  if (!authorized) return null;
  return (
    <div className="flex flex-col gap-2 text-grey-55">
      <div className="flex gap-2 pt-2">
        <MakeImage entity={props.entityID} />

        {attachedCards && attachedCards.length !== 0 ? null : (
          <AddAttachedCard
            parent={props.entityID}
            attribute="deck/contains"
            positionKey="eav"
          >
            <div className="hover:text-accent-blue">
              <CardAdd />
            </div>
          </AddAttachedCard>
        )}
      </div>
    </div>
  );
};

export const Thought = (props: { entityID: string; open: () => void }) => {
  let { memberEntity } = useMutations();
  let unreadBy = useIndex.eav(props.entityID, "discussion/unread-by");

  let content = useIndex.eav(props.entityID, "discussion/content");
  let author = useIndex.eav(props.entityID, "discussion/author");
  let authorName = useIndex.eav(author?.value.value || null, "member/name");
  let createdAt = useIndex.eav(props.entityID, "discussion/created-at");
  let replyCount = useIndex.eav(props.entityID, "discussion/message-count");

  let unread =
    memberEntity && unreadBy?.find((u) => u.value.value === memberEntity);

  let time = createdAt
    ? new Date(createdAt?.value.value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";
  return (
    <button
      onClick={() => {
        props.open();
      }}
      className={`group flex flex-col gap-1 rounded-md border py-2 px-3 text-left ${" border-transparent text-grey-55 hover:border-accent-blue hover:bg-bg-blue hover:text-grey-35"} `}
      style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
    >
      <div className="flex w-full items-baseline gap-2">
        <div className="font-bold">{authorName?.value}</div>
        <div className="text-sm">{time}</div>
        {unread && (
          <div className="unreadCount mt-[6px] ml-1 h-[12px] w-[12px] shrink-0 rounded-full border  border-white bg-accent-gold"></div>
        )}
      </div>
      {!content?.value ? null : (
        <RenderedText
          text={content?.value}
          tabIndex={0}
          style={{
            whiteSpace: "pre-wrap",
          }}
        />
      )}
      <small
        className={`place-self-end  ${"underline group-hover:text-accent-blue"}`}
      >
        {replyCount?.value
          ? `${replyCount.value} ${
              replyCount.value === 1 ? "reply" : "replies"
            }`
          : "reply"}
      </small>
    </button>
  );
};
