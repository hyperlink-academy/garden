import { ButtonPrimary, ButtonTertiary, ButtonLink } from "components/Buttons";
import { Add, SectionLinkedCard, SectionText } from "components/Icons";
import { Divider, Modal } from "components/Layout";
import { ReplicacheContext, useIndex, useMutations } from "hooks/useReplicache";
import { useContext, useState } from "react";
import { ulid } from "src/ulid";
import { Combobox } from "@headlessui/react";

//TODO
// 1. Wire up add section state
// 2. Fix actually adding section logic

export const AddSection = (props: { cardEntity: string }) => {
  let [state, setState] = useState<"closed" | "add" | "create">("closed");
  let { authorized, mutate } = useMutations();
  let cardSections = useIndex.eav(props.cardEntity, "card/section");
  let sections = useIndex
    .aev("name")
    .filter(
      (f) =>
        f.value.startsWith("section") &&
        !cardSections?.find((c) => f.value === `section/${c.value}`)
    );
  let types = useIndex.aev("type");

  return !authorized ? (
    <Divider />
  ) : (
    <div className="addSectionButton grid grid-auto-row gap-2 pb-6">
      <button
        className="grid grid-cols-[1fr_max-content_1fr] gap-4 items-center text-grey-80"
        onClick={() => setState("add")}
      >
        <Divider />
        <div className="flex gap-2">
          <Add />
          <h4 className="text-grey-80 ">Add Section</h4>
        </div>
        <Divider />
      </button>
      <Modal open={state !== "closed"} onClose={() => setState("closed")}>
        {state === "add" ? (
          <SelectSection
            selected={[]}
            onSelect={async (s) => {
              let name = sections.find((f) => f.entity === s.entity);
              let type = types.find((f) => f.entity === s.entity);
              if (!name || !type) return;
              await mutate("addSection", {
                newSectionEntity: ulid(),
                sectionName: name.value.slice(8),
                type: type.value as "reference" | "string",
                cardEntity: props.cardEntity,
                positions: "",
              });
              setState("closed");
            }}
            onClickCreate={() => setState("create")}
            items={sections.map((s) => {
              let type = types.find((f) => f.entity === s.entity);
              return {
                value: s.entity,
                display: s.value.slice(8),
                icon:
                  type?.value === "string" ? (
                    <SectionText />
                  ) : (
                    <SectionLinkedCard />
                  ),
              };
            })}
          />
        ) : (
          <CreateSectionDialog
            onClose={() => setState("closed")}
            onCreate={async (s) => {
              await mutate("addSection", {
                newSectionEntity: ulid(),
                sectionName: s.name,
                type: s.type,
                cardEntity: props.cardEntity,
                positions: "",
              });
              setState("closed");
            }}
          />
        )}
      </Modal>
    </div>
  );
};

const CreateSectionDialog = (props: {
  onCreate: (s: { name: string; type: "reference" | "string" }) => void;
  onClose: () => void;
}) => {
  let [sectionName, setSectionName] = useState("");
  let [sectionType, setSectionType] = useState<"reference" | "string">();
  return (
    <>
      <h3>Create a New Section!</h3>
      <div className="flex flex-col gap-2">
        <h4>Section Name</h4>
        <input
          type="text"
          value={sectionName}
          aria-label="section name"
          onChange={(e) => setSectionName(e.currentTarget.value)}
        />
      </div>
      <div className="sectionTypePicker grid grid-flow-row items-center w-full gap-2">
        <h4>Content Type</h4>
        <div className="flex gap-4">
          <input
            type="radio"
            name="section-types"
            id="text-section"
            value="text section"
            onChange={() => setSectionType("string")}
          />
          <label
            htmlFor="text-section"
            className="grid grid-cols-[max-content_max-content] gap-2"
          >
            <SectionText
              className={
                sectionType === "string" ? "text-grey-15" : "text-grey-55"
              }
            />
            <p
              className={
                sectionType === "string" ? "font-bold" : "text-grey-35"
              }
            >
              Text Section
            </p>
          </label>
        </div>
        <div className="flex gap-4">
          <input
            type="radio"
            name="section-types"
            id="linked-card-section"
            value="linked card section"
            onChange={() => setSectionType("reference")}
          />
          <label
            htmlFor="linked-card-section"
            className="grid grid-cols-[max-content_max-content] gap-2"
          >
            <SectionLinkedCard
              className={
                sectionType === "reference" ? "text-grey-15" : "text-grey-55"
              }
            />
            <p
              className={
                sectionType === "reference" ? "font-bold" : "text-grey-35"
              }
            >
              Linked Card Section
            </p>
          </label>
        </div>
      </div>
      <div className="grid grid-cols-[max-content_max-content] gap-4 justify-self-end">
        <ButtonTertiary content="Nevermind" onClick={() => props.onClose()} />
        <ButtonPrimary
          content="Add Section"
          disabled={!sectionName || !sectionType}
          onClick={async () => {
            if (!sectionName || !sectionType) return;
            props.onCreate({ name: sectionName, type: sectionType });
          }}
        />
      </div>
    </>
  );
};

// Can I adapt this to work for section names as well?
// They are a single select
// use react state not replicache state
export const SelectSection = (props: {
  onClickCreate: () => void;
  items: { display: string; value: string; icon?: React.ReactElement }[];
  selected: string[];
  onSelect: (section: { entity: string }) => void;
}) => {
  let [input, setInput] = useState("");
  let items = props.items.filter((f) => {
    if (/[A-Z]/g.test(input)) return f.display.includes(input);
    return f.display.toLocaleLowerCase().includes(input.toLocaleLowerCase());
  });

  return (
    <Combobox
      value=""
      onChange={(e) => {
        props.onSelect({ entity: e });
      }}
      as="div"
      className={``}
    >
      <h3 className="mx-6 pt-6 pb-2">Add a Section</h3>

      <Combobox.Input
        value={input}
        className="mx-6"
        placeholder="search for a section..."
        onChange={(e) => setInput(e.currentTarget.value)}
      />
      {/* I am aware the max height in the Combobox.Options is gross, but max-h-full does work and this is the best i could do D:*/}
      <Combobox.Options
        static
        className="w-full py-4 flex-col flex gap-2 h-min max-h-[calc(100vh-12rem)] overflow-y-auto "
      >
        {items.map((item) => {
          return (
            <Combobox.Option
              key={item.value}
              value={item.value}
              className="cursor-pointer"
            >
              {({ active }) => {
                return (
                  <SearchItem active={active}>
                    <div
                      className={`gap-2 items-center grid grid-cols-[min-content_auto]`}
                    >
                      {item.icon}
                      {item.display}
                    </div>
                  </SearchItem>
                );
              }}
            </Combobox.Option>
          );
        })}
      </Combobox.Options>
      <div className="m-3">
        <Divider />
      </div>
      {/* Jared is gonna make this button work  */}
      <div className="mx-6 pb-6 justify-self-center">
        <ButtonLink
          onClick={props.onClickCreate}
          icon={<Add />}
          content="Or Create a New Section"
        />
      </div>
    </Combobox>
  );
};

const SearchItem: React.FC<{
  active: boolean;
  className?: string;
}> = (props) => {
  return (
    <div
      className={`w-full px-6 py-0.5 ${props.className || ""} ${
        props.active ? "bg-bg-blue" : ""
      }`}
    >
      {props.children}
    </div>
  );
};
