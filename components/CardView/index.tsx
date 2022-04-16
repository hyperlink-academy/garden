import { Fragment, useState, useRef, useContext } from "react";
import { Menu, Transition } from "@headlessui/react";

import { ButtonPrimary, ButtonSecondary } from "components/Buttons";
import { FindOrCreate, FindOrCreateCard } from "components/FindOrCreateEntity";
import {
  MoreOptions,
  Add,
  Delete,
  DeckSmall,
  SectionText,
  Close,
  DownArrow,
  UpArrow,
  SectionLinkedCard,
} from "components/Icons";
import { Divider } from "components/Layout";
import Textarea from "components/AutosizeTextArea";
import { ReplicacheContext, useIndex } from "hooks/useReplicache";
import { multipleReferenceSection, singleTextSection } from "data/Facts";
import { generateKeyBetween } from "src/fractional-indexing";
import { sortByPosition } from "src/position_helpers";
import { ulid } from "src/ulid";
import { SmallCardList } from "components/DeckList";

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
          <Header entityID={props.entityID} />
          <QuietTextArea entityID={props.entityID} />
        </div>
        <Sections entityID={props.entityID} />
        <AddSection cardEntity={props.entityID} />
      </div>
    </div>
  );
};

const AddSection = (props: { cardEntity: string }) => {
  let [open, setOpen] = useState(false);
  let rep = useContext(ReplicacheContext);
  let [section, setSection] = useState({
    name: "",
    type: "string" as "reference" | "string",
  });
  let cardSections = useIndex.eav(props.cardEntity, "card/section");
  let sections = useIndex
    .aev("name")
    .filter(
      (f) =>
        f.value.startsWith("section") &&
        !cardSections?.find((c) => f.value === `section/${c.value}`)
    );
  let types = useIndex.aev("type");

  let existingSection = sections.find(
    (f) => f.value === `section/${section.name}`
  );
  let existingSectionType = types.find(
    (f) => f.entity === existingSection?.entity
  );

  let type = existingSectionType?.value || section.type;

  return (
    <div className="addSectionButton grid grid-auto-row gap-2 pb-6">
      <Divider />
      {!open ? (
        <button
          className="flex gap-2 text-grey-80"
          onClick={() => setOpen(true)}
        >
          <Add />
          <h4 className="text-grey-80 ">Add Section</h4>
        </button>
      ) : (
        <div>
          <div className="grid grid-flow-col gap-4 grid-cols-[auto,min-content]">
            <SectionNamePicker
              items={sections.map((s) => {
                let type = types.find((f) => f.entity === s.entity);
                return {
                  entity: s.entity,
                  display: s.value.slice(8),
                  icon:
                    type?.value === "string" ? (
                      <SectionText />
                    ) : (
                      <SectionLinkedCard />
                    ),
                };
              })}
              name={section.name}
              setName={(e) => setSection({ ...section, name: e })}
            />
            <div className="flex flex-row items-center w-min gap-2">
              <button
                onClick={() => setSection({ ...section, type: "string" })}
              >
                <SectionText
                  className={
                    type === "string" ? "text-grey-15" : "text-grey-55"
                  }
                />
              </button>
              <button
                onClick={() => setSection({ ...section, type: "reference" })}
              >
                <SectionLinkedCard
                  className={
                    type === "reference" ? "text-grey-15" : "text-grey-55"
                  }
                />
              </button>
            </div>
          </div>
          <ButtonSecondary
            content="Add Section"
            onClick={async () => {
              await rep?.rep.mutate.addSection({
                newSectionEntity: ulid(),
                sectionName: section.name,
                type: type as "reference" | "string",
                cardEntity: props.cardEntity,
                positions: "",
              });
              setOpen(false);
              setSection({ ...section, name: "" });
            }}
          />
        </div>
      )}
    </div>
  );
};

