import { Fragment, useRef, useContext } from "react";
import { Menu, Transition } from "@headlessui/react";

import { MoreOptions, Delete, DeckSmall } from "components/Icons";
import { Divider } from "components/Layout";
import Textarea from "components/AutosizeTextArea";
import { ReplicacheContext, useIndex } from "hooks/useReplicache";
import { Sections } from "./Sections";
import { AddSection } from "./AddSection";

export const CardView = (props: { entityID: string }) => {
  return (
    <div
      className={`
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
      </div>
    </div>
  );
};

const Title = (props: { entityID: string }) => {
  let title = useIndex.eav(props.entityID, "card/title");
  let rep = useContext(ReplicacheContext);

  let textarea = useRef<HTMLTextAreaElement | null>(null);
  return (
    <Textarea
      ref={textarea}
      className="text-xl font-bold"
      value={title?.value}
      onChange={async (e) => {
        let start = e.currentTarget.selectionStart,
          end = e.currentTarget.selectionEnd;
        await rep?.rep.mutate.assertFact({
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
  let rep = useContext(ReplicacheContext);

  return (
    <Textarea
      ref={textarea}
      className="placeholder:italic"
      placeholder="write something..."
      spellCheck={false}
      value={content?.value || ""}
      onChange={async (e) => {
        let start = e.currentTarget.selectionStart,
          end = e.currentTarget.selectionEnd;
        await rep?.rep.mutate.assertFact({
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
  return (
    <Menu as="div" className="relative">
      <Menu.Button>
        <MoreOptions />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="px-3 py-4 border border-grey-80 rounded-md shadow-drop bg-white absolute justify-items-end flex flex-col gap-3 text-right origin-top-right right-0 z-40 w-max">
          <Menu.Item>
            <button className="flex items-center gap-2">
              <p>Remove from Deck</p>
              <DeckSmall />
            </button>
          </Menu.Item>
          <Divider />
          <Menu.Item>
            <button className="flex items-center gap-2 text-accent-red">
              <p className="font-bold">Delete Card FOREVER</p>
              <Delete />
            </button>
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
