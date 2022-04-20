import { ButtonPrimary, ButtonTertiary, ButtonLink } from "components/Buttons";
import { FindOrCreate } from "components/FindOrCreateEntity";
import {
  Add,
  Card,
  Checkmark,
  DeckSmall,
  SectionLinkedCard,
  SectionText,
} from "components/Icons";
import { Divider, Modal } from "components/Layout";
import { ReplicacheContext, useIndex } from "hooks/useReplicache";
import { useContext, useState } from "react";
import { ulid } from "src/ulid";
import { Combobox, Dialog, Transition } from "@headlessui/react";

export const AddSection = (props: { cardEntity: string }) => {
  let [open, setOpen] = useState(false);
  let [createModal, setCreateModal] = useState(false);
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

      <button className="text-test-pink" onClick={() => setCreateModal(true)}>
        create modal here
      </button>
      {createModal ? (
        <Modal open={createModal} onClose={() => setCreateModal(false)}>
          <h3>Create a New Section!</h3>
          <div className="flex flex-col gap-2">
            <h4>Section Name</h4>
            <input
              type="text"
              aria-label="section name"
              onChange={(e) =>
                setSection({ ...section, name: e.currentTarget.value })
              }
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
                onChange={() => setSection({ ...section, type: "string" })}
              />
              <label
                htmlFor="text-section"
                className="grid grid-cols-[max-content_max-content] gap-2"
              >
                <SectionText
                  className={
                    type === "string" ? "text-grey-15" : "text-grey-55"
                  }
                />
                <p className={type === "string" ? "font-bold" : "text-grey-35"}>
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
                onChange={() => setSection({ ...section, type: "reference" })}
              />
              <label
                htmlFor="linked-card-section"
                className="grid grid-cols-[max-content_max-content] gap-2"
              >
                <SectionLinkedCard
                  className={
                    type === "reference" ? "text-grey-15" : "text-grey-55"
                  }
                />
                <p
                  className={
                    type === "reference" ? "font-bold" : "text-grey-35"
                  }
                >
                  Linked Card Section
                </p>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-[max-content_max-content] gap-4 justify-self-end">
            <ButtonTertiary
              content="Nevermind"
              onClick={() => setCreateModal(false)}
            />
            <ButtonPrimary
              content="Add Section"
              disabled={!section.name}
              onClick={async () => {
                if (!section.name) return;
                await rep?.rep.mutate.addSection({
                  newSectionEntity: ulid(),
                  sectionName: section.name,
                  type: type as "reference" | "string",
                  cardEntity: props.cardEntity,
                  positions: "",
                });
                setCreateModal(false);
                setSection({ ...section, name: "" });
              }}
            />
          </div>
        </Modal>
      ) : null}
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
      {/* START ADD SECTION BUTTON */}
      <button className="flex gap-2 text-grey-80" onClick={() => setOpen(true)}>
        <Add />
        <h4 className="text-grey-80 ">Add Section</h4>
      </button>
      {/* END ADD SECTION BUTTON */}
      <SelectSection
        open={open}
        onSelect={(e) => {
          let name = props.items.find((s) => s.entity === e.entity)?.display;
          if (name) props.setName(name);

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

// Can I adapt this to work for section names as well?
// They are a single select
// use react state not replicache state
export const SelectSection = (props: {
  open: boolean;
  onClose: () => void;
  items: { display: string; entity: string; icon?: React.ReactElement }[];
  selected: string[];
  onSelect: (id: { entity: string }) => void;
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
    <Transition show={props.open} className="fixed">
      <Dialog
        onClose={props.onClose}
        className="fixed z-10 inset-0 overflow-y-hidden"
      >
        <Dialog.Overlay className="overlay" />

        <div className="">
          <Combobox
            value=""
            onChange={(c) => {
              props.onSelect({ entity: c });
            }}
            as="div"
            className={`
              relative
              max-w-md h-fit max-h-full
              w-[calc(100vw-2.5rem)]
              z-10 
              mx-auto mb-20 mt-10
              grid grid-rows-[min-content_auto_min-content] 
              bg-white shadow-drop border border-grey-80 rounded-md
              `}
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
                    key={item.entity}
                    value={item.entity}
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
              <ButtonLink icon={<Add />} content="Or Create a New Section" />
            </div>
          </Combobox>
        </div>
      </Dialog>
    </Transition>
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
