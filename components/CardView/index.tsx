import { useRef } from "react";
import { Menu } from "@headlessui/react";

import { MoreOptions, Delete, DeckSmall, Member } from "components/Icons";
import { Divider, MenuContainer, MenuItem } from "components/Layout";
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
export const CardView = (props: { entityID: string }) => {
  let isDeck = useIndex.eav(props.entityID, "deck");
  let memberName = useIndex.eav(props.entityID, "member/name");
  let { ref } = usePreserveScroll<HTMLDivElement>();
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
      {!memberName ? null : (
        <div className="grid grid-cols-[auto_max-content] items-end text-white pb-1">
          <Member />
          <small>member</small>
        </div>
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
            <CardMoreOptionsMenu entityID={props.entityID} />
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

  let textarea = useRef<HTMLTextAreaElement | null>(null);
  return (
    <Textarea
      previewOnly={!authorized || !!memberName}
      ref={textarea}
      placeholder="Untitled"
      className="text-xl font-bold bg-inherit"
      value={title?.value}
      onChange={async (e) => {
        let start = e.currentTarget.selectionStart,
          end = e.currentTarget.selectionEnd;
        await mutate("assertFact", {
          entity: props.entityID,
          attribute: "card/title",
          value: e.currentTarget.value,
          positions: title?.positions || {},
        });
        textarea.current?.setSelectionRange(start, end);
      }}
    />
  );
};

const CardMoreOptionsMenu = (props: { entityID: string }) => {
  let { authorized } = useMutations();
  let memberName = useIndex.eav(props.entityID, "member/name");

  return !authorized || !!memberName ? null : (
    <Menu as="div" className="relative">
      <Menu.Button>
        <MoreOptions />
      </Menu.Button>
      <MenuContainer>
        <MenuItem>
          <p>Remove from Deck</p>
          <DeckSmall />
        </MenuItem>
        <Divider />
        <MenuItem>
          <p className="font-bold text-accent-red">Delete Card FOREVER</p>
          <Delete />
        </MenuItem>
      </MenuContainer>
    </Menu>
  );
};
