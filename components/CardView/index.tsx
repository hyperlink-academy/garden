import { Menu, Popover, Transition } from "@headlessui/react";

import {
  MoreOptions,
  Delete,
  DeckSmall,
  Member,
  CardAdd,
  Print,
  ExpandTiny,
  CollapseTiny,
} from "components/Icons";
import { Divider, MenuContainer, MenuItem } from "components/Layout";
import { useIndex, useMutations } from "hooks/useReplicache";
import {
  MultipleReferenceSection,
  Sections,
  SingleTextSection,
} from "./Sections";
import { AddSection } from "./AddSection";
import { Backlinks } from "./Backlinks";
import { spacePath, usePreserveScroll, usePrevious } from "hooks/utils";
import Link from "next/link";
import { useAuth } from "hooks/useAuth";
import { ImageSection } from "./ImageSection";
import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { flag, ref } from "data/Facts";
import { ButtonPrimary } from "components/Buttons";
import { Textarea } from "components/Textarea";
import { ulid } from "src/ulid";
import { animated, easings, useSpring } from "@react-spring/web";
import { MessageInput, Messages } from "pages/s/[studio]/s/[space]/chat";

const borderStyles = (args: { deck: boolean; member: boolean }) => {
  switch (true) {
    //styles can be found is global.css
    case args.member:
      return `memberCardBorder`;
    case args.deck:
      return `deckCardBorder`;

    default:
      return `defaultCardBorder`;
  }
};

const contentStyles = (args: { deck: boolean; member: boolean }) => {
  switch (true) {
    case args.member:
      return `bg-white rounded-md ml-2 mr-2 mb-2 mt-0 px-3 pt-3 pb-6`;
    case args.deck:
      return `px-3 py-4 sm:px-4 sm:py-6`;
    default:
      return `px-3 py-4 sm:px-4 sm:py-6`;
  }
};
export const CardView = (props: {
  entityID: string;
  onDelete?: () => void;
  referenceFactID?: string;
}) => {
  let isDeck = useIndex.eav(props.entityID, "deck");
  let isChat = useIndex.eav(props.entityID, "chat");
  let memberName = useIndex.eav(props.entityID, "member/name");
  let parentContainer = useRef<HTMLDivElement>(null);
  let { ref } = usePreserveScroll<HTMLDivElement>();
  let { session } = useAuth();
  let [open, setOpen] = useState<"card" | "backlink">("card");

  let previousOpen = usePrevious(open);
  useEffect(() => {
    if (!parentContainer.current) return;
    let parent = parentContainer.current;
    let backlinks = parent.children[0];
    let card = parent.children[2];
    if (open === "card" && previousOpen === "backlink") {
      parent.scrollTo({
        left: 0,
        top: 0,
        behavior: "smooth",
      });
    }
    if (open === "backlink" && previousOpen === "card") {
      let bottomedScrollPosition =
        backlinks.clientHeight - (parent.clientHeight - card.clientHeight);
      parent.scrollTo({
        left: 0,
        top: bottomedScrollPosition,
        behavior: "smooth",
      });
      (backlinks as HTMLElement).focus();
    }
  }, [open]);

  // TESTING HIDDEN FEATURE - customizable card styles
  // get sections at top level to check for style customizations
  let text_color_value = useIndex.eav(
    props.entityID,
    "section/hyperlink_text_color" as "arbitrarySectionStringType"
  )?.value;
  let bg_color_value = useIndex.eav(
    props.entityID,
    "section/hyperlink_bg_color" as "arbitrarySectionStringType"
  )?.value;
  let border_color_value = useIndex.eav(
    props.entityID,
    "section/hyperlink_border_color" as "arbitrarySectionStringType"
  )?.value;
  let border_width_value = useIndex.eav(
    props.entityID,
    "section/hyperlink_border_width" as "arbitrarySectionStringType"
  )?.value;
  if (isChat) return <ChatCard {...props} />;

  return (
    <div
      ref={parentContainer}
      className={`
      w-full
        cardAndBacklink 
        max-w-3xl mx-auto
        h-full
        overflow-y-scroll       
        relative
        no-scrollbar
        snap-y snap-mandatory
        `}
      onScroll={(e) => {
        let wrapperContentHeight = e.currentTarget.scrollHeight;
        let wrapperHeight = e.currentTarget.clientHeight;

        let bottomedScrollPosition = wrapperContentHeight - wrapperHeight;

        if (e.currentTarget.scrollTop < 1) {
          setOpen("card");
          return;
        }
        if (
          e.currentTarget.scrollTop <= bottomedScrollPosition &&
          e.currentTarget.scrollTop >= bottomedScrollPosition - 1
        ) {
          setOpen("backlink");
        }
      }}
    >
      {/* Backlinks are a sticky div that sits behind another div that contains the card and a big ol empty div. 
      The card and empty div scroll together above the backlinks.  */}
      {/* The h calc here determines the height of the card, and therefore, how much of the backlinks will peek out underneath it. 
      Another calc on the empty div (className =  spacer) determines how much the card will peek in when the backlinks are revealed*/}
      <div
        className={`
        card
        h-[calc(100%-20px)]
        absolute
        !z-10
        left-0
        top-0
        right-0
        snap-start
        flex flex-col gap-0
        ${borderStyles({
          deck: !!isDeck,
          member: !!memberName,
        })}
        `}
        onClick={() => {
          setOpen("card");
        }}
        style={{
          color: text_color_value ? text_color_value : undefined,
          backgroundColor: bg_color_value ? bg_color_value : undefined,
          borderColor: border_color_value ? border_color_value : undefined,
          borderWidth: border_width_value ? border_width_value : undefined,
        }}
      >
        {!session?.loggedIn || !memberName ? null : (
          <>
            <div className="grid grid-cols-[auto_max-content] items-end text-white px-2 pt-2 pb-1">
              <Member />
              <Link href={`/s/${memberName?.value}`}>
                <a className="justify-self-start">
                  <small>visit studio</small>
                </a>
              </Link>
            </div>
          </>
        )}

        {/* CARD CONTENT HERE */}
        <div
          ref={ref}
          className={`
            cardContent
        ${open === "card" ? "overflow-y-auto" : "overflow-y-hidden"}
            flex flex-col gap-6          
            no-scrollbar
            w-auto
            h-full
            ${contentStyles({
              deck: !!isDeck,
              member: !!memberName,
            })}
            `}
        >
          <div className="cardDefaultSection grid grid-auto-rows gap-3">
            <div className="cardHeader grid grid-cols-[auto_max-content_max-content] gap-2">
              <Title entityID={props.entityID} />
              <HighlightDropdown entityID={props.entityID} />
              <div className="">
                <CardMoreOptionsMenu
                  onDelete={props.onDelete}
                  entityID={props.entityID}
                  referenceFactID={props?.referenceFactID}
                />
              </div>
            </div>
            <SingleTextSection
              entityID={props.entityID}
              section={"card/content"}
            />
            <div>
              <ImageSection entity={props.entityID} />
              <MakeDeck entity={props.entityID} />
            </div>
          </div>

          {!isDeck ? null : <DeckCardList entityID={props.entityID} />}

          <Sections entityID={props.entityID} />

          <AddSection cardEntity={props.entityID} />
        </div>
        {/* END CARD CONTENT */}
      </div>

      <Backlinks
        entityID={props.entityID}
        open={open}
        onOpen={() => {
          setOpen("backlink");
        }}
      />
      {/* This is a blank div that allows the card to slide up, revealing the backlinks underneath. 
      The calc controls how much the card will slide up. 
      Bigger number, more of the bottom of the card peeks in, Smaller number, less of it peeks in. */}
      <div className="spacer snap-end h-[calc(100%-48px)]" />
    </div>
  );
};

