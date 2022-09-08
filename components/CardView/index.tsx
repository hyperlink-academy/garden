import { Menu } from "@headlessui/react";

import {
  MoreOptions,
  Delete,
  DeckSmall,
  Member,
  CardAdd,
  Print,
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
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { flag } from "data/Facts";

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
      return `px-4 py-6`;
    default:
      return `px-4 py-6`;
  }
};
export const CardView = (props: {
  entityID: string;
  onDelete?: () => void;
  referenceFactID?: string;
}) => {
  let isDeck = useIndex.eav(props.entityID, "deck");
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
            ${contentStyles({ deck: !!isDeck, member: !!memberName })}
            `}
        >
          <div className="cardDefaultSection grid grid-auto-rows gap-3">
            <div className="cardHeader grid grid-cols-[auto_min-content] gap-2">
              <Title entityID={props.entityID} />
              <CardMoreOptionsMenu
                onDelete={props.onDelete}
                entityID={props.entityID}
                referenceFactID={props?.referenceFactID}
              />
            </div>
            <SingleTextSection
              entityID={props.entityID}
              section={"card/content"}
            />
            <div>
              <ImageSection entity={props.entityID} />
              {isDeck ? null : <MakeDeck entity={props.entityID} />}
            </div>
          </div>

          {!isDeck ? null : <DeckCardList entityID={props.entityID} />}

          <Sections entityID={props.entityID} />

          <AddSection cardEntity={props.entityID} />
        </div>
        {/* END CARD CONTENT */}

        {/* THE NAME OF THE CARD SHOWS AT THE VERY BOTTOM IF BACKLINKS ARE OPEN */}
        {/* <small
          className={` font-bold ${
            !memberName ? "text-grey-35" : "text-white"
          } px-4 pb-1 transition-opacity ${
            open === "card" ? "hidden" : "block"
          }`}
        >
          {!!cardTitle
            ? cardTitle.value
            : !!memberName
            ? memberName.value
            : "Untitled"}
        </small> */}
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

const MakeDeck = (props: { entity: string }) => {
  let { authorized, mutate } = useMutations();
  if (!authorized) return null;
  return (
    <button
      onClick={() => {
        mutate("assertFact", {
          entity: props.entity,
          attribute: "deck",
          value: flag(),
          positions: {},
        });
      }}
    >
      <CardAdd className="text-grey-55 hover:text-accent-blue" />
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
      <Menu.Button>
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
