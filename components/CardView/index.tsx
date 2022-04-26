import { useRef } from "react";
import { Menu } from "@headlessui/react";

import { MoreOptions, Delete, DeckSmall } from "components/Icons";
import { Divider, MenuContainer, MenuItem } from "components/Layout";
import Textarea from "components/AutosizeTextArea";
import { useIndex, useMutations } from "hooks/useReplicache";
import { MultipleReferenceSection, Sections } from "./Sections";
import { AddSection } from "./AddSection";
import { Backlinks } from "./Backlinks";
import Head from "next/head";

export const CardView = (props: { entityID: string }) => {
  let isDeck = useIndex.eav(props.entityID, "deck");
  let title = useIndex.eav(props.entityID, "card/title");
  return (
    <>
      <Head>
        <title key="title">{title ? title?.value : "Untitled"}</title>
      </Head>
      <div
        className={`
      overflow-y-auto
      h-full
      px-5 py-6
      border border-grey-80 rounded-lg 
      shadow-drop
      bg-white
      `}
      >
        <div className="grid grid-auto-row gap-6">
          <div className="grid grid-auto-rows gap-3">
            <div className="cardHeader grid grid-cols-[auto_min-content] gap-2">
              <Title entityID={props.entityID} />
              <CardMoreOptionsMenu />
            </div>
            <Content entityID={props.entityID} />
          </div>
          <Sections entityID={props.entityID} />
          <AddSection cardEntity={props.entityID} />
          <Backlinks entityID={props.entityID} />
        </div>
        {!isDeck ? null : <DeckCardList entityID={props.entityID} />}
        <Sections entityID={props.entityID} />
        <AddSection cardEntity={props.entityID} />
        <Backlinks entityID={props.entityID} />
      </div>
    </>
  );
};

const DeckCardList = (props: { entityID: string }) => {
  let cards = useIndex.eav(props.entityID, "deck/contains");
  return (
    <div>
      <h3>Cards ({cards?.length})</h3>
      <MultipleReferenceSection
        entityID={props.entityID}
        section="deck/contains"
      />
    </div>
  );
};

const Title = (props: { entityID: string }) => {
  let title = useIndex.eav(props.entityID, "card/title");
  let { authorized, mutate } = useMutations();

  let textarea = useRef<HTMLTextAreaElement | null>(null);
  return !authorized ? (
    <h2>{title ? title?.value : "Untitled"}</h2>
  ) : (
    <Textarea
      ref={textarea}
      placeholder="Untitled"
      className="text-xl font-bold"
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

const Content = (props: { entityID: string }) => {
  let textarea = useRef<HTMLTextAreaElement | null>(null);
  let content = useIndex.eav(props.entityID, "card/content");
  let { authorized, mutate } = useMutations();

  return !authorized ? (
    <div className="whitespace-pre-wrap">{content?.value || ""}</div>
  ) : (
    <Textarea
      ref={textarea}
      className="placeholder:italic"
      placeholder="write something..."
      spellCheck={false}
      value={content?.value || ""}
      onChange={async (e) => {
        let start = e.currentTarget.selectionStart,
          end = e.currentTarget.selectionEnd;
        await mutate("assertFact", {
          entity: props.entityID,
          attribute: "card/content",
          value: e.currentTarget.value,
          positions: content?.positions || {},
        });
        textarea.current?.setSelectionRange(start, end);
      }}
    />
  );
};

const CardMoreOptionsMenu = () => {
  let { authorized, mutate } = useMutations();

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