const ChatCard = (props: {
  entityID: string;
  onDelete?: () => void;
  referenceFactID?: string;
}) => {
  return (
    <div className={`chatCardWrapper grow h-full relative`}>
      <div className="chatCardBackground absolute top-0 bottom-0 left-0 right-0 chatCardBorder">
        <div className="chatCardContent flex flex-col overflow-scroll h-full px-3 pt-4 sm:px-4 sm:pt-6 pb-1">
          <div className="cardHeader grid grid-cols-[auto_max-content_max-content] gap-2">
            <div className="pb-2">
              <Title entityID={props.entityID} />
            </div>
            <HighlightDropdown entityID={props.entityID} />
            <div className="">
              <CardMoreOptionsMenu
                onDelete={props.onDelete}
                entityID={props.entityID}
                referenceFactID={props?.referenceFactID}
              />
            </div>
          </div>
          <Messages topic={props.entityID} />
          <MessageInput id={props.entityID} topic={props.entityID} />
        </div>
      </div>
    </div>
  );
};

const MakeDeck = (props: { entity: string }) => {
  let { authorized, mutate } = useMutations();
  let cards = useIndex.eav(props.entity, "deck/contains");
  let isDeck = useIndex.eav(props.entity, "deck");

  if (cards && cards.length > 0) return null;
  if (!authorized) return null;
  return (
    <button
      onClick={() => {
        if (isDeck) mutate("retractFact", { id: isDeck.id });
        else
          mutate("assertFact", {
            entity: props.entity,
            attribute: "deck",
            value: flag(),
            positions: {},
          });
      }}
    >
      <CardAdd
        className={
          isDeck
            ? `text-accent-blue hover:text-grey-55`
            : `text-grey-55 hover:text-accent-blue`
        }
      />
    </button>
  );
};

