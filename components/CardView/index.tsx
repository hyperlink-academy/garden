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
import { usePreserveScroll } from "hooks/utils";
import Link from "next/link";
import { useAuth } from "hooks/useAuth";

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
  let { ref } = usePreserveScroll<HTMLDivElement>();
  let { session } = useAuth();
  return (
    <div
      className={`
          h-full
          flex flex-col
          drop-shadow-md
          ${borderStyles({
            deck: !!isDeck,
            member: !!memberName,
          })}`}
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

      <div
        ref={ref}
        className={`
            flex flex-col gap-6          
            overflow-y-auto
            no-scrollbar
            w-full
            h-full
            ${contentStyles({ deck: !!isDeck, member: !!memberName })}
            `}
      >
        <div className="grid grid-auto-rows gap-3">
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
        </div>

        {!isDeck ? null : <DeckCardList entityID={props.entityID} />}

        <Sections entityID={props.entityID} />

        <AddSection cardEntity={props.entityID} />
        <Backlinks entityID={props.entityID} />
      </div>
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
          <p
            className={`font-bold ${
              deleteDisabled ? "text-grey-35" : "text-accent-red"
            } `}
          >
            Delete Card FOREVER
          </p>
          <Delete />
        </MenuItem>
      </MenuContainer>
    </Menu>
  );
};
