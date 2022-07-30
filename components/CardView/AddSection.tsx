import { ButtonPrimary, ButtonTertiary, ButtonLink } from "components/Buttons";
import { Add, SectionLinkedCard, SectionText } from "components/Icons";
import { Divider, Modal } from "components/Layout";
import { ReplicacheContext, useIndex, useMutations } from "hooks/useReplicache";
import { useContext, useState } from "react";
import { ulid } from "src/ulid";
import { Combobox, Dialog } from "@headlessui/react";

export const AddSection = (props: { cardEntity: string }) => {
  let [state, setState] = useState<"closed" | "addExisting" | "createNew">(
    "closed"
  );
  let [createInput, setCreateInput] = useState("");
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

  return !authorized ? null : (
    <div className="addSectionButton grid grid-auto-row gap-4 mt-8 ">
      <Divider />
      <button onClick={() => setState("addExisting")}>
        <div className="flex gap-2 text-grey-80 hover:text-accent-blue">
          <Add />
          <h4 className="text-inherit">Add Section</h4>
        </div>
      </button>

      <Dialog
        className="fixed z-10 inset-0 overflow-y-hidden"
        open={state !== "closed"}
        onClose={() => {
          setState("closed");
          setCreateInput("");
        }}
      >
        <Dialog.Overlay className="overlay" />
        <div
          className={`
              relative
              max-w-md h-fit 
              w-[calc(100vw-2.5rem)]
              z-10 
              mx-auto mb-20 mt-10
              bg-white shadow-drop border border-grey-80 rounded-md`}
        >
          {state === "addExisting" ? (
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
              onClickCreateWithInput={(input: string) => {
                setState("createNew");
                setCreateInput(input);
              }}
              onClickCreate={() => setState("createNew")}
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
              createInput={createInput}
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
        </div>
      </Dialog>
    </div>
  );
};

export const SelectSection = (props: {
  onClickCreate: () => void;
  onClickCreateWithInput: (input: string) => void;
  items: { display: string; value: string; icon?: React.ReactElement }[];
  selected: string[];
  onSelect: (section: { entity: string }) => void;
}) => {
  let [input, setInput] = useState("");
  let items = props.items.filter((f) => {
    if (/[A-Z]/g.test(input)) return f.display.includes(input);
    return f.display.toLocaleLowerCase().includes(input.toLocaleLowerCase());
  });

  let inputExists = !!items.find(
    (i) => i.display.toLocaleLowerCase() === input.toLocaleLowerCase()
  );

  return (
    <Combobox
      value=""
      onChange={(optionValue: string) => {
        console.log(optionValue);
        if (optionValue === "create") {
          if (inputExists) return;
          {
            input === ""
              ? props.onClickCreate()
              : props.onClickCreateWithInput(input);
          }
        }
        props.onSelect({ entity: optionValue });
      }}
      as="div"
      className="                         
      h-fit max-h-[calc(100vh-160px)]
      flex flex-col items-stretch gap-3"
    >
      <div className="mx-4 mt-4">
        <Combobox.Input
          value={input}
          className="w-full"
          placeholder="search for a section..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </div>
      {/* I am aware the max height in the Combobox.Options is gross, but max-h-full does work and this is the best i could do D:*/}
      <div className="overflow-y-scroll">
        <Combobox.Options
          static
          className="w-full mb-4 flex-col flex gap-2 h-min"
        >
          <Combobox.Option
            key={"create"}
            value={"create"}
            className="cursor-pointer"
            disabled={inputExists}
          >
            {({ active }) => {
              return (
                <SearchItem active={active}>
                  <div
                    className={`grid grid-cols-[max-content_auto] gap-2 font-bold ${
                      inputExists ? "text-grey-55" : "text-accent-blue"
                    } `}
                  >
                    <Add />

                    {inputExists
                      ? `"${input}" already exists`
                      : input === ""
                      ? "Create New Section"
                      : `Create "${input}" section`}
                  </div>
                </SearchItem>
              );
            }}
          </Combobox.Option>
          {items.map((item) => {
            return (
              <>
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
              </>
            );
          })}
        </Combobox.Options>
      </div>
    </Combobox>
  );
};

const CreateSectionDialog = (props: {
  onCreate: (s: { name: string; type: "reference" | "string" }) => void;
  onClose: () => void;
  createInput?: string;
}) => {
  let [sectionName, setSectionName] = useState(props.createInput);
  let [sectionType, setSectionType] = useState<"reference" | "string">();
  return (
    <>
      <div className="grid grid-flow-row gap-3 mx-3 mt-3">
        <div className="flex flex-col gap-2">
          <h4>Section Name</h4>
          <input
            type="text"
            value={props.createInput ? props.createInput : sectionName}
            aria-label="section name"
            onChange={(e) => setSectionName(e.currentTarget.value)}
          />
        </div>
        <div className="sectionTypePicker grid grid-flow-row items-center w-full gap-1 ">
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
      </div>
      <div className="grid grid-cols-[max-content_max-content] gap-4 place-self-end mt-6 mx-3 mb-3">
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

const SearchItem: React.FC<{
  active: boolean;
  className?: string;
}> = (props) => {
  return (
    <div
      className={`w-full px-3 py-0.5 ${props.className || ""} ${
        props.active ? "bg-bg-blue" : ""
      }`}
    >
      {props.children}
    </div>
  );
};
