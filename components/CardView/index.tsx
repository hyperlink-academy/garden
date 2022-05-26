import { useRef } from "react";
import { Menu } from "@headlessui/react";

import { MoreOptions, Delete, DeckSmall, Member } from "components/Icons";
import { Divider, MenuContainer, MenuItem } from "components/Layout";
import Textarea from "components/AutosizeTextArea";
import { useIndex, useMutations } from "hooks/useReplicache";
import {
  MultipleReferenceSection,
  Sections,
  SingleTextSection,
} from "./Sections";
import { AddSection } from "./AddSection";
import { Backlinks } from "./Backlinks";
import Head from "next/head";
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
  let cardTitle = useIndex.eav(props.entityID, "card/title");
  let memberName = useIndex.eav(props.entityID, "member/name");
  let title = memberName || cardTitle;
  let { ref } = usePreserveScroll<HTMLDivElement>();
  return (
    <>
      <Head>
        <title key="title">{title ? title?.value : "Untitled"}</title>
      </Head>

      <div
        className={`
          h-full
          drop-shadow-md
          flex flex-col
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
              <CardMoreOptionsMenu />
            </div>
            <SingleTextSection
              entityID={props.entityID}
              section={"card/content"}
              placeholder="write something..."
            />
          </div>

          {!isDeck ? null : <DeckCardList entityID={props.entityID} />}

          <Sections entityID={props.entityID} />

          <AddSection cardEntity={props.entityID} />

          <Backlinks entityID={props.entityID} />
        </div>
      </div>
    </>
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
  return !authorized || memberName ? (
    <h2>{title ? title?.value : "Untitled"}</h2>
  ) : (
    <Textarea
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

const CardMoreOptionsMenu = () => {
  let { authorized } = useMutations();

  return !authorized ? null : (
    <Menu as="div" className="relative">
      <Menu.Button>
        <MoreOptions />
      </Menu.Button>
      <MenuContainer>
        <MenuItem>
          <button className="flex items-center gap-2">
            <p>Remove from Deck</p>
            <DeckSmall />
          </button>
        </MenuItem>
        <Divider />
        <MenuItem>
          <button className="flex items-center gap-2 text-accent-red">
            <p className="font-bold">Delete Card FOREVER</p>
            <Delete />
          </button>
        </MenuItem>
      </MenuContainer>
    </Menu>
  );
};