const SectionNamePicker = (props: {
  name: string;
  items: { entity: string; display: string; icon: React.ReactElement }[];
  setName: (s: string) => void;
}) => {
  let [open, setOpen] = useState(false);
  return (
    <div>
      <button
        className="w-full p-2 rounded-md bg-white border-grey-55 border text-left"
        onClick={() => setOpen(true)}
      >
        {props.name || ""}
      </button>
      <FindOrCreate
        open={open}
        onSelect={(e) => {
          if (e.type === "create") props.setName(e.name);
          else {
            let name = props.items.find((s) => s.entity === e.entity)?.display;
            if (name) props.setName(name);
          }
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
        items={props.items}
        selected={[
          props.items.find((f) => f.display === props.name)?.entity || "",
        ]}
      />
    </div>
  );
};

const Sections = (props: { entityID: string }) => {
  let sections = useIndex.eav(props.entityID, "card/section");
  return (
    <div className="grid grid-auto-row gap-6">
      {sections?.map((s) => (
        <Section name={s.value} entityID={props.entityID} key={s.value} />
      ))}
    </div>
  );
};

const Section = (props: { name: string; entityID: string }) => {
  let entity = useIndex.ave("name", `section/${props.name}`);
  let cardinality = useIndex.eav(entity?.entity || null, "cardinality");
  let type = useIndex.eav(entity?.entity || null, "type");
  return (
    <div className="textSection grid grid-auto-rows gap-2">
      <div className="grid grid-cols-[auto_min-content_min-content] gap-2 items-start">
        <h4 className="mt-[1px]">{props.name}</h4>
        <div className="text-grey-55">
          {type?.value === "string" ? <SectionText /> : <SectionLinkedCard />}
        </div>
        <button className="mt-1">
          <SectionMoreOptionsMenu />
        </button>
      </div>
      {type?.value === "string" ? (
        <SingleTextSection entityID={props.entityID} section={props.name} />
      ) : type?.value === "reference" && cardinality?.value === "many" ? (
        <MultipleReferenceSection
          section={props.name}
          entityID={props.entityID}
        />
      ) : null}
    </div>
  );
};

const SingleTextSection = (props: {
  entityID: string;
  section: string;
  new?: boolean;
}) => {
  let fact = useIndex.eav(props.entityID, singleTextSection(props.section));
  let inputEl = useRef<HTMLTextAreaElement | null>(null);
  let rep = useContext(ReplicacheContext);
  return (
    <Textarea
      autoFocus={props.new}
      ref={inputEl}
      className="w-full"
      value={(fact?.value as string) || ""}
      onChange={async (e) => {
        let start = e.currentTarget.selectionStart,
          end = e.currentTarget.selectionEnd;
        await rep?.rep.mutate.assertFact({
          entity: props.entityID,
          attribute: singleTextSection(props.section),
          value: e.currentTarget.value,
          positions: fact?.positions || {},
        });
        inputEl.current?.setSelectionRange(start, end);
      }}
    />
  );
};

const MultipleReferenceSection = (props: {
  entityID: string;
  section: string;
}) => {
  let attribute = multipleReferenceSection(props.section);
  let references = useIndex.eav(props.entityID, attribute);
  let rep = useContext(ReplicacheContext);
  let earliestCard = references?.sort(sortByPosition("eav"))[0];
  let [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <ButtonPrimary
        onClick={() => setOpen(true)}
        content="search to add cards"
      />
      <FindOrCreateCard
        open={open}
        onClose={() => setOpen(false)}
        selected={references?.map((c) => c.value.value) || []}
        onSelect={async (e) => {
          let position = generateKeyBetween(
            null,
            earliestCard?.positions["eav"] || null
          );
          if (e.type === "create") {
            let newEntity = ulid();
            await rep?.rep.mutate.createCard({
              entityID: newEntity,
              title: e.name,
            });
            await rep?.rep.mutate.addCardToSection({
              cardEntity: newEntity,
              parent: props.entityID,
              positions: { eav: position },
              section: attribute,
            });
            return;
          }
          rep?.rep.mutate.addCardToSection({
            cardEntity: e.entity,
            parent: props.entityID,
            positions: { eav: position },
            section: attribute,
          });
          //TODO
        }}
      />
      <SmallCardList
        attribute={attribute}
        cards={references || []}
        deck={props.entityID}
        positionKey="eav"
      />
    </div>
  );
};

const Header = (props: { entityID: string }) => {
  let title = useIndex.eav(props.entityID, "card/title");
  let rep = useContext(ReplicacheContext);

  let textarea = useRef<HTMLTextAreaElement | null>(null);
  return (
    <div className="cardHeader grid grid-cols-[auto_min-content] gap-2 items-start z-40">
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
      <div className="mt-[4px]">
        <CardMoreOptionsMenu />
      </div>{" "}
    </div>
  );
};

const CardMoreOptionsMenu = () => {
  return (
    <div className="text-right">
      <Menu>
        <Menu.Button className="mt-[2px] relative">
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
          <Menu.Items className="px-3 py-4 border border-grey-80 rounded-md shadow-drop bg-white absolute right-8 justify-items-end grid grid-auto-row gap-3">
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
    </div>
  );
};

const SectionMoreOptionsMenu = () => {
  return (
    <div className="text-right">
      <Menu>
        <Menu.Button className="mt-[2px] relative">
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
          <Menu.Items className="px-3 py-4 border border-grey-80 rounded-md shadow-drop bg-white absolute right-8 justify-items-end grid grid-auto-row gap-3">
            <Menu.Item>
              <button className="flex items-center gap-2">
                <p>Move Up</p>
                <UpArrow />
              </button>
            </Menu.Item>
            <Menu.Item>
              <button className="flex items-center gap-2">
                <p>Move Down</p>
                <DownArrow />
              </button>
            </Menu.Item>
            <Menu.Item>
              <button className="flex items-center gap-2">
                <p>Remove</p>
                <Close />
              </button>
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
};

const QuietTextArea = (props: { entityID: string }) => {
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
