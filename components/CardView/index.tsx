import { Menu } from "@headlessui/react";

import { MoreOptions, Delete, DeckSmall, Member } from "components/Icons";
import { MenuContainer, MenuItem } from "components/Layout";
import { Textarea } from "components/Textarea";
import { useIndex, useMutations } from "hooks/useReplicache";
import {
  MultipleReferenceSection,
  Sections,
  SingleTextSection,
} from "./Sections";
import { AddSection } from "./AddSection";
import { Backlinks } from "./Backlinks";
import { usePreserveScroll, usePrevious } from "hooks/utils";
import Link from "next/link";
import { useAuth } from "hooks/useAuth";
import { ImageSection } from "./ImageSection";
import { useEffect, useRef, useState } from "react";

const borderStyles = (args: { deck: boolean; member: boolean }) => {
  switch (true) {
    //styles can be found is global.css
    case args.member:
      return `memberCardBorder !pl-3 pr-2 !pb-3 pt-2`;
    case args.deck:
      return `deckCardBorder`;
    default:
      return `defaultCardBorder`;
  }
};

const contentStyles = (args: { deck: boolean; member: boolean }) => {
  switch (true) {
    case args.member:
      return `bg-white rounded-md px-3 pt-3 pb-6`;
    case args.deck:
      return `px-4 py-6`;
    default:
      return `px-4 py-6`;
  }
};
export const CardView = (props: {
  entityID: string;
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
    if (open === "card" && previousOpen === "backlink") {
      parentContainer.current.scrollTo({
        left: 0,
        top: 0,
        behavior: "smooth",
      });
    }
    if (open === "backlink" && previousOpen === "card") {
      let bottomedScrollPosition =
        parentContainer.current.children[0].clientHeight -
        (parentContainer.current.clientHeight -
          parentContainer.current.children[2].clientHeight);

      parentContainer.current.scrollTo({
        left: 0,
        top: bottomedScrollPosition,
        behavior: "smooth",
      });
    }
  }, [open]);

  return (
    <div
      ref={parentContainer}
      className={`
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
        }
        if (
          e.currentTarget.scrollTop <= bottomedScrollPosition &&
          e.currentTarget.scrollTop > bottomedScrollPosition - 1
        ) {
          setOpen("backlink");
          (e.currentTarget.children[0] as HTMLElement)?.focus();
        }
      }}
    >
      <Backlinks
        entityID={props.entityID}
        open={open}
        onOpen={() => {
          setOpen("backlink");
        }}
      />

      <div
        className={`
        card
        z-20
        h-[calc(100%-16px)]
        absolute
        left-0
        top-0
        right-0
        snap-start

        flex flex-col
        ${borderStyles({
          deck: !!isDeck,
          member: !!memberName,
        })}
        `}
        onClick={() => {
          setOpen("card");
        }}
      >
        {!session?.loggedIn || !memberName ? null : (
          <>
            <div className="grid grid-cols-[auto_max-content] items-end text-white pb-1">
              <Member />
              <Link href={`/s/${memberName?.value}`}>
                <a className="justify-self-start">
                  <small>visit {memberName?.value}'s studio</small>
                  {/* <Studio className="text-white" /> */}
                </a>
              </Link>
              {/* <small>member</small> */}
            </div>
          </>
        )}

        {/* CARD CONTENT HERE */}
        <div
          ref={ref}
          className={`
            cardContent
        ${open === "card" ? " overflow-y-scroll" : "overflow-y-hidden"}
            flex flex-col gap-6          
            no-scrollbar
            w-full
            h-full
            ${contentStyles({ deck: !!isDeck, member: !!memberName })}
            `}
        >
          <div className="cardDefaultSection grid grid-auto-rows gap-3">
            <div className="cardHeader grid grid-cols-[auto_min-content] gap-2">
              <Title entityID={props.entityID} />
              <CardMoreOptionsMenu
                entityID={props.entityID}
                referenceFactID={props?.referenceFactID}
              />
            </div>
            <SingleTextSection
              entityID={props.entityID}
              section={"card/content"}
            />
            <ImageSection entity={props.entityID} />
          </div>

          {!isDeck ? null : <DeckCardList entityID={props.entityID} />}

          <Sections entityID={props.entityID} />

          <AddSection cardEntity={props.entityID} />
        </div>
        {/* CARD CONTENT HERE */}
      </div>
      <div className="spacer snap-end h-[calc(100%-42px)]" />
    </div>
  );
};

const DeckCardList = (props: { entityID: string }) => {
  let cards = useIndex.eav(props.entityID, "deck/contains");
  return (
    <div>
      <h3 className="pb-2">Cards ({cards?.length})</h3>
      <MultipleReferenceSection
        entityID={props.entityID}
        section="deck/contains"
      />
    </div>
  );
};

const Title = (props: { entityID: string }) => {
  let cardTitle = useIndex.eav(props.entityID, "card/title");
  let memberName = useIndex.eav(props.entityID, "member/name");
  let title = memberName || cardTitle;
  let { authorized, mutate } = useMutations();

  return (
    <Textarea
      previewOnly={!authorized || !!memberName}
      placeholder="Untitled"
      className="text-xl font-bold bg-inherit"
      value={title?.value}
      onChange={async (e) => {
        await mutate("assertFact", {
          entity: props.entityID,
          attribute: "card/title",
          value: e.currentTarget.value,
          positions: title?.positions || {},
        });
      }}
    />
  );
};

const CardMoreOptionsMenu = (props: {
  entityID: string;
  referenceFactID?: string;
}) => {
  let { authorized, mutate } = useMutations();
  let memberName = useIndex.eav(props.entityID, "member/name");

  let deleteDisabled = true;

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
                    mutate("removeCardFromSection", {
                      id: props?.referenceFactID as string,
                    });
                  }
            }
          >
            <p>Remove from Deck</p>
            <DeckSmall />
          </MenuItem>
        )}
        {/* <Divider /> */}

        {/* TODO: wire up delete card (and add confirmation?) */}
        {/* TODO: check if deck card; if so display "Delete Deck…"  */}

        <MenuItem disabled={deleteDisabled}>
          <p className="font-bold">Delete Card FOREVER</p>
          <Delete />
        </MenuItem>
      </MenuContainer>
    </Menu>
  );
};