const Title = (props: { entityID: string }) => {
  let memberName = useIndex.eav(props.entityID, "member/name");
  let botName = useIndex.eav(props.entityID, "bot/name");
  let cardTitle = useIndex.eav(props.entityID, "card/title");
  let titleFact = memberName || botName || cardTitle;
  return (
    <SingleTextSection
      previewOnly={titleFact?.attribute === "member/name"}
      entityID={props.entityID}
      className="text-xl font-bold bg-inherit"
      section={titleFact?.attribute || "card/title"}
    />
  );
};

const DeckCardList = (props: { entityID: string }) => {
  let cards = useIndex.eav(props.entityID, "deck/contains");
  return (
    <div>
      <MultipleReferenceSection
        entityID={props.entityID}
        section="deck/contains"
      />
    </div>
  );
};

const CardMoreOptionsMenu = (props: {
  entityID: string;
  referenceFactID?: string;
  onDelete?: () => void;
}) => {
  let { authorized, mutate } = useMutations();
  let memberName = useIndex.eav(props.entityID, "member/name");

  let { query: q } = useRouter();

  return !authorized || !!memberName ? null : (
    <Menu as="div" className="relative">
      <Menu.Button className={`pt-[6px]`}>
        <MoreOptions />
      </Menu.Button>
      <MenuContainer>
        {!props?.referenceFactID ? null : (
          <MenuItem
            onClick={
              !authorized
                ? undefined
                : () => {
                    mutate("retractFact", {
                      id: props?.referenceFactID as string,
                    });
                  }
            }
          >
            <p>Remove from Deck</p>
            <DeckSmall />
          </MenuItem>
        )}

        <MenuItem>
          <Link
            href={`${spacePath(q.space, q.studio)}/c/${props.entityID}/print`}
          >
            <a>Print</a>
          </Link>
          <Print />
        </MenuItem>
        <div className="py-2">
          <Divider />
        </div>

        {/* TODO: wire up delete card (and add confirmation?) */}
        {/* TODO: check if deck card; if so display "Delete Deck…"  */}

        <MenuItem
          onClick={() => {
            mutate("deleteEntity", { entity: props.entityID });
            props.onDelete?.();
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

const HighlightDropdown = (props: { entityID: string }) => {
  let [highlightHelp, setHighlightHelp] = useState(false);
  let [note, setNote] = useState("");
  let { authorized, mutate, memberEntity } = useMutations();

  return (
    <Popover>
      {authorized && (
        <Popover.Button className="cardHighlighter rounded-full bg-test-pink h-[28px] w-[28px]" />
      )}
      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
        className="
          absolute
          top-16 right-4 left-4
          px-4 py-4
          bg-white
          lightBorder
          flex flex-col
          gap-3
          shadow-drop
          justify-items-end 
          text-right
          origin-top-right 
          z-40"
      >
        <Popover.Panel>
          <div className="flex flex-col gap-2">
            <Textarea
              placeholder="add a note (optional)"
              className="lightBorder resize-none w-full p-3 text-left"
              value={note}
              onChange={(e) => setNote(e.currentTarget.value)}
            />
            <small className="text-right justify-self-end">
              <span className={note.length > 280 ? "text-accent-red" : ""}>
                {note.length}
              </span>
              /{280}
            </small>
          </div>
          <div className="flex justify-between items-end text-accent-blue">
            <small onClick={() => setHighlightHelp(!highlightHelp)}>
              {!highlightHelp ? "What's this?" : "Gotcha!"}
            </small>

            <ButtonPrimary
              disabled={note.length > 280}
              content="Submit"
              onClick={async () => {
                if (!memberEntity || note.length > 280) return;
                let entity = ulid();
                await mutate("assertFact", [
                  {
                    entity,
                    positions: {},
                    attribute: "highlight/time",
                    value: {
                      type: "unix_seconds",
                      value: Date.now().toString(),
                    },
                  },

                  {
                    entity,
                    positions: {},
                    attribute: "highlight/card",
                    value: ref(props.entityID),
                  },
                  {
                    entity,
                    positions: {},
                    attribute: "highlight/by",
                    value: ref(memberEntity),
                  },
                ]);
                if (note) {
                  await mutate("assertFact", {
                    entity,
                    attribute: "highlight/note",
                    value: note,
                    positions: {},
                  });
                }
                setOpen(false);
              }}
            />
          </div>
          {highlightHelp ? (
            <div className="lightBorder bg-background p-3 -mt-1">
              <small>
                <b>Use a highlight to draw attention to this card.</b>
                <br />
                It'll be added to the highlight reel on the desktop with your
                note where everyone can see it. <br />
                Highlights fade after 24 hours!
              </small>
            </div>
          ) : null}
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};
